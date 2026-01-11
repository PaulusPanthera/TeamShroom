// src/data/pokemondatabuilder.js
// Pokémon derived data builder
// Runtime consumes pre-normalized JSON only

/*
INTERNAL JSON API — DERIVED POKÉMON DATA

HITLIST_DEX:
{
  [region: string]: Array<{
    pokemon: string
    family: string
    stage: number
    claimed: boolean
    claimer: string | null
    points: number
  }>
}

HITLIST_LEADERBOARD:
{
  byClaims: Array<{ member: string, claims: number }>
  byPoints: Array<{ member: string, points: number }>
}

LIVING_COUNTS:
{
  [pokemon: string]: number
}
*/

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
// RUNTIME STATE (DERIVED, SINGLE SOURCE OF TRUTH)
// ---------------------------------------------------------

export let TIER_FAMILIES = {};
export let POKEMON_POINTS = {};
export let POKEMON_TIER = {};
export let POKEMON_REGION = {};
export let POKEMON_RARITY = {};
export let POKEMON_SHOW = {};
export let pokemonFamilies = {};

export let LIVING_COUNTS = {};
export let HITLIST_DEX = {};
export let HITLIST_LEADERBOARD = {
  byClaims: [],
  byPoints: []
};

// ---------------------------------------------------------
// BUILDER
// ---------------------------------------------------------

export function buildPokemonData(pokemonRows, teamMembers = [], shinyWeeklyRows = []) {
  TIER_FAMILIES = {};
  POKEMON_POINTS = {};
  POKEMON_TIER = {};
  POKEMON_REGION = {};
  POKEMON_RARITY = {};
  POKEMON_SHOW = {};
  pokemonFamilies = {};
  LIVING_COUNTS = {};
  HITLIST_DEX = {};
  HITLIST_LEADERBOARD = { byClaims: [], byPoints: [] };

  // Base Pokémon maps
  pokemonRows.forEach(row => {
    const tier = String(row.tier);
    if (!TIER_POINTS[tier]) return;

    const family = Array.isArray(row.family)
      ? row.family
      : String(row.family)
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);

    if (!family.length) return;

    const base = family[0];

    TIER_FAMILIES[tier] ??= [];
    if (!TIER_FAMILIES[tier].includes(base)) {
      TIER_FAMILIES[tier].push(base);
    }

    family.forEach(name => {
      pokemonFamilies[name] = family;
      POKEMON_POINTS[name] = TIER_POINTS[tier];
      POKEMON_TIER[name] = tier;
      POKEMON_REGION[name] = row.region;
      POKEMON_RARITY[name] = row.rarity;
      POKEMON_SHOW[name] = row.show === true;
      LIVING_COUNTS[name] = 0;
    });
  });

  // Living Dex counts
  teamMembers.forEach(member => {
    member.shinies.forEach(mon => {
      if (mon.lost || mon.sold) return;
      if (!POKEMON_POINTS[mon.pokemon]) return;
      LIVING_COUNTS[mon.pokemon] += 1;
    });
  });

  // Hitlist claim engine
  const claimedStages = {};
  const claimsByMember = {};
  const pointsByMember = {};

  shinyWeeklyRows.forEach(event => {
    const family = pokemonFamilies[event.pokemon];
    if (!family || !family.length) return;

    claimedStages[family[0]] ??= new Set();
    const claimedSet = claimedStages[family[0]];
    if (claimedSet.size >= family.length) return;

    const stageIndex = family.findIndex(
      (_, idx) => !claimedSet.has(idx)
    );
    if (stageIndex === -1) return;

    const stagePokemon = family[stageIndex];
    claimedSet.add(stageIndex);

    claimsByMember[event.ot] ??= 0;
    pointsByMember[event.ot] ??= 0;

    claimsByMember[event.ot] += 1;
    pointsByMember[event.ot] += POKEMON_POINTS[stagePokemon] || 0;
  });

  // Build Hitlist Dex
  Object.entries(pokemonFamilies).forEach(([pokemon, family]) => {
    if (!POKEMON_SHOW[pokemon]) return;

    const region = POKEMON_REGION[pokemon] || 'unknown';
    const stage = family.indexOf(pokemon);

    HITLIST_DEX[region] ??= [];

    const claimedSet = claimedStages[family[0]] || new Set();
    const claimed = claimedSet.has(stage);

    HITLIST_DEX[region].push({
      pokemon,
      family: family[0],
      stage,
      claimed,
      claimer: null,
      points: POKEMON_POINTS[pokemon] || 0
    });
  });

  // Leaderboards
  HITLIST_LEADERBOARD.byClaims = Object.entries(claimsByMember)
    .map(([member, claims]) => ({ member, claims }))
    .sort((a, b) => b.claims - a.claims);

  HITLIST_LEADERBOARD.byPoints = Object.entries(pointsByMember)
    .map(([member, points]) => ({ member, points }))
    .sort((a, b) => b.points - a.points);
}
