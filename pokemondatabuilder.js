// pokemondatabuilder.js
import { normalizePokemonName } from './utils.js';

export let TIER_POINTS = {
  "Tier 6": 2,
  "Tier 5": 3,
  "Tier 4": 6,
  "Tier 3": 10,
  "Tier 2": 15,
  "Tier 1": 25,
  "Tier 0": 30,
  "Tier LM": 100
};

export let TIER_FAMILIES = {};
export let POKEMON_POINTS = {};
export let POKEMON_TIER = {};
export let POKEMON_REGION = {};
export let POKEMON_RARITY = {};
export let pokemonFamilies = {};

export function buildPokemonData(pokemonFamiliesData) {
  TIER_FAMILIES = {};
  POKEMON_POINTS = {};
  POKEMON_TIER = {};
  POKEMON_REGION = {};
  POKEMON_RARITY = {};
  pokemonFamilies = {};

  pokemonFamiliesData.forEach(entry => {
    const tier = entry.tier;
    const fam = entry.family_members.split(",");
    const region = entry.region || "";
    const rarity = entry.rarity || "";

    // Assign family base
    const base = normalizePokemonName(fam[0].trim());
    if (!TIER_FAMILIES[tier]) TIER_FAMILIES[tier] = [];
    if (!TIER_FAMILIES[tier].includes(base)) {
      TIER_FAMILIES[tier].push(base);
    }

    // Map every family member to the family
    fam.forEach(name => {
      const norm = normalizePokemonName(name);
      pokemonFamilies[norm] = fam.map(item => normalizePokemonName(item));
      POKEMON_POINTS[norm] = TIER_POINTS[tier] || 0;
      POKEMON_TIER[norm] = tier;
      POKEMON_REGION[norm] = region;
      POKEMON_RARITY[norm] = rarity;
    });
  });
}
