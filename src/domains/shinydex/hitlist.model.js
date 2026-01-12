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
  // 1. FLATTEN WEEKLY MODEL → CLAIM EVENTS (ORDER PRESERVED)
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
  // 2. PREPARE FAMILY STATE (DEX ORDER IS AUTHORITATIVE)
  // -------------------------------------------------------

  const familyState = {};
  const pokemonClaims = {};

  Object.entries(pokemonFamilies).forEach(([familyId, stages]) => {
    familyState[familyId] = {
      stages,
      claimed: {}
    };
  });

  // -------------------------------------------------------
  // 3. RESOLVE CLAIMS — FIRST UNCLAIMED STAGE PER EVENT
  // -------------------------------------------------------

  events.forEach(event => {
    const familyId = Object.keys(familyState).find(id =>
      familyState[id].stages.includes(event.pokemon)
    );

    if (!familyId) return;

    const family = familyState[familyId];

    const nextStage = family.stages.find(
      p => !family.claimed[p]
    );

    if (!nextStage) return;

    family.claimed[nextStage] = event.member;
    pokemonClaims[nextStage] = event.member;
  });

  // -------------------------------------------------------
  // 4. FINAL DEX LIST (FULL, STABLE, ORDERED)
  // -------------------------------------------------------

  return Object.keys(POKEMON_POINTS).map(pokemon => {
    const family =
      Object.keys(pokemonFamilies)
        .find(id => pokemonFamilies[id].includes(pokemon)) ||
      pokemon;

    return {
      pokemon,
      family,
      region: POKEMON_REGION[pokemon] || 'unknown',
      points: POKEMON_POINTS[pokemon],
      claimed: Boolean(pokemonClaims[pokemon]),
      claimedBy: pokemonClaims[pokemon] || null
    };
  });
}
