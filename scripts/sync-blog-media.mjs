import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const SOURCE_DIR = path.resolve("src/content/blog");
const TARGET_DIR = path.resolve("public/src/content/blog");

function isMarkdownFile(name) {
  return name.toLowerCase().endsWith(".md");
}

async function copyMediaTree(sourceDir, targetDir) {
  const entries = await readdir(sourceDir, { withFileTypes: true });

  await mkdir(targetDir, { recursive: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyMediaTree(sourcePath, targetPath);
      continue;
    }

    if (!entry.isFile() || isMarkdownFile(entry.name)) {
      continue;
    }

    await mkdir(path.dirname(targetPath), { recursive: true });
    await cp(sourcePath, targetPath, { force: true });
  }
}

async function main() {
  await rm(TARGET_DIR, { recursive: true, force: true });
  await copyMediaTree(SOURCE_DIR, TARGET_DIR);
  console.log(`Blog media synced to ${TARGET_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});