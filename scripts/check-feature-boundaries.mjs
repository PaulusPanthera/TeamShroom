// scripts/check-feature-boundaries.mjs
// v2.0.0-beta
// Enforces strict feature boundary import rules under src/features

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const FEATURES_DIR = path.join(ROOT, "src", "features");

const ALLOWED_PREFIXES = [
  "src/features/",
  "src/domains/",
  "src/ui/",
  "src/app/",
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p;
  });
}

function extractImports(source) {
  const regex =
    /import\s+(?:.+?\s+from\s+)?["']([^"']+)["']|import\(["']([^"']+)["']\)/g;
  const imports = [];
  let m;
  while ((m = regex.exec(source))) {
    imports.push(m[1] || m[2]);
  }
  return imports;
}

const files = walk(FEATURES_DIR).filter((f) => f.endsWith(".js")).sort();

const violations = [];

for (const file of files) {
  const relFile = path.relative(ROOT, file).replace(/\\/g, "/");
  const parts = relFile.split("/");
  const feature = parts[2];

  const src = fs.readFileSync(file, "utf8");
  const imports = extractImports(src).sort();

  for (const imp of imports) {
    if (!imp.startsWith("/src/") && !imp.startsWith("./") && !imp.startsWith("../")) {
      continue;
    }

    const normalized = imp.startsWith("/")
      ? imp.slice(1)
      : path
          .normalize(path.join(path.dirname(relFile), imp))
          .replace(/\\/g, "/");

    if (!ALLOWED_PREFIXES.some((p) => normalized.startsWith(p))) {
      violations.push(
        `${relFile}: forbidden import "${imp}"`
      );
      continue;
    }

    if (normalized.startsWith("src/features/")) {
      const targetFeature = normalized.split("/")[2];
      if (targetFeature !== feature) {
        violations.push(
          `${relFile}: cross-feature import "${imp}"`
        );
      }
    }
  }
}

violations.sort();

if (violations.length > 0) {
  for (const v of violations) console.error(v);
  process.exit(1);
}

process.exit(0);

{
  "name": "TeamShroom",
  "version": "v2.0.0-beta",
  "private": true,
  "scripts": {
    "check:boundaries": "node scripts/check-feature-boundaries.mjs"
  }
}

name: feature-boundaries

on:
  push:
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run check:boundaries
