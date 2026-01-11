// scripts/pokemon.mjs
// Pokémon CSV → validated, normalized JSON
// CI HARD CONTRACT

import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';
import { validateRows } from './lib/validateRows.mjs';
import { pokemonContract } from './contracts/pokemon.contract.mjs';

const CSV_URL = process.env.POKEMON_CSV;

if (!CSV_URL) {
  throw new Error('POKEMON_CSV env variable missing');
}

// -----------------------------
// Helpers (normalization only)
// -----------------------------

function normalizePokemonName(name) {
  return name
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[\s.'’]/g, '');
}

function normalizeFamily(value) {
  if (!value) return [];
  return value
    .split(',')
    .map(v => normalizePokemonName(v.trim()))
    .filter(Boolean);
}

// -----------------------------
// Fetch + parse
// -----------------------------

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

// -----------------------------
// Pre-normalize for validation
// -----------------------------

rows.forEach(row => {
  if (row.tier) row.tier = row.tier.toLowerCase().trim();
  if (row.region) row.region = row.region.toLowerCase().trim();
});

// -----------------------------
// Validate against schema
// -----------------------------

validateRows({
  rows,
  schema: pokemonContract,
  sheet: 'pokemon',
});

// -----------------------------
// Normalize (CI owns correctness)
// -----------------------------

const data = rows
  .filter(r => r.dex && r.dex.trim() !== '')
  .map(row => {
    return {
      dex: row.dex.trim(),
      pokemon: normalizePokemonName(row.pokemon),
      family: normalizeFamily(row.family),
      tier: row.tier,
      region: row.region || null,
      rarity: row.rarity?.trim() || null,
      show: row.show !== 'FALSE',
    };
  });

// -----------------------------
// Write versioned JSON
// -----------------------------

await writeJson('data/pokemon.json', {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: 'google-sheets',
  data,
});
