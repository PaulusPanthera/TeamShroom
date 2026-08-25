// src/domains/shinydex/hitlist.model.js
// v2.0.0-beta
// Shiny Dex — hitlist claim model (pure, deterministic, order-dependent)

import {
  getPokemonFamiliesMap,
  getPokemonPointsMap,
  getPokemonRegionMap,
  getPokemonDexOrder
} from '../pokemon/pokemon.data.js';
import { computeHitlistVariantDeltas } from '../pokemon/shiny.points.js';

/*
BASE SNAPSHOT OUTPUT:
Array<{
  pokemon: string
  family: string
  region: string
  points: number
  claimed: boolean
  claimedBy: string | null
}>

CLAIM LEDGER OUTPUT:
{
  standardClaims: Claim[]
  bonusClaims: Claim[]
  allClaims: Claim[]
  specialOwnersByPokemon: {
    [pokemon: string]: { secret: string|null, alpha: string|null, safari: string|null }
  }
}

Each Claim is one awarded hitlist claim. Standard family-slot claims and special
variant claims are deliberately separate records so player views never inherit
another player's variant state from a species card.
*/

function normalizePokemonKey(raw) {
  return String(raw || '').trim().toLowerCase();
}

function normalizeMemberName(raw) {
  return String(raw || '').trim();
}

function eventHasSafariFlag(shiny) {
  return Boolean(shiny && shiny.safari === true);
}

// Weighted Total Claims scoring. A normal family-slot claim is worth 1 claim.
// Special variant awards stack independently and contribute extra claim value.
export const HITLIST_CLAIM_VALUES = Object.freeze({
  standard: 1,
  safari: 1,
  secret: 2,
  alpha: 3
});

export function getHitlistClaimValue(kind) {
  const key = String(kind || 'standard').trim().toLowerCase();
  return Number(HITLIST_CLAIM_VALUES[key]) || 0;
}

function flattenValidEvents(weeklyModel) {
  const weeks = Array.isArray(weeklyModel) ? weeklyModel : [];
  const events = [];
  let sequence = 0;

  weeks.forEach((week, weekIndex) => {
    const members = week && week.members ? Object.values(week.members) : [];

    members.forEach(memberGroup => {
      const shinies = memberGroup && Array.isArray(memberGroup.shinies) ? memberGroup.shinies : [];

      shinies.forEach(shiny => {
        if (!shiny || shiny.lost || shiny.run) return;

        const member = normalizeMemberName(shiny.member || memberGroup?.name);
        const pokemon = normalizePokemonKey(shiny.pokemon);
        if (!member || !pokemon) return;

        sequence += 1;
        events.push({
          sequence,
          weekIndex,
          week: String(week?.week || ''),
          weekLabel: String(week?.label || week?.week || ''),
          dateStart: week?.dateStart || null,
          dateEnd: week?.dateEnd || null,
          dateCatch: shiny.dateCatch || null,
          weekOrder: shiny.weekOrder || null,
          member,
          pokemon,
          method: shiny.method || null,
          secret: Boolean(shiny.secret),
          alpha: Boolean(shiny.alpha),
          safari: eventHasSafariFlag(shiny)
        });
      });
    });
  });

  return events;
}

function buildClaimContext() {
  const familiesMap = getPokemonFamiliesMap();
  const pointsMap = getPokemonPointsMap();
  const regionMap = getPokemonRegionMap();
  const dexOrder = getPokemonDexOrder();
  const order = Array.isArray(dexOrder) && dexOrder.length ? dexOrder : Object.keys(pointsMap);

  const rootByPokemon = {};
  order.forEach(p => {
    const roots = familiesMap[p] || [];
    rootByPokemon[p] = roots.length ? roots[0] : p;
  });

  const speciesByRoot = {};
  order.forEach(p => {
    const root = rootByPokemon[p] || p;
    if (!speciesByRoot[root]) speciesByRoot[root] = [];
    speciesByRoot[root].push(p);
  });

  return {
    familiesMap,
    pointsMap,
    regionMap,
    order,
    rootByPokemon,
    speciesByRoot
  };
}

function claimEventMetadata(event) {
  return {
    sequence: event.sequence,
    week: event.week,
    weekLabel: event.weekLabel,
    dateStart: event.dateStart,
    dateEnd: event.dateEnd,
    dateCatch: event.dateCatch,
    weekOrder: event.weekOrder
  };
}

