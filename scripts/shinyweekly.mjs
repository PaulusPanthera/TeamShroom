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

function normalizeWeekOrder(value, rowNum) {
  if (value === '' || value === undefined || value === null) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  if (!/^\d+$/.test(raw)) {
    throw new Error(
      `[shinyweekly] Row ${rowNum}: invalid week_order "${value}"`
    );
  }

  const num = Number(raw);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(
      `[shinyweekly] Row ${rowNum}: invalid week_order "${value}"`
    );
  }

  return String(num).padStart(3, '0');
}

function weekOrderSortValue(row) {
  const raw = row && row.week_order;
  if (!raw) return Number.POSITIVE_INFINITY;

  const num = Number(raw);
  return Number.isFinite(num) ? num : Number.POSITIVE_INFINITY;
}

function compareWeeklyRows(a, b) {
  const ad = String(a && a.date_start ? a.date_start : '');
  const bd = String(b && b.date_start ? b.date_start : '');
  if (ad !== bd) return ad.localeCompare(bd);

  const ae = String(a && a.date_end ? a.date_end : '');
  const be = String(b && b.date_end ? b.date_end : '');
  if (ae !== be) return ae.localeCompare(be);

  const aw = String(a && a.week ? a.week : '');
  const bw = String(b && b.week ? b.week : '');
  if (aw !== bw) return aw.localeCompare(bw);

  const ao = weekOrderSortValue(a);
  const bo = weekOrderSortValue(b);
  if (ao !== bo) return ao - bo;

  return (a.__sourceIndex || 0) - (b.__sourceIndex || 0);
}

function assertUniqueWeekOrder(rows) {
  const seen = new Map();

  rows.forEach((row, index) => {
    if (!row.week_order) return;

    const key = `${row.week}::${row.week_order}`;
    if (!seen.has(key)) {
      seen.set(key, index + 2);
      return;
    }

    throw new Error(
      `[shinyweekly] Row ${index + 2}: duplicate week_order "${row.week_order}" for week "${row.week}" (first seen at row ${seen.get(key)})`
    );
  });
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
    __sourceIndex: index,

    week: row.week.trim(),
    week_label: row.week_label?.trim() || null,
    week_order: normalizeWeekOrder(row.week_order, rowNum),

    date_start: normalizeDate(row.date_start, rowNum, 'date_start'),
    date_end: normalizeDate(row.date_end, rowNum, 'date_end'),
    date_catch: row.date_catch ? normalizeDate(row.date_catch, rowNum, 'date_catch') : null,

    ot: preserveMember(row.ot),
    pokemon: normalizePokemon(row.pokemon),

    method: row.method || null,
    encounter: normalizeEncounter(row.encounter, rowNum),

    secret: row.secret === 'TRUE',
    alpha: row.alpha === 'TRUE',
    run: row.run === 'TRUE',
    lost: row.lost === 'TRUE',

    clip: row.clip?.trim() || null,
    notes: row.notes?.trim() || null,
    location: row.location?.trim() || null,
  };
});

assertUniqueWeekOrder(data);
data.sort(compareWeeklyRows);
data.forEach(row => {
  delete row.__sourceIndex;
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
