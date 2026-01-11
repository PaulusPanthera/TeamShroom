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

// fetch + parse
const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

// validate against schema
validateRows({
  rows,
  schema: membersContract,
  sheet: 'members',
});

// normalize (CI is source of truth)
const data = rows
  .filter(r => r.name && r.name.trim() !== '')
  .map(row => {
    const spriteRaw = row.sprite?.toLowerCase().trim() ?? '';

    return {
      name: row.name.trim(),
      active: row.active === 'TRUE',
      role: row.role.toLowerCase().trim(),
      sprite:
        spriteRaw === '' || spriteRaw === 'none'
          ? null
          : spriteRaw,
    };
  });

// write versioned JSON
await writeJson('data/members.json', {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: 'google-sheets',
  data,
});
