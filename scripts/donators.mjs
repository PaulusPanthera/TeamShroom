// scripts/donators.mjs
// Donators CSV → validated, normalized JSON
// CI HARD CONTRACT

import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';
import { validateRows } from './lib/validateRows.mjs';
import { donatorsContract } from './contracts/donators.contract.mjs';

const CSV_URL = process.env.DONATORS_CSV;

if (!CSV_URL) {
  throw new Error('DONATORS_CSV env variable missing');
}

// -----------------------------
// Helpers (normalization only)
// -----------------------------

function normalizeDate(value, rowNum) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(
      `[donators] Row ${rowNum}: invalid date "${value}"`
    );
  }
  return value;
}

function normalizeValue(value, rowNum) {
  const cleaned = String(value).replace(/\./g, '');
  const num = Number(cleaned);

  if (!Number.isInteger(num) || num < 0) {
    throw new Error(
      `[donators] Row ${rowNum}: invalid value "${value}"`
    );
  }

  return num;
}

function normalizeOptionalString(value) {
  const v = value?.trim();
  return v ? v : null;
}

// -----------------------------
// Fetch + parse
// -----------------------------

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

// -----------------------------
// Validate against schema
// -----------------------------

validateRows({
  rows,
  schema: donatorsContract,
  sheet: 'donators',
});

// -----------------------------
// Normalize (CI owns correctness)
// -----------------------------

const data = rows
  // primary field = date
  .filter(r => r.date && r.date.trim() !== '')
  .map((row, index) => {
    const rowNum = index + 2;

    return {
      date: normalizeDate(row.date.trim(), rowNum),
      name: row.name.trim(),
      donation: normalizeOptionalString(row.donation),
      value: normalizeValue(row.value, rowNum),
    };
  });

// -----------------------------
// Write versioned JSON
// -----------------------------

await writeJson('data/donators.json', {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: 'google-sheets',
  data,
});
