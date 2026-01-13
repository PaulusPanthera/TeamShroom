// v2.0.0-alpha.1
// src/features/shinydex/shinydex.living.presenter.js
// Living Dex Presenter — view-specific data prep (no DOM)

import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';

import {
  parseSearch,
  resolveFamilyRootsByQuery,
  speciesMatches,
  memberMatches
} from './shinydex.search.js';

function normalizeRegion(raw) {
  return String(raw || '').trim().toLowerCase();
}

function regionMatches(regionValue, query) {
  var r = normalizeRegion(regionValue);
  var q = normalizeRegion(query);
  if (!q) return true;
  return r.indexOf(q) === 0; // prefix match
}

function dexIdx(searchCtx, pokemon) {
  var v = searchCtx && searchCtx.dexIndex ? searchCtx.dexIndex[pokemon] : undefined;
  return (typeof v === 'number') ? v : 999999;
}

export function prepareLivingDexRenderModel({
  showcaseRows,
  viewState,
  searchCtx
}) {
  var mode = viewState.sort; // 'standard' | 'total'
  var parsed = parseSearch(viewState.search);

  var snapshot = buildShinyLivingDexModel(showcaseRows);

  if (parsed.filters && parsed.filters.region) {
    var rq = parsed.filters.region;
    snapshot = snapshot.filter(function (e) { return regionMatches(e.region, rq); });
  }

  var totalSpecies = snapshot.length;
  var ownedSpecies = snapshot.filter(function (e) { return e.count > 0; }).length;
  var unownedSpecies = totalSpecies - ownedSpecies;

  var regionStats = {};
  snapshot.forEach(function (e) {
    var region = e.region || 'unknown';
    if (!regionStats[region]) regionStats[region] = { total: 0, owned: 0 };
    regionStats[region].total += 1;
    if (e.count > 0) regionStats[region].owned += 1;
  });

  var forceUnowned = !!parsed.flags.unowned;
  var forceOwned = !!parsed.flags.owned;
  var effectiveUnclaimed = forceUnowned ? true : (forceOwned ? false : !!viewState.showUnclaimed);

  var modeSet = snapshot;

  if (mode === 'total') {
    modeSet = [].concat(modeSet).sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return dexIdx(searchCtx, a.pokemon) - dexIdx(searchCtx, b.pokemon);
    });
  }

  if (effectiveUnclaimed) modeSet = modeSet.filter(function (e) { return e.count === 0; });
  if (forceOwned) modeSet = modeSet.filter(function (e) { return e.count > 0; });

  var visible = modeSet;

  if (parsed.kind === 'member' && parsed.q) {
    visible = visible.filter(function (e) {
      return Array.isArray(e.owners) && e.owners.some(function (o) { return memberMatches(o, parsed.q); });
    });
  } else if (parsed.kind === 'family' && parsed.q) {
    var roots = resolveFamilyRootsByQuery(searchCtx, parsed.q);
    visible = visible.filter(function (e) {
      var root = searchCtx.rootByPokemon[e.pokemon] || e.pokemon;
      return roots.has(root);
    });
  } else if (parsed.kind === 'species' && parsed.q) {
    visible = visible.filter(function (e) { return speciesMatches(e.pokemon, parsed.q); });
  }

  var byRegion = {};
  visible.forEach(function (e) {
    var region = e.region || 'unknown';
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(e);
  });

  var countLabelText = effectiveUnclaimed
    ? (unownedSpecies + ' Unowned')
    : (ownedSpecies + ' / ' + totalSpecies + ' Owned');

  return {
    sections: Object.entries(byRegion).map(function (pair) {
      var region = pair[0];
      var entries = pair[1];

      var stats = regionStats[region] || { owned: 0, total: 0 };
      var regionUnowned = stats.total - stats.owned;

      var title = effectiveUnclaimed
        ? (region.toUpperCase() + ' (' + regionUnowned + ' Unowned)')
        : (region.toUpperCase() + ' (' + stats.owned + ' / ' + stats.total + ')');

      return {
        key: region,
        title: title,
        entries: entries.map(function (e) {
          return Object.assign({}, e, { highlighted: e.count > 0 });
        })
      };
    }),
    countLabelText: countLabelText
  };
}
