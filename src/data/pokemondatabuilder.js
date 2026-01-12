// src/data/pokemondatabuilder.js
// Pokémon derived data builder
// Runtime consumes CI-normalized pokemon.json
//
// SINGLE SOURCE OF TRUTH:
// - pokemon.json already contains points, family, stage
// - Runtime ONLY indexes and groups

// ---------------------------------------------------------
// RUNTIME STATE (REBUIILT FROM JSON)
// ---------------------------------------------------------

export let POKEMON_POINTS = {};
export let POKEMON_FAMILY = {};
export let POKEMON_STAGE = {};
export let POKEMON_SHOW = {};
export let POKEMON_ORDER = [];

// ---------------------------------------------------------
// BUILDER
// ---------------------------------------------------------

/**
 * Build runtime Pokémon lookup tables
 *
 * @param {Array} rows  pokemon.json.data[]
 */
export function buildPokemonData(rows) {
  POKEMON_POINTS = {};
  POKEMON_FAMILY = {};
  POKEMON_STAGE = {};
  POKEMON_SHOW = {};
  POKEMON_ORDER = [];

  rows.forEach(row => {
    // Hard contract from CI
    const key = row.key;

    POKEMON_POINTS[key] = row.points;
    POKEMON_FAMILY[key] = row.family;
    POKEMON_STAGE[key] = row.stage;

    // Visibility rule:
    // points > 0 means it participates in shiny systems
    POKEMON_SHOW[key] = row.points > 0;

    POKEMON_ORDER.push(key);
  });
}
