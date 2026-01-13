// v2.0.0-alpha.1
// src/features/shinydex/shinydex.livingdex.presenter.js
// Living Dex Presenter — view-specific data prep (no DOM)

import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';
import { POKEMON_REGION, POKEMON_SHOW, POKEMON_POINTS } from '../../data/pokemondatabuilder.js';

import { parseSearch, speciesMatches, memberMatches, stableDexSort } from './shinydex.search.js';

function tierFromPoints(points) {
  var p = Number(points) || 0;
  if (p >= 100) return 'lm';
  if (p >= 30) return '0';
  if (p >= 25) return '1';
  if (p >= 15) return '2';
  if (p >= 10) return '3';
  if (p >= 6) return '4';
  if (p >= 3) return '5';
  if (p >= 2) return '6';
  return null;
}

function normalizeRegion(raw) {
  return String(raw || '').trim().toLowerCase();
}

function regionMatches(regionValue, query) {
  var r = normalizeRegion(regionValue);
  var q = normalizeRegion(query);
  if (!q) return true;
  return r.indexOf(q) === 0;
}

function uniq(arr) {
  var map = {};
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    var k = String(arr[i] || '').trim();
    if (!k) continue;
    if (map[k]) continue;
    map[k] = 1;
    out.push(k);
  }
  return out;
}

export function prepareLivingDexRenderModel(opts) {
  var showcaseRows = opts && opts.showcaseRows;
  var viewState = opts && opts.viewState;
  var searchCtx = opts && opts.searchCtx;

  var mode = viewState && viewState.sort ? viewState.sort : 'standard'; // 'standard' | 'total'
  var parsed = parseSearch(viewState && viewState.search ? viewState.search : '');

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

  // tier filter (based on points table)
  if (parsed.filters && parsed.filters.tier) {
    var wanted = parsed.filters.tier;
    snapshot = snapshot.filter(function (e) {
      var pts = POKEMON_POINTS[e.pokemon] || 0;
      return tierFromPoints(pts) === wanted;
    });
  }

  // mode dataset (pre-search counters)
  var modeSet = snapshot.slice();

  if (mode === 'total') {
    modeSet.sort(function (a, b) {
      if ((b.count || 0) !== (a.count || 0)) return (b.count || 0) - (a.count || 0);
      var ia = (searchCtx && searchCtx.dexIndexByPokemon && typeof searchCtx.dexIndexByPokemon[a.pokemon] === 'number')
        ? searchCtx.dexIndexByPokemon[a.pokemon] : 999999;
      var ib = (searchCtx && searchCtx.dexIndexByPokemon && typeof searchCtx.dexIndexByPokemon[b.pokemon] === 'number')
        ? searchCtx.dexIndexByPokemon[b.pokemon] : 999999;
      return ia - ib;
    });
  } else {
    stableDexSort(searchCtx, modeSet, 'pokemon');
  }

  // unowned toggle
  var forceUnowned = !!(parsed.flags && parsed.flags.unowned);
  var forceOwned = !!(parsed.flags && parsed.flags.owned);
  var effectiveUnowned = forceUnowned ? true : (forceOwned ? false : !!(viewState && viewState.showUnclaimed));

  if (effectiveUnowned) modeSet = modeSet.filter(function (e) { return (e.count || 0) === 0; });
  if (forceOwned) modeSet = modeSet.filter(function (e) { return (e.count || 0) > 0; });

  // visible = apply search last
  var visible = modeSet;

  if (parsed.kind === 'member' && parsed.q) {
    visible = visible.filter(function (e) {
      var o = Array.isArray(e.owners) ? e.owners : [];
      for (var i = 0; i < o.length; i++) {
        if (memberMatches(o[i], parsed.q)) return true;
      }
      return false;
    });
  } else if (parsed.kind === 'species' && parsed.q) {
    visible = visible.filter(function (e) { return speciesMatches(e.pokemon, parsed.q); });
  } else if (parsed.q) {
    // default: species
    visible = visible.filter(function (e) { return speciesMatches(e.pokemon, parsed.q); });
  }

  // counters (mode dataset, not post-search)
  var totalSpecies = snapshot.length;
  var ownedSpecies = snapshot.filter(function (e) { return (e.count || 0) > 0; }).length;
  var unownedSpecies = totalSpecies - ownedSpecies;

  // region stats from full snapshot (after region/tier filters)
  var regionStats = {};
  snapshot.forEach(function (e) {
    var region = POKEMON_REGION[e.pokemon] || 'unknown';
    if (!regionStats[region]) regionStats[region] = { total: 0, owned: 0 };
    regionStats[region].total += 1;
    if ((e.count || 0) > 0) regionStats[region].owned += 1;
  });

  // group visible by region
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

      var stats = regionStats[region] || { total: 0, owned: 0 };
      var regionUnowned = stats.total - stats.owned;

      var title = effectiveUnowned
        ? (region.toUpperCase() + ' (' + regionUnowned + ' Unowned)')
        : (region.toUpperCase() + ' (' + stats.owned + ' / ' + stats.total + ')');

      return {
        key: region,
        title: title,
        entries: entries.map(function (e) {
          var ownersArr = uniq(Array.isArray(e.owners) ? e.owners : []);
          ownersArr.sort(function (a, b) { return String(a).localeCompare(String(b)); });

          return Object.assign({}, e, {
            ownersUnique: ownersArr
          });
        })
      };
    }),
    countLabelText: countLabelText
  };
}
