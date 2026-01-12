// src/domains/shinydex/hitlist.model.js
// Shiny Dex — HITLIST CLAIM MODEL
// Deterministic, order-dependent, family-aware
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
  // PREPARE FAMILY STATE
  // -------------------------------------------------------

  const familyState = {};
  Object.entries(pokemonFamilies).forEach(([family, stages]) => {
    familyState[family] = {
      stages: [...stages],
      claimed: {} // pokemon → member
    };
  });

  const pokemonClaims = {};

  // -------------------------------------------------------
  // RESOLVE CLAIMS (ORDER MATTERS)
  // -------------------------------------------------------

  events.forEach(({ member, pokemon }) => {
    const family = Object.keys(pokemonFamilies).find(f =>
      pokemonFamilies[f].includes(pokemon)
    );

    if (!family) return;

    const state = familyState[family];

    // find next unclaimed stage
    const nextStage = state.stages.find(
      p => !state.claimed[p]
    );

    if (!nextStage) return;

    state.claimed[nextStage] = member;
    pokemonClaims[nextStage] = member;
  });

  // -------------------------------------------------------
  // FINAL DEX LIST (FULL, STABLE)
  // -------------------------------------------------------

  return Object.keys(POKEMON_POINTS).map(pokemon => {
    const family =
      Object.keys(pokemonFamilies)
        .find(f => pokemonFamilies[f].includes(pokemon)) ||
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