function resolveStandardClaims(events, ctx) {
  const claimedByPokemon = {};
  const claimedSlotsByRoot = {};
  const standardClaims = [];

  events.forEach(event => {
    const mon = event.pokemon;
    const root = ctx.rootByPokemon[mon] || mon;
    const stages = ctx.speciesByRoot[root] || [mon];

    if (!claimedSlotsByRoot[root]) claimedSlotsByRoot[root] = {};

    let claimSlot = null;
    let claimMode = 'exact';

    // 1) Claim the exact caught species first.
    if (!claimedSlotsByRoot[root][mon]) {
      claimSlot = mon;
    } else {
      // 2) Otherwise claim the first still-open stage in this family.
      claimMode = 'fallback';
      for (let i = 0; i < stages.length; i += 1) {
        const stage = stages[i];
        if (!claimedSlotsByRoot[root][stage]) {
          claimSlot = stage;
          break;
        }
      }
    }

    if (!claimSlot) return;

    claimedSlotsByRoot[root][claimSlot] = event.member;
    claimedByPokemon[claimSlot] = event.member;

    standardClaims.push({
      id: `${event.sequence}:standard:${claimSlot}`,
      kind: 'standard',
      member: event.member,
      pokemon: claimSlot,
      caughtPokemon: mon,
      family: root,
      claimMode,
      points: Number(ctx.pointsMap[claimSlot]) || 0,
      tierPoints: Number(ctx.pointsMap[claimSlot]) || 0,
      claimValue: getHitlistClaimValue('standard'),
      isBonus: false,
      ...claimEventMetadata(event)
    });
  });

  return { claimedByPokemon, standardClaims };
}

function resolveBonusClaims(events, ctx) {
  const owners = {};
  const bonusClaims = [];

  function ensureOwners(pokemon) {
    if (!owners[pokemon]) owners[pokemon] = { secret: null, alpha: null, safari: null };
    return owners[pokemon];
  }

  function addBonusClaim(event, kind, points) {
    const slot = ensureOwners(event.pokemon);
    if (slot[kind]) return;

    slot[kind] = event.member;
    bonusClaims.push({
      id: `${event.sequence}:${kind}:${event.pokemon}`,
      kind,
      member: event.member,
      pokemon: event.pokemon,
      caughtPokemon: event.pokemon,
      family: ctx.rootByPokemon[event.pokemon] || event.pokemon,
      claimMode: 'variant',
      points: Number(points) || 0,
      tierPoints: Number(ctx.pointsMap[event.pokemon]) || 0,
      claimValue: getHitlistClaimValue(kind),
      isBonus: true,
      ...claimEventMetadata(event)
    });
  }

  events.forEach(event => {
    const tierPoints = Number(ctx.pointsMap[event.pokemon]) || 0;
    const deltas = computeHitlistVariantDeltas(event, tierPoints);

    if (event.secret) addBonusClaim(event, 'secret', deltas.secretBonus);
    if (event.alpha) addBonusClaim(event, 'alpha', deltas.alphaDelta);
    if (event.safari) addBonusClaim(event, 'safari', deltas.safariBonus);
  });

  return { specialOwnersByPokemon: owners, bonusClaims };
}

export function buildShinyDexClaimLedger(weeklyModel) {
  const events = flattenValidEvents(weeklyModel);
  const ctx = buildClaimContext();

  const standard = resolveStandardClaims(events, ctx);
  const bonus = resolveBonusClaims(events, ctx);

  const allClaims = standard.standardClaims
    .concat(bonus.bonusClaims)
    .sort((a, b) => {
      const ds = (Number(a.sequence) || 0) - (Number(b.sequence) || 0);
      if (ds !== 0) return ds;

      const order = { standard: 0, secret: 1, alpha: 2, safari: 3 };
      return (order[a.kind] ?? 9) - (order[b.kind] ?? 9);
    });

  return {
    standardClaims: standard.standardClaims,
    bonusClaims: bonus.bonusClaims,
    allClaims,
    specialOwnersByPokemon: bonus.specialOwnersByPokemon
  };
}

export function buildShinyDexModel(weeklyModel) {
  const events = flattenValidEvents(weeklyModel);
  const ctx = buildClaimContext();
  const standard = resolveStandardClaims(events, ctx);

  return ctx.order.map(pokemon => ({
    pokemon,
    family: ctx.rootByPokemon[pokemon] || pokemon,
    region: ctx.regionMap[pokemon] || 'unknown',
    points: ctx.pointsMap[pokemon] || 0,
    claimed: !!standard.claimedByPokemon[pokemon],
    claimedBy: standard.claimedByPokemon[pokemon] || null
  }));
}
