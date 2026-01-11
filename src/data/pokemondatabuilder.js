// src/data/pokemondatabuilder.js
// Pokémon derived data builder
// Runtime consumes pre-normalized pokemon.json

export const TIER_POINTS = {
  '6': 2,
  '5': 3,
  '4': 6,
  '3': 10,
  '2': 15,
  '1': 25,
  '0': 30,
  'LM': 100
};

// ---------------------------------------------------------
// RUNTIME STATE (rebuilt from JSON)
// ---------------------------------------------------------

export let TIER_FAMILIES = {};
export let POKEMON_POINTS = {};
export let POKEMON_TIER = {};
export let POKEMON_REGION = {};
export let POKEMON_RARITY = {};
export let POKEMON_SHOW = {};
export let pokemonFamilies = {};

// ---------------------------------------------------------
// BUILDER
// ---------------------------------------------------------

export function buildPokemonData(rows) {
  // Reset maps
  TIER_FAMILIES = {};
  POKEMON_POINTS = {};
  POKEMON_TIER = {};
  POKEMON_REGION = {};
  POKEMON_RARITY = {};
  POKEMON_SHOW = {};
  pokemonFamilies = {};

  rows.forEach(row => {
    const tier = String(row.tier);
    if (!TIER_POINTS[tier]) return;

    const familyRaw = row.family;
    if (!familyRaw) return;

    const family = familyRaw
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    if (!family.length) return;

    const base = family[0];

    TIER_FAMILIES[tier] ??= [];
    if (!TIER_FAMILIES[tier].includes(base)) {
      TIER_FAMILIES[tier].push(base);
    }

    family.forEach(name => {
      pokemonFamilies[name] = family;
      POKEMON_POINTS[name] = TIER_POINTS[tier];
      POKEMON_TIER[name] = tier;
      POKEMON_REGION[name] = row.region;
      POKEMON_RARITY[name] = row.rarity;
      POKEMON_SHOW[name] = row.show === true;
    });
  });
}
