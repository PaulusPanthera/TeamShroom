// src/data/pokemondatabuilder.js
// v2.0.0-alpha.1
// Pokémon derived data builder
// Runtime consumes CI-normalized pokemon.json

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

// RUNTIME STATE (SINGLE SOURCE OF TRUTH)
export let POKEMON_POINTS = {};
export let POKEMON_SHOW = {};
export let POKEMON_REGION = {};
export let POKEMON_TIER = {};
export let POKEMON_DEX_ORDER = [];
export let pokemonFamilies = {};

export function buildPokemonData(rows) {
  POKEMON_POINTS = {};
  POKEMON_SHOW = {};
  POKEMON_REGION = {};
  POKEMON_TIER = {};
  POKEMON_DEX_ORDER = [];
  pokemonFamilies = {};

  rows.forEach(row => {
    const key = (row.pokemon || '').toLowerCase();
    if (!key) return;

    POKEMON_DEX_ORDER.push(key);

    const tierKey = (row.tier || '').toLowerCase();
    POKEMON_TIER[key] = tierKey || '';

    POKEMON_POINTS[key] = TIER_POINTS[tierKey] != null ? TIER_POINTS[tierKey] : 0;
    POKEMON_SHOW[key] = row.show === true;
    POKEMON_REGION[key] = row.region || 'unknown';

    if (Array.isArray(row.family)) {
      pokemonFamilies[key] = row.family.map(f => String(f || '').toLowerCase()).filter(Boolean);
    } else {
      pokemonFamilies[key] = [];
    }
  });
}
