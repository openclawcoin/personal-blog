import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const BLOG_DIR = path.resolve("src/content/blog");
const PUBLIC_DIR = path.resolve("public");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const AUDIO_EXT_RE = /\.(mp3|wav|ogg|m4a|aac|flac)(?:[?#].*)?$/i;

function stripQuotes(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }

  return text;
}

function hasUnclosedQuote(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return false;
  if (text.startsWith('"') && !text.endsWith('"')) return true;
  if (text.startsWith("'") && !text.endsWith("'")) return true;
  return false;
}

function parseInlineArray(raw) {
  const text = String(raw ?? "").trim();
  if (!(text.startsWith("[") && text.endsWith("]"))) {
    throw new Error('tags must use inline array syntax like ["a", "b"]');
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
    throw new Error("tags contains an unclosed quote");
  }

  parts.push(cursor.trim());
  return parts.map((item) => stripQuotes(item)).filter(Boolean);
}

function parseFrontmatter(text) {
  const normalized = String(text ?? "").replace(/^\uFEFF/, "");
  const matched = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!matched) {
    throw new Error("Missing frontmatter block at the top of the file");
  }

  const data = {};
  const lines = matched[1].split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const keyMatch = line.match(/^([A-Za-z][\w]*)\s*:\s*(.*)$/);
    if (!keyMatch) {
      throw new Error(`Invalid frontmatter syntax on line ${i + 1}: ${line}`);
    }

    const key = keyMatch[1];
    const rawValue = keyMatch[2] ?? "";

    if (hasUnclosedQuote(rawValue)) {
      throw new Error(`Field "${key}" contains an unclosed quote`);
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

  return {
    data,
    body: matched[2] ?? ""
  };
}

function isValidDateText(dateText) {
  const text = String(dateText ?? "").trim();
  if (!DATE_RE.test(text)) return false;

  const [year, month, day] = text.split("-").map((value) => Number(value));
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isLikelyAudioRef(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  if (text.startsWith("data:audio/")) return true;
  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      return AUDIO_EXT_RE.test(url.pathname) || AUDIO_EXT_RE.test(url.href);
    } catch {
      return AUDIO_EXT_RE.test(text);
    }
  }

  return AUDIO_EXT_RE.test(text);
}

function collectAudioRefs(data, body) {
  const refs = new Set();
  const directFields = [data.audio, data.audioUrl, data.music];

  for (const value of directFields) {
    if (isLikelyAudioRef(value)) {
      refs.add(String(value).trim());
    }
  }

  const text = String(body ?? "");
  const patterns = [
    /<(?:audio|source)\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
    /\[[^\]]*\]\(([^)]+)\)/gi,
    /(https?:\/\/[^\s)"']+\.(?:mp3|wav|ogg|m4a|aac|flac)(?:\?[^\s)"']*)?)/gi,
    /(?:^|[\s(>])((?:\/|\.\/|blog\/|src\/content\/blog\/|public\/)[^\s)"'\]]+\.(?:mp3|wav|ogg|m4a|aac|flac)(?:\?[^\s)"']*)?)/gi
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(text);
    while (match) {
      const candidate = String(match[1] ?? "").trim();
      if (isLikelyAudioRef(candidate)) {
        refs.add(candidate);
      }
      match = pattern.exec(text);
    }
  }

  return Array.from(refs);
}

function normalizeLocalAudioPath(value) {
  const text = String(value ?? "").trim();
  if (!text || /^https?:\/\//i.test(text) || text.startsWith("data:")) {
    return "";
  }

  const normalized = text.replace(/\\/g, "/").replace(/^\.\//, "");

  if (normalized.startsWith("/blog/")) {
    return path.join(BLOG_DIR, normalized.slice("/blog/".length));
  }

  if (normalized.startsWith("blog/")) {
    return path.join(BLOG_DIR, normalized.slice("blog/".length));
  }

  if (normalized.startsWith("/src/content/blog/")) {
    return path.resolve(normalized.slice(1));
  }

  if (normalized.startsWith("src/content/blog/")) {
    return path.resolve(normalized);
  }

  if (normalized.startsWith("/")) {
    return path.join(PUBLIC_DIR, normalized.slice(1));
  }

  if (normalized.startsWith("public/")) {
    return path.resolve(normalized);
  }

  return path.join(BLOG_DIR, normalized);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function validateRemoteAudio(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Range: "bytes=0-1"
      },
      redirect: "follow",
      signal: controller.signal
    });

    if (response.ok) {
      return "";
    }

    return `audio URL is not publicly accessible (${response.status}): ${url}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `audio URL check failed: ${url} (${message})`;
  } finally {
    clearTimeout(timeout);
  }
}

async function validateAudioRefs(fileName, data, body) {
  const refs = collectAudioRefs(data, body);
  const errors = [];

  for (const ref of refs) {
    if (/^https?:\/\//i.test(ref)) {
      const remoteError = await validateRemoteAudio(ref);
      if (remoteError) {
        errors.push(remoteError);
      }
      continue;
    }

    if (ref.startsWith("data:audio/")) {
      continue;
    }

    const localPath = normalizeLocalAudioPath(ref);
    if (!localPath) continue;

    if (!(await fileExists(localPath))) {
      errors.push(`audio file referenced by ${fileName} does not exist: ${ref}`);
    }
  }

  return errors;
}

function validateData(data) {
  const errors = [];
  const dateText = [data.pubDate, data.publishDate, data.date]
    .map((value) => String(value ?? "").trim())
    .find(Boolean);

  if (!String(data.title ?? "").trim()) {
    errors.push("title cannot be empty");
  }

  if (!dateText) {
    errors.push("Missing date field. Use pubDate, publishDate, or date.");
  } else if (!isValidDateText(dateText)) {
    errors.push(`Invalid date value "${dateText}". Use YYYY-MM-DD.`);
  }

  if ("tags" in data) {
    if (!Array.isArray(data.tags)) {
      errors.push("tags must be an array");
    } else if (data.tags.some((tag) => !String(tag ?? "").trim())) {
      errors.push("tags cannot contain empty values");
    }
  }

  if ("draft" in data) {
    const draftText = String(data.draft ?? "").trim().toLowerCase();
    if (!(draftText === "true" || draftText === "false")) {
      errors.push('draft must be either "true" or "false"');
    }
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
      const { data, body } = parseFrontmatter(text);
      const errors = validateData(data);
      const audioErrors = await validateAudioRefs(file, data, body);

      if (errors.length || audioErrors.length) {
        failed += 1;
        console.error(`\n[FAIL] ${file}`);
        for (const message of [...errors, ...audioErrors]) {
          console.error(`  - ${message}`);
        }
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`\n[FAIL] ${file}`);
      console.error(`  - Failed to parse frontmatter: ${message}`);
    }
  }

  if (failed > 0) {
    console.error(`\nFrontmatter validation failed for ${failed} file(s).`);
    process.exit(1);
  }

  console.log(`Frontmatter validation passed for ${files.length} post(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
