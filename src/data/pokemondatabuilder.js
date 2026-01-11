// src/data/pokemondatabuilder.js
// Pokémon derived data builder
// Runtime consumes pre-normalized pokemon.json
// HARD DATA PROVIDER — SHARED MODEL DEPENDENCY

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
// RUNTIME STATE (EXPLICITLY EXPORTED)
// ---------------------------------------------------------

export let TIER_FAMILIES = {};
export let POKEMON_POINTS = {};
export let POKEMON_TIER = {};
export let POKEMON_REGION = {};
export let POKEMON_RARITY = {};
export let POKEMON_SHOW = {};
export let pokemonFamilies = {};
export let LIVING_COUNTS = {};

// ---------------------------------------------------------
// BUILDER (MUTATES EXPORTED STATE ONLY)
// ---------------------------------------------------------

export function buildPokemonData(rows, teamMembers = []) {
  // Reset maps
  TIER_FAMILIES = {};
  POKEMON_POINTS = {};
  POKEMON_TIER = {};
  POKEMON_REGION = {};
  POKEMON_RARITY = {};
  POKEMON_SHOW = {};
  pokemonFamilies = {};
  LIVING_COUNTS = {};

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
      POKEMON_REGION[name] = row.region || 'Unknown';
      POKEMON_RARITY[name] = row.rarity || null;
      POKEMON_SHOW[name] = row.show === true;
      LIVING_COUNTS[name] = 0;
    });
  });

  // -------------------------------------------------------
  // LIVING DEX COUNTS (DERIVED, SINGLE SOURCE)
  // -------------------------------------------------------

  teamMembers.forEach(member => {
    member.shinies.forEach(mon => {
      if (mon.lost || mon.sold) return;
      if (!POKEMON_POINTS[mon.pokemon]) return;
      LIVING_COUNTS[mon.pokemon] += 1;
    });
  });
}
