// src/data/shinydex.model.js
// Shiny Dex — HITLIST MODEL
// Derives claim state EXCLUSIVELY from Shiny Weekly
//
// INTERNAL JSON API — SHINYDEX MODEL OUTPUT
//
// Array<{
//   pokemon: string
//   family: string
//   claimed: boolean
//   claimedBy: string | null
//   points: number
// }>

import {
  pokemonFamilies,
  POKEMON_POINTS
} from './pokemondatabuilder.js';

/**
 * Build Shiny Dex Hitlist model
 *
 * @param {Array} weeklyModel Output of buildShinyWeeklyModel()
 * @returns {Array} flat shiny dex entries
 */
export function buildShinyDexModel(weeklyModel) {
  // -------------------------------------------------------
  // FLATTEN WEEKLY MODEL → CHRONOLOGICAL EVENTS
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

  // Order is guaranteed by weekly model construction
  // Do NOT sort

  // -------------------------------------------------------
  // CLAIM RESOLUTION (FAMILY-STAGE BASED)
  // -------------------------------------------------------

  const familyClaims = {};
  const pokemonClaims = {};

  events.forEach(event => {
    const familyId = Object.keys(pokemonFamilies)
      .find(id => pokemonFamilies[id].includes(event.pokemon));

    if (!familyId) return;

    familyClaims[familyId] ??= {};

    let claimedStage = null;

    // Exact stage free
    if (!familyClaims[familyId][event.pokemon]) {
      claimedStage = event.pokemon;
    } else {
      // First unclaimed stage
      claimedStage =
        pokemonFamilies[familyId].find(
          p => !familyClaims[familyId][p]
        ) || null;
    }

    if (!claimedStage) return;

    familyClaims[familyId][claimedStage] = event.member;
    pokemonClaims[claimedStage] = event.member;
  });

  // -------------------------------------------------------
  // BUILD FINAL DEX LIST
  // -------------------------------------------------------

  return Object.keys(POKEMON_POINTS).map(pokemon => ({
    pokemon,
    family:
      Object.keys(pokemonFamilies)
        .find(id => pokemonFamilies[id].includes(pokemon)) || pokemon,
    claimed: !!pokemonClaims[pokemon],
    claimedBy: pokemonClaims[pokemon] || null,
    points: POKEMON_POINTS[pokemon]
  }));
}
