// v2.0.0-alpha.1
// src/features/shinydex/shinydex.search.js
// Shiny Dex — Search Parsing + Matching + Family Context

import { prettifyPokemonName } from '../../utils/utils.js';

export function parseSearch(input) {
  const raw = String(input || '').trim();
  const lower = raw.toLowerCase();

  const out = {
    raw: raw,
    kind: 'species',  // 'species' | 'family' | 'member'
    q: '',
    filters: {
      region: null,
      tier: null
    },
    flags: {
      unclaimed: false,
      claimed: false,
      unowned: false,
      owned: false
    }
  };

  if (!lower) return out;

  // tokens split by whitespace
  const tokens = lower.split(/\s+/).filter(Boolean);

  // detect prefix forms first (r: / region: / tier:)
  tokens.forEach(t => {
    if (t.indexOf('r:') === 0) out.filters.region = t.slice(2);
    if (t.indexOf('region:') === 0) out.filters.region = t.slice(7);

    if (t.indexOf('tier:') === 0) out.filters.tier = t.slice(5);
  });

  tokens.forEach(t => {
    if (t === 'unclaimed') out.flags.unclaimed = true;
    if (t === 'claimed') out.flags.claimed = true;
    if (t === 'unowned') out.flags.unowned = true;
    if (t === 'owned') out.flags.owned = true;
  });

  // member search
  const at = lower.match(/(^| )@([a-z0-9._-]+)/);
  if (at && at[2]) {
    out.kind = 'member';
    out.q = at[2];
    return out;
  }
  const member = lower.match(/(^| )member:([a-z0-9._-]+)/);
  if (member && member[2]) {
    out.kind = 'member';
    out.q = member[2];
    return out;
  }

  // family search (+name / name+ / family:name)
  const fam1 = lower.match(/(^| )\+([a-z0-9._-]+)/);
  if (fam1 && fam1[2]) {
    out.kind = 'family';
    out.q = fam1[2];
    return out;
  }
  const fam2 = lower.match(/(^| )([a-z0-9._-]+)\+/);
  if (fam2 && fam2[2]) {
    out.kind = 'family';
    out.q = fam2[2];
    return out;
  }
  const fam3 = lower.match(/(^| )family:([a-z0-9._-]+)/);
  if (fam3 && fam3[2]) {
    out.kind = 'family';
    out.q = fam3[2];
    return out;
  }

  // default species query: remove filter tokens from visible query
  const removed = tokens.filter(t => {
    if (t.indexOf('r:') === 0) return false;
    if (t.indexOf('region:') === 0) return false;
    if (t.indexOf('tier:') === 0) return false;
    if (t === 'unclaimed' || t === 'claimed' || t === 'unowned' || t === 'owned') return false;
    return true;
  });

  out.kind = 'species';
  out.q = removed.join(' ').trim();
  return out;
}

export function memberMatches(name, q) {
  const n = String(name || '').toLowerCase();
  const s = String(q || '').toLowerCase();
  if (!s) return true;
  return n.indexOf(s) !== -1;
}

export function speciesMatches(pokemonKey, q) {
  const label = prettifyPokemonName(pokemonKey).toLowerCase();
  const s = String(q || '').toLowerCase();
  if (!s) return true;
  return label.indexOf(s) !== -1;
}

/*
searchCtx contract:
{
  rootByPokemon: { [pokemonKey]: rootKey }
  pokemonByRoot: { [rootKey]: string[] }
  displayByPokemon: { [pokemonKey]: string }  // lowercased
}
*/
export function buildSearchContext({ dexOrder, familyRootsByPokemon }) {
  const order = Array.isArray(dexOrder) && dexOrder.length ? dexOrder : Object.keys(familyRootsByPokemon || {});
  const rootByPokemon = {};
  const pokemonByRoot = {};
  const displayByPokemon = {};

  order.forEach(p => {
    const key = String(p || '').toLowerCase();
    if (!key) return;

    const roots = (familyRootsByPokemon && familyRootsByPokemon[key]) || null;
    const root = Array.isArray(roots) && roots.length ? String(roots[0] || '').toLowerCase() : key;

    rootByPokemon[key] = root;

    if (!pokemonByRoot[root]) pokemonByRoot[root] = [];
    pokemonByRoot[root].push(key);

    displayByPokemon[key] = prettifyPokemonName(key).toLowerCase();
  });

  return {
    rootByPokemon: rootByPokemon,
    pokemonByRoot: pokemonByRoot,
    displayByPokemon: displayByPokemon
  };
}

export function resolveFamilyRootsByQuery(searchCtx, q) {
  const s = String(q == null ? '' : q).toLowerCase().trim();
  const set = new Set();
  if (!s || !searchCtx) return set;

  const roots = Object.keys(searchCtx.pokemonByRoot || {});
  roots.forEach(root => {
    const mons = searchCtx.pokemonByRoot[root] || [];
    for (let i = 0; i < mons.length; i++) {
      const mon = mons[i];
      const label = searchCtx.displayByPokemon[mon] || mon;
      if (label.indexOf(s) !== -1) {
        set.add(root);
        break;
      }
    }
  });

  return set;
}
