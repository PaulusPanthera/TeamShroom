// src/domains/pokedex/pokedex.data.js
// v2.0.0-beta
// Pokédex domain data layer
// Owns Pokédex-only caching + idempotent data initialization.
//
// Guarantees:
// - Promise-based caches (no duplicated boolean flags)
// - Derived Pokémon maps are built at most once per runtime
// - Returned objects are safe to reuse across renders

import { loadPokemon } from '../../data/pokemon.loader.js';
import {
  buildPokemonData,
  POKEMON_DEX_ORDER,
  POKEMON_POINTS
} from '../../data/pokemondatabuilder.js';

import { loadShinyWeekly } from '../../data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from '../../data/shinyweekly.model.js';

import { loadShinyShowcase } from '../../data/shinyshowcase.loader.js';

// ---------------------------------------------------------
// PROMISE CACHES
// ---------------------------------------------------------

let pokemonInitPromise = null;
let weeklyModelPromise = null;
let showcaseRowsPromise = null;

// ---------------------------------------------------------
// INTERNAL HELPERS
// ---------------------------------------------------------

function pokemonDerivedDataAlreadyBuilt() {
  const hasDexOrder = Array.isArray(POKEMON_DEX_ORDER) && POKEMON_DEX_ORDER.length > 0;
  const hasPoints = POKEMON_POINTS && typeof POKEMON_POINTS === 'object' && Object.keys(POKEMON_POINTS).length > 0;
  return hasDexOrder && hasPoints;
}

async function initPokemonDerivedDataOnce() {
  if (pokemonInitPromise) return pokemonInitPromise;

  pokemonInitPromise = (async () => {
    if (pokemonDerivedDataAlreadyBuilt()) return true;
    const rows = await loadPokemon();
    buildPokemonData(rows);
    return true;
  })();

  return pokemonInitPromise;
}

async function getWeeklyModelOnce() {
  if (weeklyModelPromise) return weeklyModelPromise;

  weeklyModelPromise = (async () => {
    const rows = await loadShinyWeekly();
    return buildShinyWeeklyModel(rows);
  })();

  return weeklyModelPromise;
}

async function getShowcaseRowsOnce() {
  if (showcaseRowsPromise) return showcaseRowsPromise;

  showcaseRowsPromise = (async () => {
    return loadShinyShowcase();
  })();

  return showcaseRowsPromise;
}

// ---------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------

/**
 * Returns the minimal dependency contract required to mount the Shiny Pokédex.
 *
 * Output contract:
 * {
 *   weeklyModel: WeeklyModel
 *   shinyShowcaseRows: ShowcaseRow[]
 * }
 */
export async function getPokedexDeps() {
  await initPokemonDerivedDataOnce();

  const [weeklyModel, shinyShowcaseRows] = await Promise.all([
    getWeeklyModelOnce(),
    getShowcaseRowsOnce()
  ]);

  return {
    weeklyModel,
    shinyShowcaseRows
  };
}
