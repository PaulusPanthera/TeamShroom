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
  // CLAIM RESOLUTION (FAMILY → STAGE, PROGRESSIVE)
  // -------------------------------------------------------

  const claimedByPokemon = {};
  const claimedStagesByFamily = {};

  events.forEach(event => {
    // Find family for this Pokémon
    const familyId = Object.keys(pokemonFamilies).find(id =>
      pokemonFamilies[id].includes(event.pokemon)
    );

    if (!familyId) return;

    const familyStages = pokemonFamilies[familyId];

    claimedStagesByFamily[familyId] ??= {};

    // Find next unclaimed stage in this family
    const nextStage = familyStages.find(
      stage => !claimedStagesByFamily[familyId][stage]
    );

    if (!nextStage) return; // family fully claimed

    // Assign claim
    claimedStagesByFamily[familyId][nextStage] = event.member;
    claimedByPokemon[nextStage] = event.member;
  });

  // -------------------------------------------------------
  // FINAL DEX LIST (ORDER = POKÉMON DATA ORDER)
  // -------------------------------------------------------

  return Object.keys(POKEMON_POINTS).map(pokemon => ({
    pokemon,
    family:
      Object.keys(pokemonFamilies)
        .find(id => pokemonFamilies[id].includes(pokemon)) || pokemon,
    region: POKEMON_REGION[pokemon] || 'unknown',
    points: POKEMON_POINTS[pokemon],
    claimed: !!claimedByPokemon[pokemon],
    claimedBy: claimedByPokemon[pokemon] || null
  }));
}
