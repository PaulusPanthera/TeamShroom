// src/data/shinydex.model.js
// Shiny Dex — CLAIM MODEL
// Derives Hitlist + Living Dex base data
// SINGLE SOURCE OF TRUTH: shinyweekly.model output
// No UI. No DOM. No runtime normalization.

/*
INTERNAL JSON API — SHINY DEX MODEL OUTPUT

{
  [region: string]: Array<{
    pokemon: string
    family: string[]
    claimed: boolean
    claimedBy: string | null
    claimIndex: number | null
    points: number
  }>
}
*/

import {
  pokemonFamilies,
  POKEMON_POINTS,
  POKEMON_REGION,
  POKEMON_SHOW
} from './pokemondatabuilder.js';

export function buildShinyDexModel(weeks) {
  const claims = {};
  const familyState = {};

  // -------------------------------------------------------
  // INITIALIZE ALL SHOWN POKÉMON
  // -------------------------------------------------------

  Object.entries(POKEMON_SHOW).forEach(([pokemon, show]) => {
    if (!show) return;

    const region = POKEMON_REGION[pokemon] || 'Unknown';

    claims[region] ??= [];
    claims[region].push({
      pokemon,
      family: pokemonFamilies[pokemon] || [pokemon],
      claimed: false,
      claimedBy: null,
      claimIndex: null,
      points: POKEMON_POINTS[pokemon] || 0
    });
  });

  // -------------------------------------------------------
  // PREPARE FAMILY TRACKING
  // -------------------------------------------------------

  Object.values(pokemonFamilies).forEach(family => {
    familyState[family[0]] = {
      family,
      claimedStages: []
    };
  });

  // -------------------------------------------------------
  // APPLY CLAIMS — STRICT CHRONOLOGICAL ORDER
  // -------------------------------------------------------

  let claimCounter = 0;

  weeks.forEach(week => {
    Object.values(week.members).forEach(member => {
      member.shinies.forEach(mon => {
        if (mon.lost) return;

        const family = pokemonFamilies[mon.pokemon];
        if (!family) return;

        const familyKey = family[0];
        const state = familyState[familyKey];

        if (!state) return;

        // Determine which stage is claimed
        let claimedPokemon = null;

        if (!state.claimedStages.includes(mon.pokemon)) {
          claimedPokemon = mon.pokemon;
        } else {
          claimedPokemon = family.find(
            p => !state.claimedStages.includes(p)
          );
        }

        if (!claimedPokemon) return;

        state.claimedStages.push(claimedPokemon);

        const region = POKEMON_REGION[claimedPokemon] || 'Unknown';
        const entry = claims[region]?.find(
          e => e.pokemon === claimedPokemon
        );

        if (!entry || entry.claimed) return;

        entry.claimed = true;
        entry.claimedBy = mon.member;
        entry.claimIndex = claimCounter++;

      });
    });
  });

  return claims;
}
