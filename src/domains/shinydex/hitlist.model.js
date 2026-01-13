// src/domains/shinydex/hitlist.model.js
// v2.0.0-alpha.1
// Shiny Dex — HITLIST CLAIM MODEL
// PURE FUNCTION — deterministic, order-dependent
// Source of truth: Shiny Weekly model ONLY

import {
  pokemonFamilies,
  POKEMON_POINTS,
  POKEMON_REGION,
  POKEMON_DEX_ORDER
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
  const weeks = Array.isArray(weeklyModel) ? weeklyModel : [];

  // FLATTEN → EVENTS (ORDER PRESERVED)
  const events = [];
  weeks.forEach(week => {
    const members = week && week.members ? Object.values(week.members) : [];
    members.forEach(member => {
      const shinies = member && Array.isArray(member.shinies) ? member.shinies : [];
      shinies.forEach(shiny => {
        if (!shiny || shiny.lost) return;
        events.push({
          member: shiny.member,
          pokemon: shiny.pokemon
        });
      });
    });
  });

  // CLAIM RESOLUTION (FAMILY → NEXT STAGE, PROGRESSIVE)
  const claimedByPokemon = {};
  const claimedStagesByFamily = {};

  events.forEach(event => {
    const mon = (event.pokemon || '').toLowerCase();
    if (!mon) return;

    // familyId = root key whose family list contains this mon, else fallback mon itself
    let familyId = null;
    const familyKeys = Object.keys(pokemonFamilies);
    for (let i = 0; i < familyKeys.length; i++) {
      const k = familyKeys[i];
      const stages = pokemonFamilies[k] || [];
      if (stages.indexOf(mon) !== -1 || k === mon) {
        familyId = k;
        break;
      }
    }
    if (!familyId) familyId = mon;

    const familyStages = pokemonFamilies[familyId] || [familyId];
    if (!claimedStagesByFamily[familyId]) claimedStagesByFamily[familyId] = {};

    // next unclaimed stage
    let nextStage = null;
    for (let i = 0; i < familyStages.length; i++) {
      const stage = familyStages[i];
      if (!claimedStagesByFamily[familyId][stage]) {
        nextStage = stage;
        break;
      }
    }
    if (!nextStage) return;

    claimedStagesByFamily[familyId][nextStage] = event.member;
    claimedByPokemon[nextStage] = event.member;
  });

  const order = Array.isArray(POKEMON_DEX_ORDER) && POKEMON_DEX_ORDER.length
    ? POKEMON_DEX_ORDER
    : Object.keys(POKEMON_POINTS);

  return order.map(pokemon => ({
    pokemon,
    family: pokemon,
    region: POKEMON_REGION[pokemon] || 'unknown',
    points: POKEMON_POINTS[pokemon] || 0,
    claimed: !!claimedByPokemon[pokemon],
    claimedBy: claimedByPokemon[pokemon] || null
  }));
}
