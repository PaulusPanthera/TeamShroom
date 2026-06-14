// scripts/members.mjs
// v2.0.0-beta
// Members CSV → validated, normalized JSON. Keeps roster join date and nationality metadata in the generated members dataset.

import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';
import { validateRows } from './lib/validateRows.mjs';
import { membersContract } from './contracts/members.contract.mjs';

const CSV_URL = process.env.MEMBERS_CSV;

if (!CSV_URL) {
  throw new Error('MEMBERS_CSV env variable missing');
}

// -----------------------------
// Helpers
// -----------------------------

function normalizeRole(value) {
  return String(value || '').toLowerCase().trim();
}

function normalizeSprite(value) {
  return String(value || '').toLowerCase().trim();
}

function normalizeOptionalString(value) {
  return String(value || '').trim();
}

function normalizeMemberSince(value, rowNum) {
  const raw = normalizeOptionalString(value);
  if (!raw) return '';

  // Roster OCR/source sheet currently uses German-style dates (dd.mm.yy).
  // Accept a tiny safe set so Google export formatting does not randomly break CI:
  // - dd.mm.yy
  // - dd.mm.yyyy
  // - yyyy-mm-dd
  const german = /^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/.exec(raw);
  if (german) {
    const day = Number(german[1]);
    const month = Number(german[2]);
    const year = Number(german[3]);

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 0) {
      return raw;
    }
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) {
    const month = Number(iso[2]);
    const day = Number(iso[3]);

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return raw;
    }
  }

  throw new Error(
    `[members] Row ${rowNum}: invalid member_since "${value}" (expected dd.mm.yy, dd.mm.yyyy, yyyy-mm-dd, or blank)`
  );
}

// -----------------------------
// Fetch + parse
// -----------------------------

const csvText = await fetchCsv(CSV_URL);
const rawRows = parseCsv(csvText);

// -----------------------------
// Strip empty rows (PRIMARY KEY = name)
// -----------------------------

const rows = rawRows.filter(
  r => r.name && r.name.trim() !== ''
);

// -----------------------------
// Pre-normalize for validation
// -----------------------------

rows.forEach(row => {
  row.active = String(row.active || '').trim();
  if (row.role) row.role = normalizeRole(row.role);
  if (row.sprite) row.sprite = normalizeSprite(row.sprite);
  if (row.member_since) row.member_since = normalizeOptionalString(row.member_since);
  if (row.nationality) row.nationality = normalizeOptionalString(row.nationality);
});

// -----------------------------
// Validate against schema
// -----------------------------

validateRows({
  rows,
  schema: membersContract,
  sheet: 'members',
});

// -----------------------------
// Normalize (CI owns correctness)
// -----------------------------

const seen = new Set();

const data = rows.map((row, index) => {
  const rowNum = index + 2;
  const name = row.name.trim();
  const key = name.toLowerCase();

  if (seen.has(key)) {
    throw new Error(`[members] Row ${rowNum}: duplicate member name "${name}"`);
  }
  seen.add(key);

  return {
    name,
    active: row.active === 'TRUE',
    role: normalizeRole(row.role),
    sprite:
      row.sprite === '' || row.sprite === 'none'
        ? null
        : normalizeSprite(row.sprite),
    member_since: normalizeMemberSince(row.member_since, rowNum),
    nationality: normalizeOptionalString(row.nationality),
  };
});

// -----------------------------
// Write versioned JSON
// -----------------------------

await writeJson('data/members.json', {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: 'google-sheets',
  data,
});
