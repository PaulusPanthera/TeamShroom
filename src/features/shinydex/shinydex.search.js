// v2.0.0-alpha.1
// src/features/shinydex/shinydex.search.js
// Search parsing + matching helpers (no DOM)

import { prettifyPokemonName } from '../../utils/utils.js';

export function parseSearch(raw) {
  var input = String(raw || '').trim();
  if (!input) return { kind: 'none', q: '', flags: {}, filters: {} };

  var lower = input.toLowerCase();

  // hard prefixes
  if (lower.indexOf('@') === 0) {
    var mq = input.slice(1).trim();
    return { kind: 'member', q: mq.toLowerCase(), flags: {}, filters: {} };
  }

  if (lower.indexOf('+') === 0) {
    var fq = input.slice(1).trim();
    return { kind: 'family', q: fq.toLowerCase(), flags: {}, filters: {} };
  }

  if (lower.lastIndexOf('+') === lower.length - 1) {
    var fq2 = input.slice(0, -1).trim();
    return { kind: 'family', q: fq2.toLowerCase(), flags: {}, filters: {} };
  }

  // token parsing (filters + directives)
  var parts = input.split(/\s+/).filter(Boolean);
  var flags = {};
  var filters = {};
  var directive = null; // { kind, q }
  var residual = [];

  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    var t = p.toLowerCase();

    // boolean flags
    if (t === 'unclaimed') { flags.unclaimed = true; continue; }
    if (t === 'claimed')   { flags.claimed = true; continue; }
    if (t === 'unowned')   { flags.unowned = true; continue; }
    if (t === 'owned')     { flags.owned = true; continue; }

    // tier filter (tier:0..6 | tier:lm)
    var mTier = t.match(/^tier:(lm|[0-6])$/);
    if (mTier) {
      filters.tier = mTier[1];
      continue;
    }

    // region filter (region:kanto | r:kanto)
    var mRegion = t.match(/^(region|r):(.*)$/);
    if (mRegion) {
      var rest = (p.slice(p.indexOf(':') + 1) || '').trim();
      if (rest) filters.region = rest.toLowerCase();
      continue;
    }

    // directives (first one only)
    var m = t.match(/^(pokemon|p|family|f|member|m):(.*)$/);
    if (m && directive === null) {
      var key = m[1];
      var rest2 = (p.slice(p.indexOf(':') + 1) || '').trim();
      var dq = rest2 ? rest2 : '';

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
    var q = directive.q || residual.join(' ').trim().toLowerCase();
    return { kind: directive.kind, q: q, flags: flags, filters: filters };
  }

  return {
    kind: 'species',
    q: residual.join(' ').trim().toLowerCase(),
    flags: flags,
    filters: filters
  };
}

export function buildSearchContext(dexOrder, familiesMap) {
  var dexIndex = {};
  for (var i = 0; i < dexOrder.length; i++) dexIndex[dexOrder[i]] = i;

  var rootByPokemon = {};
  var familyMembersByRoot = {};

  var entries = Object.entries(familiesMap || {});
  for (var j = 0; j < entries.length; j++) {
    var pokemon = entries[j][0];
    var roots = entries[j][1];

    var root = (Array.isArray(roots) && roots.length) ? roots[0] : pokemon;

    rootByPokemon[pokemon] = root;

    if (!familyMembersByRoot[root]) familyMembersByRoot[root] = new Set();
    familyMembersByRoot[root].add(pokemon);
  }

  return { dexIndex: dexIndex, rootByPokemon: rootByPokemon, familyMembersByRoot: familyMembersByRoot };
}

export function speciesMatches(pokemonKey, q) {
  if (!q) return true;

  var key = String(pokemonKey || '').toLowerCase();
  var display = prettifyPokemonName(key).toLowerCase();

  return display.indexOf(q) !== -1 || key.indexOf(q) !== -1;
}

export function memberMatches(memberName, q) {
  if (!q) return true;
  return String(memberName || '').toLowerCase().indexOf(q) !== -1;
}

export function resolveFamilyRootsByQuery(searchCtx, q) {
  var roots = new Set();
  if (!q) return roots;

  var rootByPokemon = searchCtx.rootByPokemon || {};
  var familyMembersByRoot = searchCtx.familyMembersByRoot || {};

  var keys = Object.keys(rootByPokemon);
  for (var i = 0; i < keys.length; i++) {
    var pokemon = keys[i];
    if (!speciesMatches(pokemon, q)) continue;

    var root = rootByPokemon[pokemon] || pokemon;
    if (familyMembersByRoot[root]) roots.add(root);
  }

  return roots;
}
