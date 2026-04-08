// scripts/check-feature-boundaries.mjs
// v2.0.0-beta
// Checks feature imports against the current TeamShroom boundary rules

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const FEATURES_DIR = path.join(ROOT, "src", "features");

const ALLOWED_PREFIXES = [
  "src/features/",
  "src/domains/",
  "src/ui/",
  "src/app/",
  "src/data/",
  "src/utils/",
];

const ALLOWED_FEATURE_BRIDGES = [
  {
    from: "src/features/pokedex/pokedex.adapter.js",
    toPrefix: "src/features/shinydex/",
  },
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

function normalizeImportPath(relFile, imp) {
  return imp.startsWith("/")
    ? imp.slice(1)
    : path
        .normalize(path.join(path.dirname(relFile), imp))
        .replace(/\\/g, "/");
}

function isAllowedFeatureBridge(relFile, normalized) {
  return ALLOWED_FEATURE_BRIDGES.some(
    (rule) => relFile === rule.from && normalized.startsWith(rule.toPrefix)
  );
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

    const normalized = normalizeImportPath(relFile, imp);

    if (!ALLOWED_PREFIXES.some((p) => normalized.startsWith(p))) {
      violations.push(`${relFile}: forbidden import "${imp}"`);
      continue;
    }

    if (normalized.startsWith("src/features/")) {
      const targetFeature = normalized.split("/")[2];
      if (targetFeature !== feature && !isAllowedFeatureBridge(relFile, normalized)) {
        violations.push(`${relFile}: cross-feature import "${imp}"`);
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
