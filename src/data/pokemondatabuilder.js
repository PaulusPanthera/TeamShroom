// src/data/pokemondatabuilder.js
// Pokémon derived data builder
// Runtime consumes CI-normalized JSON only
// SINGLE SOURCE OF TRUTH for all dex-derived state

export const TIER_POINTS = {
  '6': 2,
  '5': 3,
  '4': 6,
  '3': 10,
  '2': 15,
  '1': 25,
  '0': 30,
  'LM': 100
};

// ---------------------------------------------------------
// DERIVED STATE (READ-ONLY FOR UI)
// ---------------------------------------------------------

export let POKEMON_POINTS = {};
export let POKEMON_REGION = {};
export let POKEMON_SHOW = {};
export let POKEMON_FAMILIES = {};

export let HITLIST_DEX = {};
export let LIVING_DEX = {};

// ---------------------------------------------------------
// BUILDER
// ---------------------------------------------------------

export function buildPokemonData(pokemonRows, teamMembers, shinyWeeklyRows) {
  // -------------------------------------------------------
  // RESET STATE
  // -------------------------------------------------------

  POKEMON_POINTS = {};
  POKEMON_REGION = {};
  POKEMON_SHOW = {};
  POKEMON_FAMILIES = {};
  HITLIST_DEX = {};
  LIVING_DEX = {};

  // -------------------------------------------------------
  // PASS 1 — BASE POKÉMON MAPS (EXHAUSTIVE)
  // -------------------------------------------------------

  pokemonRows.forEach(row => {
    const tier = String(row.tier);
    if (!TIER_POINTS[tier]) return;

    if (!Array.isArray(row.family) || !row.family.length) return;

    row.family.forEach(pokemon => {
      POKEMON_POINTS[pokemon] = TIER_POINTS[tier];
      POKEMON_REGION[pokemon] = row.region || 'unknown';
      POKEMON_SHOW[pokemon] = row.show === true;
      POKEMON_FAMILIES[pokemon] = row.family;
    });
  });

  // -------------------------------------------------------
  // PASS 2 — BASE DEX CONSTRUCTION (NO CLAIMS YET)
  // -------------------------------------------------------

  Object.keys(POKEMON_POINTS).forEach(pokemon => {
    if (!POKEMON_SHOW[pokemon]) return;

    const region = POKEMON_REGION[pokemon];

    HITLIST_DEX[region] ??= {};
    HITLIST_DEX[region][pokemon] = {
      pokemon,
      claimed: false,
      member: null,
      points: POKEMON_POINTS[pokemon]
    };

    LIVING_DEX[region] ??= {};
    LIVING_DEX[region][pokemon] = {
      pokemon,
      count: 0,
      owners: []
    };
  });

  // -------------------------------------------------------
  // PASS 3 — APPLY WEEKLY CLAIMS (ROW ORDER IS LAW)
  // -------------------------------------------------------

  const claimedStagesByFamily = {};

  shinyWeeklyRows.forEach(row => {
    const pokemon = row.pokemon;
    const member = row.ot;

    const family = POKEMON_FAMILIES[pokemon];
    if (!family) return;

    const familyKey = family.join('|');
    claimedStagesByFamily[familyKey] ??= new Set();

    const claimedStages = claimedStagesByFamily[familyKey];

    // Determine which stage is claimed
    let claimedPokemon = null;

    if (!claimedStages.has(pokemon)) {
      claimedPokemon = pokemon;
    } else {
      claimedPokemon = family.find(p => !claimedStages.has(p));
    }

    if (!claimedPokemon) return;

    claimedStages.add(claimedPokemon);

    const region = POKEMON_REGION[claimedPokemon];
    const entry = HITLIST_DEX[region]?.[claimedPokemon];

    if (!entry || entry.claimed) return;

    entry.claimed = true;
    entry.member = member;
  });

  // -------------------------------------------------------
  // PASS 4 — LIVING DEX COUNTS (MEMBERS → SHINIES)
  // -------------------------------------------------------

  teamMembers.forEach(member => {
    member.shinies.forEach(mon => {
      if (mon.lost || mon.sold) return;
      if (!POKEMON_POINTS[mon.pokemon]) return;

      const region = POKEMON_REGION[mon.pokemon];
      const entry = LIVING_DEX[region]?.[mon.pokemon];

      if (!entry) return;

      entry.count += 1;
      entry.owners.push(member.name);
    });
  });
}
