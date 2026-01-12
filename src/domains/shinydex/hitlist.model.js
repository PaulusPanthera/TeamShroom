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
  // 1. DEX ORDER (DETERMINISTIC)
  // -------------------------------------------------------

  const dexOrder = Object.keys(POKEMON_POINTS);

  // -------------------------------------------------------
  // 2. FAMILY ROOT LOOKUP (ONCE)
  // -------------------------------------------------------

  const pokemonToFamily = {};
  Object.entries(pokemonFamilies).forEach(([pokemon, family]) => {
    const root = Array.isArray(family) && family.length ? family[0] : pokemon;
    pokemonToFamily[pokemon] = root;
  });

  // -------------------------------------------------------
  // 3. FAMILY → ORDERED STAGES (DEX ORDER)
  // -------------------------------------------------------

  const familyStages = {};
  dexOrder.forEach(pokemon => {
    const root = pokemonToFamily[pokemon];
    if (!root) return;

    familyStages[root] ??= [];
    familyStages[root].push(pokemon);
  });

  // -------------------------------------------------------
  // 4. INITIALIZE FAMILY CURSORS
  // -------------------------------------------------------

  const familyCursor = {};
  Object.keys(familyStages).forEach(root => {
    familyCursor[root] = 0;
  });

  const claimedByPokemon = {};

  // -------------------------------------------------------
  // 5. FLATTEN WEEKLY MODEL → CLAIM EVENTS (ORDER PRESERVED)
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
  // 6. RESOLVE CLAIMS (STRICT STAGE PROGRESSION)
  // -------------------------------------------------------

  events.forEach(event => {
    const root = pokemonToFamily[event.pokemon];
    if (!root) return;

    const stages = familyStages[root];
    if (!stages) return;

    const index = familyCursor[root];
    if (index >= stages.length) return;

    const stagePokemon = stages[index];

    claimedByPokemon[stagePokemon] = event.member;
    familyCursor[root] = index + 1;
  });

  // -------------------------------------------------------
  // 7. FINAL DEX SNAPSHOT (DEX ORDER)
  // -------------------------------------------------------

  return dexOrder.map(pokemon => {
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
