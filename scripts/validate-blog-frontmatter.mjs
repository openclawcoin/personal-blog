import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const BLOG_DIR = path.resolve("src/content/blog");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function stripQuotes(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }

  return text;
}

function hasUnclosedQuote(raw) {
  const text = String(raw || "").trim();
  if (!text) return false;
  if (text.startsWith('"') && !text.endsWith('"')) return true;
  if (text.startsWith("'") && !text.endsWith("'")) return true;
  return false;
}

function parseInlineArray(raw) {
  const text = String(raw || "").trim();
  if (!(text.startsWith("[") && text.endsWith("]"))) {
    throw new Error("tags 内联数组格式错误，应为 [\"a\", \"b\"]");
  }

  const inner = text.slice(1, -1).trim();
  if (!inner) return [];

  const parts = [];
  let cursor = "";
  let quote = "";

  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];

    if (quote) {
      cursor += ch;
      if (ch === quote && inner[i - 1] !== "\\") {
        quote = "";
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      cursor += ch;
      continue;
    }

    if (ch === ",") {
      parts.push(cursor.trim());
      cursor = "";
      continue;
    }

    cursor += ch;
  }

  if (quote) {
    throw new Error("tags 内联数组中存在未闭合引号");
  }

  parts.push(cursor.trim());
  return parts.map((item) => stripQuotes(item)).filter(Boolean);
}

function parseFrontmatter(text) {
  const normalized = String(text || "").replace(/^\uFEFF/, "");
  const matched = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!matched) {
    throw new Error("缺少 frontmatter，文件必须以 --- 开头并以 --- 结束");
  }

  const data = {};
  const lines = matched[1].split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const keyMatch = line.match(/^([A-Za-z][\w]*)\s*:\s*(.*)$/);
    if (!keyMatch) {
      throw new Error(`第 ${i + 1} 行格式无效：${line}`);
    }

    const key = keyMatch[1];
    const rawValue = keyMatch[2] ?? "";

    if (hasUnclosedQuote(rawValue)) {
      throw new Error(`字段 ${key} 存在未闭合引号`);
    }

    if (key === "tags") {
      const inline = String(rawValue).trim();

      if (!inline) {
        const tags = [];
        let j = i + 1;

        while (j < lines.length) {
          const listLine = lines[j];
          const listMatch = listLine.match(/^\s*-\s*(.+)\s*$/);
          if (!listMatch) break;
          tags.push(stripQuotes(listMatch[1]));
          j += 1;
        }

        data.tags = tags;
        i = j - 1;
      } else {
        data.tags = parseInlineArray(inline);
      }

      continue;
    }

    data[key] = stripQuotes(rawValue);
  }

  return data;
}

function isValidDateText(dateText) {
  const text = String(dateText || "").trim();
  if (!DATE_RE.test(text)) return false;

  const [year, month, day] = text.split("-").map((v) => Number(v));
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateData(fileName, data) {
  const errors = [];

  if ("publishDate" in data) {
    errors.push("检测到 publishDate，请改为 pubDate");
  }

  if (!("title" in data) || !String(data.title || "").trim()) {
    errors.push("title 不能为空");
  }

  if (!("description" in data) || !String(data.description || "").trim()) {
    errors.push("description 不能为空");
  }

  if (!("pubDate" in data)) {
    errors.push("缺少 pubDate 字段");
  } else if (!isValidDateText(data.pubDate)) {
    errors.push(`pubDate 无效：${data.pubDate}`);
  }

  if ("tags" in data) {
    if (!Array.isArray(data.tags)) {
      errors.push("tags 必须是数组");
    } else if (data.tags.some((tag) => !String(tag || "").trim())) {
      errors.push("tags 中包含空值");
    }
  }

  if ("draft" in data) {
    const draftText = String(data.draft || "").trim().toLowerCase();
    if (!(draftText === "true" || draftText === "false")) {
      errors.push("draft 必须是 true 或 false");
    }
  }

  if (String(data.title || "").includes("�") || String(data.description || "").includes("�")) {
    errors.push("title/description 含乱码字符（�），请检查编码");
  }

  return errors;
}

async function main() {
  const entries = await readdir(BLOG_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "zh-CN"));

  let failed = 0;

  for (const file of files) {
    const fullPath = path.join(BLOG_DIR, file);

    try {
      const text = await readFile(fullPath, "utf8");
      const data = parseFrontmatter(text);
      const errors = validateData(file, data);

      if (errors.length) {
        failed += 1;
        console.error(`\n[FAIL] ${file}`);
        for (const message of errors) {
          console.error(`  - ${message}`);
        }
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`\n[FAIL] ${file}`);
      console.error(`  - 解析失败：${message}`);
    }
  }

  if (failed > 0) {
    console.error(`\n校验失败：${failed} 个文章文件存在 frontmatter 问题。`);
    process.exit(1);
  }

  console.log(`校验通过：${files.length} 篇文章 frontmatter 格式正常。`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
