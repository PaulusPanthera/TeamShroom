// v2.0.0-alpha.1
// src/domains/shinydex/hitlist.model.js
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
          pokemon: (shiny.pokemon || '').toLowerCase()
        });
      });
    });
  });

  // CLAIM RESOLUTION (FAMILY ROOT → NEXT UNCLAIMED STAGE, PROGRESSIVE)
  // NOTE: pokemonFamilies here are FAMILY ROOTS from CI, not evo stages.
  // We still lock by "root", and claim species in dex order per root.
  const claimedByPokemon = {};
  const claimedSlotsByRoot = {};

  // Build rootByPokemon (first family root, else itself)
  const rootByPokemon = {};
  const order = Array.isArray(POKEMON_DEX_ORDER) && POKEMON_DEX_ORDER.length
    ? POKEMON_DEX_ORDER
    : Object.keys(POKEMON_POINTS);

  order.forEach(p => {
    const roots = pokemonFamilies[p] || [];
    rootByPokemon[p] = roots.length ? roots[0] : p;
  });

  // Precompute speciesByRoot in DEX order (this is the stage list for locking)
  const speciesByRoot = {};
  order.forEach(p => {
    const root = rootByPokemon[p] || p;
    if (!speciesByRoot[root]) speciesByRoot[root] = [];
    speciesByRoot[root].push(p);
  });

  events.forEach(event => {
    const mon = event.pokemon;
    if (!mon) return;

    const root = rootByPokemon[mon] || mon;
    const stages = speciesByRoot[root] || [mon];

    if (!claimedSlotsByRoot[root]) claimedSlotsByRoot[root] = {};

    // next unclaimed stage within this root (dex-ordered)
    let nextStage = null;
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      if (!claimedSlotsByRoot[root][stage]) {
        nextStage = stage;
        break;
      }
    }
    if (!nextStage) return;

    claimedSlotsByRoot[root][nextStage] = event.member;
    claimedByPokemon[nextStage] = event.member;
  });

  return order.map(pokemon => ({
    pokemon,
    family: rootByPokemon[pokemon] || pokemon,
    region: POKEMON_REGION[pokemon] || 'unknown',
    points: POKEMON_POINTS[pokemon] || 0,
    claimed: !!claimedByPokemon[pokemon],
    claimedBy: claimedByPokemon[pokemon] || null
  }));
}
