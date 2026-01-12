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
// ---------------------------------------------------------

import {
  pokemonFamilies,
  POKEMON_TIER,
  POKEMON_REGION,
  POKEMON_POINTS,
  POKEMON_SHOW
} from './pokemondatabuilder.js';

export function buildShinyDexModel(weeklyModel) {
  // -------------------------------------------------------
  // FLATTEN SHINY WEEKLY → CHRONOLOGICAL EVENTS
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
  // CLAIM RESOLUTION (FAMILY → STAGE ORDER)
  // -------------------------------------------------------

  const familyClaims = {};
  const pokemonClaims = {};

  events.forEach(({ member, pokemon }) => {
    const family = pokemonFamilies[pokemon];
    if (!family || !family.length) return;

    const familyKey = family[0];
    familyClaims[familyKey] ??= {};

    // Find first unclaimed stage in family order
    const stageToClaim = family.find(
      stage => !familyClaims[familyKey][stage]
    );

    if (!stageToClaim) return;

    familyClaims[familyKey][stageToClaim] = member;
    pokemonClaims[stageToClaim] = member;
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

  return dex;
}
