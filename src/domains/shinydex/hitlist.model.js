// src/domains/shinydex/hitlist.model.js
// Shiny Dex — HITLIST CLAIM MODEL
// PURE FUNCTION — deterministic, order-dependent
// SINGLE SOURCE OF TRUTH for hitlist ownership

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
  // 1. BUILD FAMILY → ORDERED STAGES (ONCE)
  // -------------------------------------------------------

  const familyStages = {};
  const pokemonToFamily = {};

  Object.entries(pokemonFamilies).forEach(([pokemon, family]) => {
    const root = family[0];

    familyStages[root] ??= [];
    familyStages[root].push(pokemon);

    pokemonToFamily[pokemon] = root;
  });

  // ensure deterministic stage order
  Object.values(familyStages).forEach(stages => stages.sort());

  // -------------------------------------------------------
  // 2. INITIALIZE FAMILY CURSORS
  // -------------------------------------------------------

  const familyCursor = {};
  const claimedByPokemon = {};

  Object.keys(familyStages).forEach(root => {
    familyCursor[root] = 0;
  });

  // -------------------------------------------------------
  // 3. FLATTEN WEEKLY MODEL → CLAIM EVENTS (ORDER PRESERVED)
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
  // 4. RESOLVE CLAIMS (STRICT STAGE PROGRESSION)
  // -------------------------------------------------------

  events.forEach(event => {
    const root = pokemonToFamily[event.pokemon];
    if (!root) return;

    const stages = familyStages[root];
    const index = familyCursor[root];

    if (index >= stages.length) return;

    const stagePokemon = stages[index];

    claimedByPokemon[stagePokemon] = event.member;
    familyCursor[root] += 1;
  });

  // -------------------------------------------------------
  // 5. FINAL DEX SNAPSHOT (POKÉDEX ORDER)
  // -------------------------------------------------------

  return Object.keys(POKEMON_POINTS).map(pokemon => {
    const root = pokemonToFamily[pokemon] || pokemon;

    return {
      pokemon,
      family: root,
      region: POKEMON_REGION[pokemon] || 'unknown',
      points: POKEMON_POINTS[pokemon],
      claimed: pokemon in claimedByPokemon,
      claimedBy: claimedByPokemon[pokemon] || null
    };
  });
}
