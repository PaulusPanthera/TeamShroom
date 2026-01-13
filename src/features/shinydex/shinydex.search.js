// v2.0.0-alpha.1
// src/features/shinydex/shinydex.search.js
// Search parsing + matching + context builder

import { prettifyPokemonName } from '../../utils/utils.js';
import { pokemonFamilies, POKEMON_DEX_ORDER } from '../../data/pokemondatabuilder.js';

export function buildSearchContext() {
  var rootByPokemon = {};
  var stagesByRoot = {};
  var dexIndexByPokemon = {};

  if (Array.isArray(POKEMON_DEX_ORDER)) {
    for (var i = 0; i < POKEMON_DEX_ORDER.length; i++) {
      dexIndexByPokemon[POKEMON_DEX_ORDER[i]] = i;
    }
  }

  var keys = Object.keys(pokemonFamilies || {});
  for (var k = 0; k < keys.length; k++) {
    var mon = keys[k];
    var fam = pokemonFamilies[mon];
    if (!Array.isArray(fam) || fam.length === 0) {
      rootByPokemon[mon] = mon;
      if (!stagesByRoot[mon]) stagesByRoot[mon] = [mon];
      continue;
    }

    // assume fam is the full evolution stage list (CI-owned)
    var root = String(fam[0] || mon).toLowerCase();
    rootByPokemon[mon] = root;

    if (!stagesByRoot[root]) stagesByRoot[root] = [];
    for (var s = 0; s < fam.length; s++) {
      var stage = String(fam[s] || '').toLowerCase();
      if (!stage) continue;
      stagesByRoot[root].push(stage);
      rootByPokemon[stage] = root;
    }
  }

  return {
    rootByPokemon: rootByPokemon,
    stagesByRoot: stagesByRoot,
    dexIndexByPokemon: dexIndexByPokemon
  };
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function parseSearch(raw) {
  var text = String(raw || '').trim();
  var out = {
    raw: text,
    kind: 'none', // 'species' | 'family' | 'member' | 'none'
    q: '',
    filters: { region: '', tier: '' },
    flags: { unclaimed: false, claimed: false, unowned: false, owned: false }
  };

  if (!text) return out;

  // flags anywhere
  var lower = text.toLowerCase();
  if (lower.indexOf('unclaimed') !== -1) out.flags.unclaimed = true;
  if (lower.indexOf('claimed') !== -1) out.flags.claimed = true;
  if (lower.indexOf('unowned') !== -1) out.flags.unowned = true;
  if (lower.indexOf('owned') !== -1) out.flags.owned = true;

  // token scan (space separated)
  var parts = lower.split(/\s+/);
  var keep = [];

  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    if (!p) continue;

    // region forms:
    // r:k  r:kan  region:uno
    if (p.indexOf('r:') === 0) {
      out.filters.region = p.slice(2);
      continue;
    }
    if (p.indexOf('region:') === 0) {
      out.filters.region = p.slice(7);
      continue;
    }

    // tier forms:
    // tier:0 tier:1 tier:lm
    if (p.indexOf('tier:') === 0) {
      out.filters.tier = p.slice(5).replace(/[^a-z0-9]/g, '');
      continue;
    }
    if (p.indexOf('t:') === 0) {
      out.filters.tier = p.slice(2).replace(/[^a-z0-9]/g, '');
      continue;
    }

    // explicit kind prefixes
    if (p.indexOf('pokemon:') === 0 || p.indexOf('p:') === 0) {
      out.kind = 'species';
      out.q = p.split(':').slice(1).join(':');
      continue;
    }
    if (p.indexOf('family:') === 0 || p.indexOf('f:') === 0) {
      out.kind = 'family';
      out.q = p.split(':').slice(1).join(':');
      continue;
    }
    if (p.indexOf('member:') === 0 || p.indexOf('m:') === 0) {
      out.kind = 'member';
      out.q = p.split(':').slice(1).join(':');
      continue;
    }

    // @name member shorthand
    if (p.charAt(0) === '@') {
      out.kind = 'member';
      out.q = p.slice(1);
      continue;
    }

    // +name / name+ family shorthand
    if (p.charAt(0) === '+' || p.charAt(p.length - 1) === '+') {
      out.kind = 'family';
      out.q = p.replace(/\+/g, '');
      continue;
    }

    // ignore pure flags already handled
    if (p === 'unclaimed' || p === 'claimed' || p === 'unowned' || p === 'owned') {
      continue;
    }

    keep.push(p);
  }

  if (!out.q && keep.length) {
    // default = species query
    out.kind = 'species';
    out.q = keep.join(' ');
  }

  out.q = String(out.q || '').trim();
  return out;
}

export function speciesMatches(pokemonKey, query) {
  var q = norm(query);
  if (!q) return true;

  var key = norm(pokemonKey).replace(/\s+/g, '');
  var pretty = norm(prettifyPokemonName(pokemonKey)).replace(/\s+/g, '');

  return pretty.indexOf(q.replace(/\s+/g, '')) !== -1 || key.indexOf(q.replace(/\s+/g, '')) !== -1;
}

export function memberMatches(memberName, query) {
  var q = norm(query);
  if (!q) return true;
  return norm(memberName).indexOf(q) !== -1;
}

export function resolveFamilyRootsByQuery(searchCtx, query) {
  var roots = new Set();
  var q = norm(query).replace(/\s+/g, '');
  if (!q) return roots;

  var rootMap = (searchCtx && searchCtx.stagesByRoot) ? searchCtx.stagesByRoot : {};

  var allRoots = Object.keys(rootMap);
  for (var i = 0; i < allRoots.length; i++) {
    var root = allRoots[i];
    var stages = rootMap[root] || [];

    // match any stage name in the family
    for (var s = 0; s < stages.length; s++) {
      var stage = stages[s];
      var pretty = norm(prettifyPokemonName(stage)).replace(/\s+/g, '');
      var key = norm(stage).replace(/\s+/g, '');

      if (pretty.indexOf(q) !== -1 || key.indexOf(q) !== -1) {
        roots.add(root);
        break;
      }
    }
  }

  return roots;
}

export function stableDexSort(searchCtx, arr, keyField) {
  var map = (searchCtx && searchCtx.dexIndexByPokemon) ? searchCtx.dexIndexByPokemon : {};
  var kf = keyField || 'pokemon';

  arr.sort(function (a, b) {
    var ka = a && a[kf] ? a[kf] : '';
    var kb = b && b[kf] ? b[kf] : '';
    var ia = typeof map[ka] === 'number' ? map[ka] : 999999;
    var ib = typeof map[kb] === 'number' ? map[kb] : 999999;
    return ia - ib;
  });

  return arr;
}
