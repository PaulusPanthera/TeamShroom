// scripts/pokemon.mjs
// Pokémon CSV → validated, normalized JSON
// CI HARD CONTRACT

import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';
import { validateRows } from './lib/validateRows.mjs';
import { pokemonContract } from './contracts/pokemon.contract.mjs';
import fs from 'node:fs';

const CSV_URL = process.env.POKEMON_CSV;

const TIER_SYSTEM = JSON.parse(
  fs.readFileSync(new URL('./data/pokemon-tiers-2026.json', import.meta.url), 'utf8')
);
const OFFICIAL_2026_TIERS = TIER_SYSTEM?.tiers || {};
const VALID_2026_TIERS = new Set(Object.keys(TIER_SYSTEM?.points || {}));

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
const rawRows = parseCsv(csvText);

// -----------------------------
// Strip empty rows (PRIMARY KEY = dex)
// -----------------------------

const rows = rawRows.filter(
  r => r.dex && r.dex.trim() !== ''
);

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

const data = rows.map(row => {
  const pokemon = normalizePokemonName(row.pokemon);
  const tier = OFFICIAL_2026_TIERS[pokemon];

  if (!tier || !VALID_2026_TIERS.has(tier)) {
    throw new Error(`Missing Official Shiny Wars 2026 tier mapping for ${pokemon}`);
  }

  return {
    dex: row.dex.trim(),
    pokemon,
    family: normalizeFamily(row.family),
    tier,
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
  tierSystem: 'official-shiny-wars-2026',
  data,
});
