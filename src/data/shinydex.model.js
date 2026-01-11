// src/data/shinydex.model.js
// Shiny Dex — HITLIST + LIVING DEX MODEL
// CI-normalized inputs → UI-ready, region-grouped structure
//
// SINGLE SOURCE OF TRUTH FOR CLAIMS
// Claims are derived EXCLUSIVELY from Shiny Weekly model output
//
// ---------------------------------------------------------
// INTERNAL JSON API — SHINYDEX MODEL OUTPUT
//
// {
//   [region: string]: Array<{
//     pokemon: string
//     family: string
//     tier: string
//     claimed: boolean
//     claimedBy: string | null
//     points: number
//   }>
// }
//
// ---------------------------------------------------------

import {
  pokemonFamilies,
  POKEMON_TIER,
  POKEMON_REGION,
  POKEMON_POINTS,
  POKEMON_SHOW
} from './pokemondatabuilder.js';

/**
 * Build Shiny Dex model (Hitlist + Living Dex base)
 *
 * @param {Array} weeklyModel  Output of buildShinyWeeklyModel()
 * @returns {Object} region-grouped shiny dex model
 */
export function buildShinyDexModel(weeklyModel) {
  // -------------------------------------------------------
  // FLATTEN SHINY WEEKLY → CHRONOLOGICAL CLAIM EVENTS
  // -------------------------------------------------------

  const events = [];

  weeklyModel.forEach(week => {
    Object.values(week.members).forEach(member => {
      member.shinies.forEach(shiny => {
        if (shiny.lost) return;

        events.push({
          member: shiny.member,
          pokemon: shiny.pokemon
        });
      });
    });
  });

  // Order is guaranteed by sheet row order → weekly model order
  // DO NOT sort here

  // -------------------------------------------------------
  // CLAIM RESOLUTION (FAMILY-STAGE BASED)
  // -------------------------------------------------------

  const familyClaims = {};
  const pokemonClaims = {};

  events.forEach(event => {
    const family = pokemonFamilies[event.pokemon];
    if (!family) return;

    familyClaims[family[0]] ??= {};

    // Determine which stage is claimed
    let claimedStage = null;

    if (!familyClaims[family[0]][event.pokemon]) {
      // Exact stage free
      claimedStage = event.pokemon;
    } else {
      // Find first unclaimed stage
      claimedStage = family.find(p => !familyClaims[family[0]][p]) || null;
    }

    if (!claimedStage) return;

    familyClaims[family[0]][claimedStage] = event.member;
    pokemonClaims[claimedStage] = event.member;
  });

  // -------------------------------------------------------
  // BUILD REGION-GROUPED OUTPUT
  // -------------------------------------------------------

  const dex = {};

  Object.keys(POKEMON_POINTS).forEach(pokemon => {
    if (!POKEMON_SHOW[pokemon]) return;

    const region = POKEMON_REGION[pokemon] || 'unknown';
    dex[region] ??= [];

    dex[region].push({
      pokemon,
      family: pokemonFamilies[pokemon]?.[0] || pokemon,
      tier: POKEMON_TIER[pokemon],
      claimed: !!pokemonClaims[pokemon],
      claimedBy: pokemonClaims[pokemon] || null,
      points: POKEMON_POINTS[pokemon] || 0
    });
  });

  // Stable ordering inside regions (dex order via insertion)
  return dex;
}
