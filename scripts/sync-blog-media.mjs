import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const SOURCE_DIR = path.resolve("src/content/blog");
const TARGETS = {
  "public-src": {
    dir: path.resolve("public/src/content/blog"),
    clean: true
  },
  "dist-blog": {
    dir: path.resolve("dist/blog"),
    clean: false
  }
};

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
  const mode = process.argv[2] || "public-src";
  const target = TARGETS[mode];

  if (!target) {
    throw new Error(`Unknown sync target: ${mode}`);
  }

  if (target.clean) {
    await rm(target.dir, { recursive: true, force: true });
  }

  await copyMediaTree(SOURCE_DIR, target.dir);
  console.log(`Blog media synced to ${target.dir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});