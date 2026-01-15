// v2.0.0-alpha.1
// src/data/pokemondatabuilder.js
// Pokémon derived data builder
// Runtime consumes CI-normalized pokemon.json

// ---------------------------------------------------------
// TIER → POINTS MAP (STRING-BASED, MATCHES DATA)
// ---------------------------------------------------------

export const TIER_POINTS = {
  'tier 6': 2,
  'tier 5': 3,
  'tier 4': 6,
  'tier 3': 10,
  'tier 2': 15,
  'tier 1': 25,
  'tier 0': 30,
  'tier lm': 100
};

// ---------------------------------------------------------
// RUNTIME STATE (SINGLE SOURCE OF TRUTH)
// ---------------------------------------------------------

export let POKEMON_POINTS = {};
export let POKEMON_SHOW = {};
export let POKEMON_REGION = {};
export let pokemonFamilies = {};
export let POKEMON_DEX_ORDER = [];

// ---------------------------------------------------------
// BUILDER
// ---------------------------------------------------------

export function buildPokemonData(rows) {
  // reset
  POKEMON_POINTS = {};
  POKEMON_SHOW = {};
  POKEMON_REGION = {};
  pokemonFamilies = {};
  POKEMON_DEX_ORDER = [];

  rows.forEach(row => {
    const key = row.pokemon?.toLowerCase();
    if (!key) return;

    // dex order
    POKEMON_DEX_ORDER.push(key);

    // points
    const tierKey = row.tier?.toLowerCase();
    POKEMON_POINTS[key] = TIER_POINTS[tierKey] ?? 0;

    // visibility
    POKEMON_SHOW[key] = row.show === true;

    // region
    POKEMON_REGION[key] = row.region || 'unknown';

    // family (roots array, CI-owned)
    if (Array.isArray(row.family)) {
      pokemonFamilies[key] = row.family.map(f => String(f || '').toLowerCase()).filter(Boolean);
    } else {
      pokemonFamilies[key] = [];
    }
  });
}
