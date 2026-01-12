// src/data/pokemondatabuilder.js
// Pokémon derived runtime data
// Consumes CI-normalized pokemon.json (DEX CONTRACT)
//
// pokemon.json.data[] shape:
//
// {
//   id: number
//   key: string
//   name: string
//   generation: number
//   family: string
//   stage: number
//   points: number
// }

export let POKEMON_POINTS = {};
export let pokemonFamilies = {};

/**
 * Build Pokémon runtime maps
 *
 * @param {Array} rows        pokemon.json.data[]
 * @param {Array} teamMembers members model (for later living dex use)
 */
export function buildPokemonData(rows, teamMembers = []) {
  // Reset runtime state
  POKEMON_POINTS = {};
  pokemonFamilies = {};

  // -------------------------------------------------------
  // BUILD FAMILY MAPS + POINTS
  // -------------------------------------------------------

  rows.forEach(row => {
    const key = row.key;

    if (!key) return;

    // Points are explicit in the new contract
    POKEMON_POINTS[key] = row.points;

    // Build family → ordered stages
    const familyId = row.family;
    if (!familyId) return;

    pokemonFamilies[familyId] ??= [];
    pokemonFamilies[familyId].push({
      key,
      stage: row.stage
    });
  });

  // Sort family stages by evolution order
  Object.values(pokemonFamilies).forEach(family => {
    family.sort((a, b) => a.stage - b.stage);
  });

  // Replace family arrays with ordered key lists
  Object.keys(pokemonFamilies).forEach(familyId => {
    pokemonFamilies[familyId] =
      pokemonFamilies[familyId].map(e => e.key);
  });
}
