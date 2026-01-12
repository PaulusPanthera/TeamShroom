// src/data/shinydex.model.js
// Shiny Dex — HITLIST MODEL
// Correct family-stage resolution based on canonical family keys

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
  // BUILD FAMILY → STAGE CHAINS (DEX ORDER)
  // -------------------------------------------------------

  const familyStages = {};

  Object.keys(POKEMON_POINTS).forEach(pokemon => {
    const familyKeys = pokemonFamilies[pokemon];
    if (!familyKeys || familyKeys.length === 0) return;

    const familyKey = familyKeys[0];

    familyStages[familyKey] ??= [];
    familyStages[familyKey].push({
      pokemon,
      claimedBy: null
    });
  });

  // -------------------------------------------------------
  // CLAIM RESOLUTION (SPEC-FAITHFUL)
  // -------------------------------------------------------

  events.forEach(event => {
    const familyKeys = pokemonFamilies[event.pokemon];
    if (!familyKeys || familyKeys.length === 0) return;

    const familyKey = familyKeys[0];
    const stages = familyStages[familyKey];
    if (!stages) return;

    // Case A — exact stage free
    let slot = stages.find(
      s => s.pokemon === event.pokemon && s.claimedBy === null
    );

    // Case B — fallback to first free stage
    if (!slot) {
      slot = stages.find(s => s.claimedBy === null);
    }

    // Case C — family complete
    if (!slot) return;

    slot.claimedBy = event.member;
  });

  // -------------------------------------------------------
  // BUILD FINAL HITLIST MODEL
  // -------------------------------------------------------

  return Object.keys(POKEMON_POINTS).map(pokemon => {
    const familyKeys = pokemonFamilies[pokemon];
    const family = familyKeys?.[0] || pokemon;

    const slot =
      familyStages[family]?.find(s => s.pokemon === pokemon) || null;

    return {
      pokemon,
      family,
      points: POKEMON_POINTS[pokemon],
      claimed: !!slot?.claimedBy,
      claimedBy: slot?.claimedBy || null
    };
  });
}
