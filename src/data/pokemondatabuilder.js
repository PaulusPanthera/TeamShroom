// pokemondatabuilder.js
// Pokémon tier, family, and point data builder
// Design System v1 — pure data layer

import { normalizePokemonName } from './utils.js';

/* ---------------------------------------------------------
   STATIC CONFIG
--------------------------------------------------------- */

export const TIER_POINTS = {
  "Tier 6": 2,
  "Tier 5": 3,
  "Tier 4": 6,
  "Tier 3": 10,
  "Tier 2": 15,
  "Tier 1": 25,
  "Tier 0": 30,
  "Tier LM": 100
};

/* ---------------------------------------------------------
   RUNTIME STATE (rebuilt via buildPokemonData)
--------------------------------------------------------- */

export let TIER_FAMILIES = {};
export let POKEMON_POINTS = {};
export let POKEMON_TIER = {};
export let POKEMON_REGION = {};
export let POKEMON_RARITY = {};
export let pokemonFamilies = {};

/* ---------------------------------------------------------
   BUILDER
--------------------------------------------------------- */

export function buildPokemonData(pokemonFamiliesData) {
  // Reset all runtime maps explicitly
  TIER_FAMILIES = {};
  POKEMON_POINTS = {};
  POKEMON_TIER = {};
  POKEMON_REGION = {};
  POKEMON_RARITY = {};
  pokemonFamilies = {};

  if (!Array.isArray(pokemonFamiliesData)) return;

  pokemonFamiliesData.forEach(entry => {
    const tier = entry.tier;
    const region = entry.region || "";
    const rarity = entry.rarity || "";

    if (!entry.family_members || !tier) return;

    // Parse and normalize family members
    const rawFamily = entry.family_members
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (!rawFamily.length) return;

    const normalizedFamily = rawFamily.map(normalizePokemonName);

    // First member defines the family base
    const familyBase = normalizedFamily[0];

    // Register family base under tier
    if (!TIER_FAMILIES[tier]) {
      TIER_FAMILIES[tier] = [];
    }
    if (!TIER_FAMILIES[tier].includes(familyBase)) {
      TIER_FAMILIES[tier].push(familyBase);
    }

    // Map each Pokémon in the family
    normalizedFamily.forEach(normName => {
      pokemonFamilies[normName] = normalizedFamily.slice();
      POKEMON_POINTS[normName] = TIER_POINTS[tier] ?? 0;
      POKEMON_TIER[normName] = tier;
      POKEMON_REGION[normName] = region;
      POKEMON_RARITY[normName] = rarity;
    });
  });
}
