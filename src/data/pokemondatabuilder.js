// src/data/pokemondatabuilder.js
// Pokémon derived data builder
// Runtime consumes pre-normalized pokemon.json
// SINGLE SOURCE OF TRUTH for dex-derived structures

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
// DERIVED STATE (EXPORTED, READ-ONLY FOR UI)
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
  // Reset
  POKEMON_POINTS = {};
  POKEMON_REGION = {};
  POKEMON_SHOW = {};
  POKEMON_FAMILIES = {};
  HITLIST_DEX = {};
  LIVING_DEX = {};

  // -----------------------------
  // Base Pokémon data
  // -----------------------------

  pokemonRows.forEach(row => {
    const tier = String(row.tier);
    if (!TIER_POINTS[tier]) return;

    const family = Array.isArray(row.family)
      ? row.family
      : String(row.family)
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);

    family.forEach(name => {
      POKEMON_POINTS[name] = TIER_POINTS[tier];
      POKEMON_REGION[name] = row.region;
      POKEMON_SHOW[name] = row.show === true;
      POKEMON_FAMILIES[name] = family;
    });
  });

  // -----------------------------
  // Living Dex (counts only)
  // -----------------------------

  teamMembers.forEach(member => {
    member.shinies.forEach(mon => {
      if (mon.lost || mon.sold) return;
      if (!POKEMON_POINTS[mon.pokemon]) return;

      const region = POKEMON_REGION[mon.pokemon] || 'unknown';
      LIVING_DEX[region] ??= {};
      LIVING_DEX[region][mon.pokemon] ??= { pokemon: mon.pokemon, count: 0 };
      LIVING_DEX[region][mon.pokemon].count += 1;
    });
  });

  // -----------------------------
  // Hitlist claims (Shiny Weekly ONLY)
  // -----------------------------

  const claimedByFamily = {};

  shinyWeeklyRows.forEach(row => {
    const pokemon = row.pokemon;
    const member = row.ot;

    const family = POKEMON_FAMILIES[pokemon];
    if (!family) return;

    claimedByFamily[pokemon] ??= {};

    const familyKey = family.join('|');
    claimedByFamily[familyKey] ??= {};

    const alreadyClaimed = claimedByFamily[familyKey];

    let claimedStage = null;

    if (!alreadyClaimed[pokemon]) {
      claimedStage = pokemon;
    } else {
      claimedStage = family.find(p => !alreadyClaimed[p]);
    }

    if (!claimedStage) return;

    alreadyClaimed[claimedStage] = member;

    const region = POKEMON_REGION[claimedStage] || 'unknown';
    HITLIST_DEX[region] ??= {};
    HITLIST_DEX[region][claimedStage] = {
      pokemon: claimedStage,
      claimed: true,
      member
    };
  });

  // -----------------------------
  // Fill unclaimed
  // -----------------------------

  Object.keys(POKEMON_POINTS).forEach(pokemon => {
    if (!POKEMON_SHOW[pokemon]) return;

    const region = POKEMON_REGION[pokemon] || 'unknown';
    HITLIST_DEX[region] ??= {};

    if (!HITLIST_DEX[region][pokemon]) {
      HITLIST_DEX[region][pokemon] = {
        pokemon,
        claimed: false,
        member: null
      };
    }
  });
}
