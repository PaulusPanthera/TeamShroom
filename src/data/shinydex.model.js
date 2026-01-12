// src/data/shinydex.model.js
// Shiny Dex — HITLIST MODEL
// Authoritative claiming logic derived exclusively from Shiny Weekly
//
// INTERNAL JSON API — SHINYDEX MODEL OUTPUT
//
// Array<{
//   pokemon: string,
//   family: string,
//   points: number,
//   claimed: boolean,
//   claimedBy: string | null
// }>

import {
  pokemonFamilies,
  POKEMON_POINTS
} from './pokemondatabuilder.js';

/**
 * Build Shiny Dex Hitlist model
 *
 * @param {Array} weeklyModel Output of buildShinyWeeklyModel()
 * @returns {Array}
 */
export function buildShinyDexModel(weeklyModel) {
  // -------------------------------------------------------
  // FLATTEN WEEKLY MODEL → STRICT CHRONOLOGICAL EVENTS
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
  // FAMILY → STAGE SLOT STATE (SOURCE OF TRUTH)
  // -------------------------------------------------------

  const familySlots = {};

  Object.keys(pokemonFamilies).forEach(familyId => {
    familySlots[familyId] = pokemonFamilies[familyId].map(pokemon => ({
      pokemon,
      claimedBy: null
    }));
  });

  // -------------------------------------------------------
  // CLAIM RESOLUTION (AUTHORITATIVE SPEC)
  // -------------------------------------------------------

  events.forEach(event => {
    const familyId = Object.keys(pokemonFamilies)
      .find(id => pokemonFamilies[id].includes(event.pokemon));

    if (!familyId) return;

    const slots = familySlots[familyId];

    // Case A — exact stage free
    let slot = slots.find(
      s => s.pokemon === event.pokemon && s.claimedBy === null
    );

    // Case B — fallback to first free stage
    if (!slot) {
      slot = slots.find(s => s.claimedBy === null);
    }

    // Case C — family complete
    if (!slot) return;

    slot.claimedBy = event.member;
  });

  // -------------------------------------------------------
  // BUILD FINAL HITLIST MODEL
  // -------------------------------------------------------

  return Object.keys(POKEMON_POINTS).map(pokemon => {
    const family =
      Object.keys(pokemonFamilies)
        .find(id => pokemonFamilies[id].includes(pokemon)) || pokemon;

    const slot =
      familySlots[family]?.find(s => s.pokemon === pokemon) || null;

    const claimed = !!slot?.claimedBy;

    return {
      pokemon,
      family,
      points: POKEMON_POINTS[pokemon],
      claimed,
      claimedBy: claimed ? slot.claimedBy : null
    };
  });
}
