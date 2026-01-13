// v2.0.0-alpha.1
// src/features/shinydex/shinydex.search.js
// Search parsing + matching helpers (no DOM)

import { prettifyPokemonName } from '../../utils/utils.js';

/*
Parsed search output:
{
  kind: 'none' | 'species' | 'family' | 'member'
  q: string
  flags: {
    unclaimed?: boolean
    claimed?: boolean
    unowned?: boolean
    owned?: boolean
  }
  filters: {
    tier?: string        // '0'..'6' | 'lm'
    region?: string      // 'kanto' | 'johto' | ...
  }
}
*/

export function parseSearch(raw) {
  const input = String(raw || '').trim();
  if (!input) return { kind: 'none', q: '', flags: {}, filters: {} };

  const lower = input.toLowerCase();

  // hard prefixes
  if (lower.startsWith('@')) {
    const q = input.slice(1).trim();
    return { kind: 'member', q: q.toLowerCase(), flags: {}, filters: {} };
  }

  if (lower.startsWith('+')) {
    const q = input.slice(1).trim();
    return { kind: 'family', q: q.toLowerCase(), flags: {}, filters: {} };
  }

  if (lower.endsWith('+')) {
    const q = input.slice(0, -1).trim();
    return { kind: 'family', q: q.toLowerCase(), flags: {}, filters: {} };
  }

  // token parsing (filters + directives)
  const parts = input.split(/\s+/).filter(Boolean);
  const flags = {};
  const filters = {};
  let directive = null; // { kind, q }
  const residual = [];

  for (const p of parts) {
    const t = p.toLowerCase();

    // boolean filters
    if (t === 'unclaimed') { flags.unclaimed = true; continue; }
    if (t === 'claimed')   { flags.claimed = true; continue; }
    if (t === 'unowned')   { flags.unowned = true; continue; }
    if (t === 'owned')     { flags.owned = true; continue; }

    // tier filter (tier:0..6 | tier:lm)
    {
      const mTier = t.match(/^tier:(lm|[0-6])$/);
      if (mTier) {
        filters.tier = mTier[1];
        continue;
      }
    }

    // region filter (region:kanto | r:kanto)
    {
      const mRegion = t.match(/^(region|r):(.*)$/);
      if (mRegion) {
        const rest = (p.slice(p.indexOf(':') + 1) || '').trim();
        if (rest) filters.region = rest.toLowerCase();
        continue;
      }
    }

    // directives
    const m = t.match(/^(pokemon|p|family|f|member|m):(.*)$/);
    if (m && directive === null) {
      const key = m[1];
      const rest = (p.slice(p.indexOf(':') + 1) || '').trim();
      const dq = rest ? rest : '';
      if (key === 'member' || key === 'm') directive = { kind: 'member', q: dq.toLowerCase() };
      else if (key === 'family' || key === 'f') directive = { kind: 'family', q: dq.toLowerCase() };
      else directive = { kind: 'species', q: dq.toLowerCase() };
      continue;
    }

    residual.push(p);
  }

  // conflicting flags cancel each other
  if (flags.unclaimed && flags.claimed) { delete flags.unclaimed; delete flags.claimed; }
  if (flags.unowned && flags.owned)     { delete flags.unowned; delete flags.owned; }

  if (directive) {
    const q = directive.q || residual.join(' ').trim().toLowerCase();
    return { kind: directive.kind, q, flags, filters };
  }

  return {
    kind: 'species',
    q: residual.join(' ').trim().toLowerCase(),
    flags,
    filters
  };
}

/*
Search context:
- dexIndex: pokemon -> index
- rootByPokemon: pokemon -> family root key
- familyMembersByRoot: root -> Set(pokemon)
*/
export function buildSearchContext(dexOrder, familiesMap) {
  const dexIndex = {};
  dexOrder.forEach((p, i) => { dexIndex[p] = i; });

  const rootByPokemon = {};
  const familyMembersByRoot = {};

  Object.entries(familiesMap || {}).forEach(([pokemon, roots]) => {
    const root = Array.isArray(roots) && roots.length ? roots[0] : pokemon;
    rootByPokemon[pokemon] = root;
    familyMembersByRoot[root] ??= new Set();
    familyMembersByRoot[root].add(pokemon);
  });

  return { dexIndex, rootByPokemon, familyMembersByRoot };
}

export function speciesMatches(pokemonKey, q) {
  if (!q) return true;

  const key = String(pokemonKey || '').toLowerCase();
  const display = prettifyPokemonName(key).toLowerCase();

  return display.includes(q) || key.includes(q);
}

export function memberMatches(memberName, q) {
  if (!q) return true;
  return String(memberName || '').toLowerCase().includes(q);
}

export function resolveFamilyRootsByQuery(searchCtx, q) {
  const roots = new Set();
  if (!q) return roots;

  const { rootByPokemon, familyMembersByRoot } = searchCtx;

  Object.keys(rootByPokemon).forEach(pokemon => {
    if (!speciesMatches(pokemon, q)) return;
    const root = rootByPokemon[pokemon] || pokemon;
    if (familyMembersByRoot[root]) roots.add(root);
  });

  return roots;
}
