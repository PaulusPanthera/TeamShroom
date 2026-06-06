// src/domains/pokedex/pokedex.data.js
// v2.0.0-beta
// Pokédex domain data layer
// Owns Pokédex-only caching + idempotent data initialization.
//
// Guarantees:
// - Promise-based caches (no duplicated boolean flags)
// - Derived Pokémon maps are built at most once per runtime
// - Returned objects are safe to reuse across renders

import { initPokemonDerivedDataOnce } from '../pokemon/pokemon.data.js';

import { loadShinyWeekly } from '../../data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from '../shinyweekly/shinyweekly.model.js';

import { loadShinyShowcase } from '../../data/shinyshowcase.loader.js';
import { loadMembers } from '../../data/members.loader.js';
import { filterShowcaseRowsToActiveMembers } from '../members/member.visibility.js';

// ---------------------------------------------------------
// PROMISE CACHES
// ---------------------------------------------------------

let weeklyModelPromise = null;
let showcaseVisibleRowsPromise = null;

// ---------------------------------------------------------
// INTERNAL HELPERS
// ---------------------------------------------------------

async function getWeeklyModelOnce() {
  if (weeklyModelPromise) return weeklyModelPromise;

  weeklyModelPromise = (async () => {
    const rows = await loadShinyWeekly();
    return buildShinyWeeklyModel(rows);
  })();

  return weeklyModelPromise;
}

async function getShowcaseVisibleRowsOnce() {
  if (showcaseVisibleRowsPromise) return showcaseVisibleRowsPromise;

  showcaseVisibleRowsPromise = (async () => {
    const [membersRows, showcaseRows] = await Promise.all([
      loadMembers(),
      loadShinyShowcase()
    ]);

    return filterShowcaseRowsToActiveMembers(showcaseRows, membersRows);
  })();

  return showcaseVisibleRowsPromise;
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
 *   shinyShowcaseRows: ShowcaseRow[]   // active-member-only showcase rows
 * }
 */
export async function getPokedexDeps() {
  await initPokemonDerivedDataOnce();

  const [weeklyModel, shinyShowcaseRows] = await Promise.all([
    getWeeklyModelOnce(),
    getShowcaseVisibleRowsOnce()
  ]);

  return {
    weeklyModel,
    shinyShowcaseRows
  };
}
