// src/domains/shinydex/hitlist.model.js
// Shiny Dex — HITLIST CLAIM MODEL
// PURE FUNCTION — deterministic, order-dependent
// Source of truth: Shiny Weekly model ONLY

import {
  pokemonFamilies,
  POKEMON_POINTS,
  POKEMON_REGION
} from '../../data/pokemondatabuilder.js';

/*
OUTPUT:
Array<{
  pokemon: string
  family: string
  region: string
  points: number
  claimed: boolean
  claimedBy: string | null
}>
*/

export function buildShinyDexModel(weeklyModel) {
  // -------------------------------------------------------
  // FLATTEN WEEKLY MODEL → EVENTS (ORDER PRESERVED)
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
  // CLAIM RESOLUTION (FAMILY → STAGE)
  // -------------------------------------------------------

  const familyClaims = {};
  const pokemonClaims = {};

  events.forEach(event => {
    const familyId = Object.keys(pokemonFamilies)
      .find(id => pokemonFamilies[id].includes(event.pokemon));

    if (!familyId) return;

    familyClaims[familyId] ??= {};

    let claimedStage = null;

    if (!familyClaims[familyId][event.pokemon]) {
      claimedStage = event.pokemon;
    } else {
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
  // FINAL DEX LIST
  // -------------------------------------------------------

  return Object.keys(POKEMON_POINTS).map(pokemon => ({
    pokemon,
    family:
      Object.keys(pokemonFamilies)
        .find(id => pokemonFamilies[id].includes(pokemon)) || pokemon,
    region: POKEMON_REGION[pokemon] || 'unknown',
    points: POKEMON_POINTS[pokemon],
    claimed: !!pokemonClaims[pokemon],
    claimedBy: pokemonClaims[pokemon] || null
  }));
}
