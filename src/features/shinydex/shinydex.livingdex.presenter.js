// v2.0.0-alpha.1
// src/features/shinydex/shinydex.livingdex.presenter.js
// LivingDex Presenter — view-specific data prep (no DOM)

import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';
import { POKEMON_SHOW, POKEMON_DEX_ORDER } from '../../data/pokemondatabuilder.js';

import {
  parseSearch,
  speciesMatches,
  resolveFamilyRootsByQuery,
  memberMatches,
  regionPrefixMatches,
  getRegionForPokemon
} from './shinydex.search.js';

export function prepareLivingDexRenderModel({
  showcaseRows,
  viewState,
  searchCtx
}) {
  var parsed = parseSearch(viewState.search);
  var sort = viewState.sort; // 'standard' | 'total'

  // snapshot includes unowned species (domain contract)
  var snapshot = buildShinyLivingDexModel(showcaseRows).filter(function (e) {
    return POKEMON_SHOW[e.pokemon] !== false;
  });

  // region filter (visibility only)
  if (parsed.filters && parsed.filters.region) {
    var rq = parsed.filters.region;
    snapshot = snapshot.filter(function (e) {
      var region = getRegionForPokemon(e.pokemon) || e.region || 'unknown';
      return regionPrefixMatches(region, rq);
    });
  }

  // totals from snapshot (mode dataset, pre-search)
  var totalSpecies = snapshot.length;
  var ownedSpecies = snapshot.filter(function (e) { return (e.count || 0) > 0; }).length;
  var unownedSpecies = totalSpecies - ownedSpecies;

  // apply unowned button
  var forceUnowned = !!parsed.flags.unowned || !!parsed.flags.unclaimed;
  var forceOwned = !!parsed.flags.owned;
  var effectiveUnowned = forceUnowned ? true : (forceOwned ? false : !!viewState.showUnclaimed);

  var modeSet = snapshot;

  if (effectiveUnowned) modeSet = modeSet.filter(function (e) { return (e.count || 0) === 0; });
  if (forceOwned) modeSet = modeSet.filter(function (e) { return (e.count || 0) > 0; });

  // sorting
  if (sort === 'total') {
    // stable tie-break by dex order
    var idx = {};
    (Array.isArray(POKEMON_DEX_ORDER) ? POKEMON_DEX_ORDER : []).forEach(function (p, i) { idx[p] = i; });
    modeSet = modeSet.slice().sort(function (a, b) {
      var dc = (b.count || 0) - (a.count || 0);
      if (dc !== 0) return dc;
      return (idx[a.pokemon] ?? 999999) - (idx[b.pokemon] ?? 999999);
    });
  }

  // apply search LAST (visibility only)
  var visible = modeSet;

  if (parsed.kind === 'member' && parsed.q) {
    // living dex: member search matches owners list
    visible = visible.filter(function (e) {
      var owners = Array.isArray(e.owners) ? e.owners : [];
      for (var i = 0; i < owners.length; i++) {
        if (memberMatches(owners[i], parsed.q)) return true;
      }
      return false;
    });
  } else if (parsed.kind === 'family' && parsed.q) {
    var roots = resolveFamilyRootsByQuery(searchCtx, parsed.q);
    visible = visible.filter(function (e) {
      var root = (searchCtx && searchCtx.rootByPokemon && searchCtx.rootByPokemon[e.pokemon]) || e.pokemon;
      return roots.has(root);
    });
  } else if (parsed.kind === 'species' && parsed.q) {
    visible = visible.filter(function (e) {
      return speciesMatches(e.pokemon, parsed.q, searchCtx);
    });
  }

  // group by region (region headers still show owned/total in-region for snapshot)
  var regionStats = {};
  snapshot.forEach(function (e) {
    var region = getRegionForPokemon(e.pokemon) || 'unknown';
    if (!regionStats[region]) regionStats[region] = { total: 0, owned: 0 };
    regionStats[region].total += 1;
    if ((e.count || 0) > 0) regionStats[region].owned += 1;
  });

  var byRegion = {};
  visible.forEach(function (e) {
    var region = getRegionForPokemon(e.pokemon) || 'unknown';
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(e);
  });

  // header label logic you wanted:
  // - Standard/Total: owned/total Owned
  // - Unowned: unowned Unowned
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
