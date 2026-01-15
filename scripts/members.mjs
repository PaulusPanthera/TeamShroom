// scripts/members.mjs
// Members CSV → validated, normalized JSON
// CI HARD CONTRACT

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
  if (row.role) row.role = row.role.toLowerCase().trim();
  if (row.sprite) row.sprite = row.sprite.toLowerCase().trim();
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

const data = rows.map(row => ({
  name: row.name.trim(),
  active: row.active === 'TRUE',
  role: row.role,
  sprite:
    row.sprite === '' || row.sprite === 'none'
      ? null
      : row.sprite,
}));

// -----------------------------
// Write versioned JSON
// -----------------------------

await writeJson('data/members.json', {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: 'google-sheets',
  data,
});
