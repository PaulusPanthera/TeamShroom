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

  // -------------------------------------------------------
  // FAMILY STAGE STATE
  // -------------------------------------------------------

  const familyState = {};
  const pokemonClaims = {};

  Object.keys(pokemonFamilies).forEach(familyId => {
    familyState[familyId] = pokemonFamilies[familyId].map(pokemon => ({
      pokemon,
      claimedBy: null
    }));
  });

  // -------------------------------------------------------
  // CLAIM RESOLUTION (STRICT STAGE ORDER)
  // -------------------------------------------------------

  events.forEach(event => {
    const familyId = Object.keys(pokemonFamilies)
      .find(id => pokemonFamilies[id].includes(event.pokemon));

    if (!familyId) return;

    const stages = familyState[familyId];

    // 1. Exact stage if free
    let stage =
      stages.find(
        s => s.pokemon === event.pokemon && s.claimedBy === null
      ) || null;

    // 2. First free stage fallback
    if (!stage) {
      stage = stages.find(s => s.claimedBy === null) || null;
    }

    if (!stage) return;

    stage.claimedBy = event.member;
    pokemonClaims[stage.pokemon] = event.member;
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
