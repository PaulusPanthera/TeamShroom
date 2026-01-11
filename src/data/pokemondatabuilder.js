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

LIVING_DEX:
{
  [region: string]: Array<{
    pokemon: string
    family: string
    stage: number
    ownedCount: number
    owners: Array<string>
  }>
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
// RUNTIME STATE
// ---------------------------------------------------------

export let POKEMON_POINTS = {};
export let POKEMON_REGION = {};
export let POKEMON_SHOW = {};
export let pokemonFamilies = {};

export let HITLIST_DEX = {};
export let HITLIST_LEADERBOARD = { byClaims: [], byPoints: [] };
export let LIVING_DEX = {};

// ---------------------------------------------------------
// BUILDER
// ---------------------------------------------------------

export function buildPokemonData(pokemonRows, teamMembers = [], shinyWeeklyRows = []) {
  POKEMON_POINTS = {};
  POKEMON_REGION = {};
  POKEMON_SHOW = {};
  pokemonFamilies = {};
  HITLIST_DEX = {};
  HITLIST_LEADERBOARD = { byClaims: [], byPoints: [] };
  LIVING_DEX = {};

  // -------------------------------------------------------
  // BASE POKÉMON MAPS
  // -------------------------------------------------------

  pokemonRows.forEach(row => {
    const tier = String(row.tier);
    if (!TIER_POINTS[tier]) return;

    const family = row.family;
    if (!Array.isArray(family) || !family.length) return;

    family.forEach(name => {
      pokemonFamilies[name] = family;
      POKEMON_POINTS[name] = TIER_POINTS[tier];
      POKEMON_REGION[name] = row.region;
      POKEMON_SHOW[name] = row.show === true;
    });
  });

  // -------------------------------------------------------
  // LIVING DEX
  // -------------------------------------------------------

  const ownersByPokemon = {};

  teamMembers.forEach(member => {
    member.shinies.forEach(mon => {
      if (mon.lost || mon.sold) return;
      ownersByPokemon[mon.pokemon] ??= [];
      ownersByPokemon[mon.pokemon].push(member.name);
    });
  });

  Object.entries(pokemonFamilies).forEach(([pokemon, family]) => {
    if (!POKEMON_SHOW[pokemon]) return;

    const region = POKEMON_REGION[pokemon] || 'unknown';

    LIVING_DEX[region] ??= [];
    LIVING_DEX[region].push({
      pokemon,
      family: family[0],
      stage: family.indexOf(pokemon),
      ownedCount: ownersByPokemon[pokemon]?.length || 0,
      owners: ownersByPokemon[pokemon] || []
    });
  });

  // -------------------------------------------------------
  // HITLIST CLAIM ENGINE (ROW ORDER IS LAW)
  // -------------------------------------------------------

  const claimedStages = {}; // family -> Map(stageIndex -> member)
  const claimsByMember = {};
  const pointsByMember = {};

  shinyWeeklyRows.forEach(event => {
    const family = pokemonFamilies[event.pokemon];
    if (!family) return;

    claimedStages[family[0]] ??= new Map();
    const stageMap = claimedStages[family[0]];

    if (stageMap.size >= family.length) return;

    const stageIndex = family.findIndex(
      (_, idx) => !stageMap.has(idx)
    );
    if (stageIndex === -1) return;

    stageMap.set(stageIndex, event.ot);

    claimsByMember[event.ot] ??= 0;
    pointsByMember[event.ot] ??= 0;

    claimsByMember[event.ot] += 1;
    pointsByMember[event.ot] += POKEMON_POINTS[family[stageIndex]] || 0;
  });

  // -------------------------------------------------------
  // BUILD HITLIST DEX
  // -------------------------------------------------------

  Object.entries(pokemonFamilies).forEach(([pokemon, family]) => {
    if (!POKEMON_SHOW[pokemon]) return;

    const region = POKEMON_REGION[pokemon] || 'unknown';
    const stage = family.indexOf(pokemon);

    const stageMap = claimedStages[family[0]];
    const claimer = stageMap?.get(stage) || null;

    HITLIST_DEX[region] ??= [];
    HITLIST_DEX[region].push({
      pokemon,
      family: family[0],
      stage,
      claimed: !!claimer,
      claimer,
      points: POKEMON_POINTS[pokemon] || 0
    });
  });

  // -------------------------------------------------------
  // LEADERBOARDS
  // -------------------------------------------------------

  HITLIST_LEADERBOARD.byClaims = Object.entries(claimsByMember)
    .map(([member, claims]) => ({ member, claims }))
    .sort((a, b) => b.claims - a.claims);

  HITLIST_LEADERBOARD.byPoints = Object.entries(pointsByMember)
    .map(([member, points]) => ({ member, points }))
    .sort((a, b) => b.points - a.points);
}
