// src/data/pokemondatabuilder.js
// Pokémon tier, family, and point data builder
// Google Sheets CSV → runtime maps
// Design System v1 — pure data layer

import { normalizePokemonName } from '../utils/utils.js';

/* ---------------------------------------------------------
   CONFIG
--------------------------------------------------------- */

const POKEMON_DATA_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB6vHVjwL9_F3DVIVgXxP8rtWEDQyZaDTnG2yAw96j4_1DXU7317lBFaY0N5JnDhdvUnkvgAvb6p8o/pub?gid=890281184&single=true&output=csv';

export const TIER_POINTS = {
  'Tier 6': 2,
  'Tier 5': 3,
  'Tier 4': 6,
  'Tier 3': 10,
  'Tier 2': 15,
  'Tier 1': 25,
  'Tier 0': 30,
  'Tier LM': 100
};

/* ---------------------------------------------------------
   RUNTIME STATE (rebuilt on load)
--------------------------------------------------------- */

export let TIER_FAMILIES = {};
export let POKEMON_POINTS = {};
export let POKEMON_TIER = {};
export let POKEMON_REGION = {};
export let POKEMON_RARITY = {};
export let pokemonFamilies = {};
export let POKEMON_SHOW = {};

/* ---------------------------------------------------------
   CSV HELPERS
--------------------------------------------------------- */

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines.shift().split(',').map(h => h.trim().toLowerCase());

  return lines.map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ''));
    return row;
  });
}

async function fetchCSV(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch CSV: ${url}`);
  return parseCSV(await r.text());
}

/* ---------------------------------------------------------
   BUILDER (PUBLIC API)
--------------------------------------------------------- */

export async function buildPokemonData() {
  // Reset runtime maps
  TIER_FAMILIES = {};
  POKEMON_POINTS = {};
  POKEMON_TIER = {};
  POKEMON_REGION = {};
  POKEMON_RARITY = {};
  pokemonFamilies = {};
  POKEMON_SHOW = {};

  const rows = await fetchCSV(POKEMON_DATA_CSV);

  rows.forEach(row => {
    const tier = row.tier;
    if (!tier || !TIER_POINTS[tier]) return;

    const familyRaw = row.family;
    if (!familyRaw) return;

    const family = familyRaw
      .split(',')
      .map(s => normalizePokemonName(s))
      .filter(Boolean);

    if (!family.length) return;

    const familyBase = family[0];

    TIER_FAMILIES[tier] ??= [];
    if (!TIER_FAMILIES[tier].includes(familyBase)) {
      TIER_FAMILIES[tier].push(familyBase);
    }

    family.forEach(name => {
      pokemonFamilies[name] = [...family];
      POKEMON_POINTS[name] = TIER_POINTS[tier];
      POKEMON_TIER[name] = tier;
      POKEMON_REGION[name] = row.region || '';
      POKEMON_RARITY[name] = row.rarity || '';
      POKEMON_SHOW[name] = row.show !== 'FALSE';
    });
  });

  console.log(`✔ Pokémon data loaded (${Object.keys(POKEMON_POINTS).length} entries)`);
}
