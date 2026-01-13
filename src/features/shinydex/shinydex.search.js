// v2.0.0-alpha.1
// src/features/shinydex/shinydex.search.js
// ShinyDex Search Parser + helpers (no DOM)

import { prettifyPokemonName } from '../../utils/utils.js';
import {
  pokemonFamilies,
  POKEMON_DEX_ORDER,
  POKEMON_REGION
} from '../../data/pokemondatabuilder.js';

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

export function buildSearchContext() {
  const order = Array.isArray(POKEMON_DEX_ORDER) ? POKEMON_DEX_ORDER : [];
  const displayByPokemon = {};
  const rootByPokemon = {};
  const membersByRoot = {};
  const roots = new Set();

  order.forEach(p => {
    displayByPokemon[p] = norm(prettifyPokemonName(p));
    const fam = pokemonFamilies[p] || [];
    const root = fam.length ? fam[0] : p;
    rootByPokemon[p] = root;
    roots.add(root);
  });

  // family members (dex order)
  order.forEach(p => {
    const root = rootByPokemon[p] || p;
    if (!membersByRoot[root]) membersByRoot[root] = [];
    membersByRoot[root].push(p);
  });

  return {
    order,
    displayByPokemon,
    rootByPokemon,
    membersByRoot,
    roots: Array.from(roots)
  };
}

/*
parse supports tokens:
- @name / member:name
- +name / name+ / family:name
- r:k  region:kanto (prefix)
- tier:0 tier:1 tier:2 tier:lm etc
- flags: unclaimed claimed unowned owned
- default → species query
*/
export function parseSearch(input) {
  const raw = String(input || '');
  const tokens = raw.split(/\s+/).map(t => t.trim()).filter(Boolean);

  const out = {
    raw,
    kind: 'species',     // species | family | member
    q: '',
    filters: {},         // { region, tier }
    flags: { unclaimed: false, claimed: false, unowned: false, owned: false }
  };

  let q = raw.trim();

  tokens.forEach(tok => {
    const t = tok;

    const low = norm(t);

    if (low === 'unclaimed') out.flags.unclaimed = true;
    if (low === 'claimed') out.flags.claimed = true;
    if (low === 'unowned') out.flags.unowned = true;
    if (low === 'owned') out.flags.owned = true;

    if (low.startsWith('r:') || low.startsWith('region:')) {
      const v = low.replace(/^r:|^region:/, '');
      if (v) out.filters.region = v;
      return;
    }

    if (low.startsWith('tier:') || low.startsWith('t:')) {
      const v = low.replace(/^tier:|^t:/, '');
      if (v) out.filters.tier = v;
      return;
    }
  });

  // detect explicit member
  const m1 = q.match(/(^|\s)@([^\s]+)/);
  const m2 = q.match(/(^|\s)member:([^\s]+)/i);
  if (m1 && m1[2]) {
    out.kind = 'member';
    out.q = norm(m1[2]);
    return out;
  }
  if (m2 && m2[2]) {
    out.kind = 'member';
    out.q = norm(m2[2]);
    return out;
  }

  // detect explicit family
  const f1 = q.match(/(^|\s)\+([^\s]+)/);
  const f2 = q.match(/([^\s]+)\+(\s|$)/);
  const f3 = q.match(/(^|\s)family:([^\s]+)/i);
  if (f1 && f1[2]) {
    out.kind = 'family';
    out.q = norm(f1[2]);
    return out;
  }
  if (f2 && f2[1]) {
    out.kind = 'family';
    out.q = norm(f2[1]);
    return out;
  }
  if (f3 && f3[2]) {
    out.kind = 'family';
    out.q = norm(f3[2]);
    return out;
  }

  // default species query: strip known filter tokens from q
  q = tokens
    .filter(t => {
      const low = norm(t);
      if (low === 'unclaimed' || low === 'claimed' || low === 'unowned' || low === 'owned') return false;
      if (low.startsWith('r:') || low.startsWith('region:')) return false;
      if (low.startsWith('tier:') || low.startsWith('t:')) return false;
      if (low.startsWith('@') || low.startsWith('member:')) return false;
      if (low.startsWith('+') || low.endsWith('+') || low.startsWith('family:')) return false;
      return true;
    })
    .join(' ');

  out.q = norm(q);
  return out;
}

export function speciesMatches(pokemonKey, query, ctx) {
  const q = norm(query);
  if (!q) return true;
  const disp = ctx && ctx.displayByPokemon ? ctx.displayByPokemon[pokemonKey] : norm(prettifyPokemonName(pokemonKey));
  return disp.indexOf(q) !== -1;
}

export function memberMatches(memberName, query) {
  const q = norm(query);
  if (!q) return true;
  return norm(memberName).indexOf(q) !== -1;
}

export function resolveFamilyRootsByQuery(ctx, query) {
  const q = norm(query);
  const set = new Set();
  if (!q || !ctx) return set;

  // match against root key OR any member display name
  const roots = Array.isArray(ctx.roots) ? ctx.roots : [];
  roots.forEach(root => {
    if (norm(root).indexOf(q) !== -1) set.add(root);
  });

  const membersByRoot = ctx.membersByRoot || {};
  Object.keys(membersByRoot).forEach(root => {
    const members = membersByRoot[root] || [];
    for (let i = 0; i < members.length; i++) {
      const p = members[i];
      const disp = ctx.displayByPokemon[p] || '';
      if (disp.indexOf(q) !== -1) {
        set.add(root);
        break;
      }
    }
  });

  return set;
}

export function regionPrefixMatches(regionValue, query) {
  const r = norm(regionValue);
  const q = norm(query);
  if (!q) return true;
  return r.indexOf(q) === 0;
}

export function getRegionForPokemon(pokemonKey) {
  return POKEMON_REGION[pokemonKey] || 'unknown';
}
