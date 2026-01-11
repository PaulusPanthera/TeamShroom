import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';

const CSV_URL = process.env.POKEMON_CSV;

const ALLOWED_REGIONS = new Set([
  'kanto',
  'johto',
  'hoenn',
  'sinnoh',
  'unova',
]);

function parseTier(value, rowIndex) {
  const match = value?.match(/Tier\s*(\w+)/i);
  if (!match) {
    throw new Error(`Row ${rowIndex + 2}: invalid tier "${value}"`);
  }
  return match[1];
}

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

const normalized = rows
  // ✅ EMPTY ROW FIX
  .filter(row => row.dex && row.dex.trim() !== '')
  .map((row, index) => {
    const region = row.region?.trim().toLowerCase();
    if (!ALLOWED_REGIONS.has(region)) {
      throw new Error(`Row ${index + 2}: invalid region "${row.region}"`);
    }

    return {
      dex: row.dex.trim(),
      pokemon: row.pokemon?.trim().toLowerCase(),
      family: row.family?.trim().toLowerCase() || null,
      tier: parseTier(row.tier, index),
      region,
      rarity: row.rarity?.trim() || null,
      show: row.show === 'TRUE',
    };
  });

await writeJson('data/pokemon.json', normalized);
