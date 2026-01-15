// scripts/shinyshowcase.mjs
// Shiny Showcase CSV → validated, normalized JSON
// CI HARD CONTRACT

import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';
import { validateRows } from './lib/validateRows.mjs';
import { shinyShowcaseContract } from './contracts/shinyshowcase.contract.mjs';

const CSV_URL = process.env.SHINYSHOWCASE_CSV;

if (!CSV_URL) {
  throw new Error('SHINYSHOWCASE_CSV env variable missing');
}

// -----------------------------
// Helpers
// -----------------------------

function preserveMember(name) {
  return name.trim();
}

function normalizePokemon(name) {
  return name
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[\s.'’]/g, '');
}

// -----------------------------
// Fetch + parse
// -----------------------------

const csvText = await fetchCsv(CSV_URL);
const parsed = parseCsv(csvText);

// -----------------------------
// EMPTY ROW FIX (PRIMARY FIELD = ot)
// -----------------------------

const rows = parsed.filter(
  r => r.ot && r.ot.trim() !== ''
);

// -----------------------------
// Pre-normalize for validation
// -----------------------------

rows.forEach(row => {
  if (row.method) row.method = row.method.toLowerCase().trim();
});

// -----------------------------
// Validate against schema
// -----------------------------

validateRows({
  rows,
  schema: shinyShowcaseContract,
  sheet: 'shinyshowcase',
});

// -----------------------------
// Normalize (CI owns correctness)
// -----------------------------

const data = rows.map(row => ({
  ot: preserveMember(row.ot),
  pokemon: normalizePokemon(row.pokemon),

  method: row.method || null,

  secret: row.secret === 'TRUE',
  alpha: row.alpha === 'TRUE',
  run: row.run === 'TRUE',
  lost: row.lost === 'TRUE',
  sold: row.sold === 'TRUE',

  clip: row.clip?.trim() || null,
  notes: row.notes?.trim() || null,
}));

// -----------------------------
// Write versioned JSON
// -----------------------------

await writeJson('data/shinyshowcase.json', {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: 'google-sheets',
  data,
});
