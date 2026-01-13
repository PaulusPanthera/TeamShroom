// v2.0.0-alpha.1
// src/features/shinydex/shinydex.livingdex.presenter.js
// Living Dex Presenter — view-specific data prep (no DOM)

import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';
import {
  POKEMON_REGION,
  POKEMON_SHOW,
  POKEMON_POINTS
} from '../../data/pokemondatabuilder.js';

import {
  parseSearch,
  resolveFamilyRootsByQuery,
  speciesMatches,
  memberMatches
} from './shinydex.search.js';

function tierFromPoints(points) {
  var p = Number(points) || 0;
  if (p >= 100) return 'lm';
  if (p >= 30) return '0';
  if (p >= 25) return '1';
  if (p >= 15) return '2';
  if (p >= 10) return '3';
  if (p >= 6)  return '4';
  if (p >= 3)  return '5';
  if (p >= 2)  return '6';
  return null;
}

function normalizeRegion(raw) {
  return String(raw || '').trim().toLowerCase();
}

function regionMatches(regionValue, query) {
  var r = normalizeRegion(regionValue);
  var q = normalizeRegion(query);
  if (!q) return true;
  return r.indexOf(q) === 0; // prefix match
}

function stableDexIndex(searchCtx, pokemon) {
  if (searchCtx && searchCtx.dexIndexByPokemon && searchCtx.dexIndexByPokemon[pokemon] != null) {
    return searchCtx.dexIndexByPokemon[pokemon];
  }
  // fallback: order by POKEMON_POINTS keys insertion order if available
  var keys = Object.keys(POKEMON_POINTS || {});
  var idx = keys.indexOf(pokemon);
  return idx === -1 ? 999999 : idx;
}

export function prepareLivingDexRenderModel({
  showcaseRows,
  viewState,
  searchCtx
}) {
  var mode = viewState.sort; // 'standard' | 'total'
  var parsed = parseSearch(viewState.search);

  var snapshot = buildShinyLivingDexModel(showcaseRows).filter(function (e) {
    return POKEMON_SHOW[e.pokemon] !== false;
  });

  // region filter
  if (parsed.filters && parsed.filters.region) {
    var rq = parsed.filters.region;
    snapshot = snapshot.filter(function (e) {
      var region = POKEMON_REGION[e.pokemon] || e.region || 'unknown';
      return regionMatches(region, rq);
    });
  }

  // tier filter (optional)
  if (parsed.filters && parsed.filters.tier) {
    var wantedTier = parsed.filters.tier;
    snapshot = snapshot.filter(function (e) {
      var pts = (POKEMON_POINTS && POKEMON_POINTS[e.pokemon]) || 0;
      return tierFromPoints(pts) === wantedTier;
    });
  }

  var totalSpecies = snapshot.length;
  var ownedSpecies = snapshot.filter(function (e) { return (e.count || 0) > 0; }).length;
  var unownedSpecies = totalSpecies - ownedSpecies;

  var regionStats = {};
  snapshot.forEach(function (e) {
    var region = POKEMON_REGION[e.pokemon] || 'unknown';
    if (!regionStats[region]) regionStats[region] = { total: 0, owned: 0 };
    regionStats[region].total += 1;
    if ((e.count || 0) > 0) regionStats[region].owned += 1;
  });

  // unowned toggle rules (button + flags)
  var forceUnowned = !!parsed.flags.unclaimed; // unowned
  var forceOwned = !!parsed.flags.claimed;     // owned
  var effectiveUnowned = forceUnowned ? true : (forceOwned ? false : !!viewState.showUnclaimed);

  var modeSet = snapshot;

  if (effectiveUnowned) modeSet = modeSet.filter(function (e) { return (e.count || 0) === 0; });
  if (forceOwned) modeSet = modeSet.filter(function (e) { return (e.count || 0) > 0; });

  // sort
  if (mode === 'total') {
    modeSet = modeSet.slice().sort(function (a, b) {
      var da = (a.count || 0);
      var db = (b.count || 0);
      if (db !== da) return db - da;
      return stableDexIndex(searchCtx, a.pokemon) - stableDexIndex(searchCtx, b.pokemon);
    });
  }

  // search (last)
  var visible = modeSet;

  if (parsed.kind === 'member' && parsed.q) {
    visible = visible.filter(function (e) {
      if (!e.owners || !e.owners.length) return false;
      for (var i = 0; i < e.owners.length; i++) {
        if (memberMatches(e.owners[i], parsed.q)) return true;
      }
      return false;
    });
  } else if (parsed.kind === 'family' && parsed.q != null) {
    var roots = resolveFamilyRootsByQuery(searchCtx, parsed.q);
    visible = visible.filter(function (e) {
      var root = (searchCtx && searchCtx.rootByPokemon && searchCtx.rootByPokemon[e.pokemon]) || e.pokemon;
      return roots.has(root);
    });
  } else if (parsed.kind === 'species' && parsed.q) {
    visible = visible.filter(function (e) { return speciesMatches(e.pokemon, parsed.q); });
  }

  // group
  var byRegion = {};
  visible.forEach(function (e) {
    var region = POKEMON_REGION[e.pokemon] || 'unknown';
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(e);
  });

  var countLabelText = effectiveUnowned
    ? (unownedSpecies + ' Unowned')
    : (ownedSpecies + ' / ' + totalSpecies + ' Owned');

  return {
    mode: 'standard',
    sections: Object.entries(byRegion).map(function (pair) {
      var region = pair[0];
      var entries = pair[1];

      var stats = regionStats[region] || { owned: 0, total: 0 };
      var regionUnowned = stats.total - stats.owned;

      var title = effectiveUnowned
        ? (region.toUpperCase() + ' (' + regionUnowned + ' Unowned)')
        : (region.toUpperCase() + ' (' + stats.owned + ' / ' + stats.total + ')');

      return { key: region, title: title, entries: entries };
    }),
    countLabelText: countLabelText
  };
}
