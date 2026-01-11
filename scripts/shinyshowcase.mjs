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
// Normalization helpers
// -----------------------------

function normalizeMember(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '');
}

function normalizePokemon(name) {
  return name
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[\s.'’]/g, '');
}

function normalizeEncounter(value, rowNum) {
  if (value === '' || value === undefined) return null;

  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) {
    throw new Error(
      `[shinyshowcase] Row ${rowNum}: invalid encounter "${value}"`
    );
  }

  return num;
}

// -----------------------------
// Fetch + parse
// -----------------------------

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

// -----------------------------
// Pre-normalize (for validation)
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

const data = rows
  // PRIMARY FIELD = ot
  .filter(r => r.ot && r.ot.trim() !== '')
  .map((row, index) => {
    const rowNum = index + 2;

    return {
      ot: normalizeMember(row.ot),
      pokemon: normalizePokemon(row.pokemon),

      method: row.method || null,
      encounter: normalizeEncounter(row.encounter, rowNum),

      secret: row.secret === 'TRUE',
      alpha: row.alpha === 'TRUE',
      run: row.run === 'TRUE',
      lost: row.lost === 'TRUE',
      sold: row.sold === 'TRUE',
      favorite: row.favorite === 'TRUE',

      clip: row.clip?.trim() || null,
      notes: row.notes?.trim() || null,
    };
  });

// -----------------------------
// Write versioned JSON
// -----------------------------

await writeJson('data/shinyshowcase.json', {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: 'google-sheets',
  data,
});
