import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';

const CSV_URL = process.env.MEMBERS_CSV;

const ALLOWED_ROLES = new Set([
  'spore',
  'shroom',
  'shinyshroom',
  'mushcap',
]);

const ALLOWED_SPRITES = new Set([
  'png',
  'gif',
  'jpg',
  'none',
  '',
]);

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

const normalized = rows.map((row, index) => {
  const name = row.name?.trim();
  if (!name) {
    throw new Error(`Row ${index + 2}: missing name`);
  }

  const role = row.role?.toLowerCase().trim();
  if (!ALLOWED_ROLES.has(role)) {
    throw new Error(`Row ${index + 2}: invalid role "${row.role}"`);
  }

  const spriteRaw = row.sprite?.toLowerCase().trim() ?? '';
  if (!ALLOWED_SPRITES.has(spriteRaw)) {
    throw new Error(`Row ${index + 2}: invalid sprite "${row.sprite}"`);
  }

  return {
    name,
    active: row.active === 'TRUE',
    role,
    sprite: spriteRaw === '' || spriteRaw === 'none' ? null : spriteRaw,
  };
});

await writeJson('data/members.json', normalized);
