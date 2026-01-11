// scripts/shinyweekly.mjs
// Shiny Weekly CSV → validated, normalized JSON
// CI HARD CONTRACT

import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';
import { validateRows } from './lib/validateRows.mjs';
import { shinyWeeklyContract } from './contracts/shinyweekly.contract.mjs';

const CSV_URL = process.env.SHINY_WEEKLY_CSV;

if (!CSV_URL) {
  throw new Error('SHINY_WEEKLY_CSV env variable missing');
}

// -----------------------------
// Helpers (normalization only)
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

function normalizeDate(value, rowNum, field) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(
      `[shinyweekly] Row ${rowNum}: invalid ${field} "${value}"`
    );
  }
  return value;
}

function normalizeEncounter(value, rowNum) {
  if (value === '' || value === undefined) return null;

  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) {
    throw new Error(
      `[shinyweekly] Row ${rowNum}: invalid encounter "${value}"`
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
// Drop empty rows (PRIMARY FIELD = week)
// -----------------------------

const meaningfulRows = rows.filter(
  row => row.week && row.week.trim() !== ''
);

// -----------------------------
// Pre-normalize for validation
// -----------------------------

meaningfulRows.forEach(row => {
  if (row.method) row.method = row.method.toLowerCase().trim();
});

// -----------------------------
// Validate against schema
// -----------------------------

validateRows({
  rows: meaningfulRows,
  schema: shinyWeeklyContract,
  sheet: 'shinyweekly',
});

// -----------------------------
// Normalize (CI owns correctness)
// -----------------------------

const data = meaningfulRows.map((row, index) => {
  const rowNum = index + 2;

  return {
    week: row.week.trim(),
    week_label: row.week_label?.trim() || null,

    date_start: normalizeDate(row.date_start, rowNum, 'date_start'),
    date_end: normalizeDate(row.date_end, rowNum, 'date_end'),

    ot: normalizeMember(row.ot),
    pokemon: normalizePokemon(row.pokemon),

    method: row.method || null,
    encounter: normalizeEncounter(row.encounter, rowNum),

    secret: row.secret === 'TRUE',
    alpha: row.alpha === 'TRUE',
    run: row.run === 'TRUE',
    lost: row.lost === 'TRUE',

    clip: row.clip?.trim() || null,
    notes: row.notes?.trim() || null,
  };
});

// -----------------------------
// Write versioned JSON
// -----------------------------

await writeJson('data/shinyweekly.json', {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: 'google-sheets',
  data,
});
