// src/features/shinydex/shinydex.livingdex.presenter.js
// v2.0.0-beta
// Living Dex Presenter — view-specific data prep (no DOM)

import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';
import { POKEMON_REGION, POKEMON_SHOW, POKEMON_DEX_ORDER } from '../../data/pokemondatabuilder.js';

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

function normalizePokemonKey(raw) {
  return String(raw || '').trim().toLowerCase();
}

function isSafariMethod(method) {
  if (!method) return false;
  return String(method).toLowerCase().indexOf('safari') >= 0;
}

/**
 * Enforces LivingDex rules:
 * - owners must always be species-wide owners (tooltip source-of-truth)
 * - variantCounts must reflect showcase presence so icons gray out correctly
 */
function buildShowcaseVariantAgg(showcaseRows) {
  var rows = Array.isArray(showcaseRows) ? showcaseRows : [];
  var map = new Map();

  function ensure(p) {
    if (!map.has(p)) {
      map.set(p, {
        ownersSet: new Set(),
        variantCounts: { secret: 0, alpha: 0, safari: 0 }
      });
    }
    return map.get(p);
  }

  rows.forEach(function (r) {
    if (!r || r.lost || r.sold) return;

    var p = normalizePokemonKey(r.pokemon);
    if (!p) return;

    var a = ensure(p);

    var owner = r.ot ? String(r.ot) : '';
    if (owner) a.ownersSet.add(owner);

    if (r.secret) a.variantCounts.secret += 1;
    if (r.alpha) a.variantCounts.alpha += 1;
    if (r.safari === true || isSafariMethod(r.method)) a.variantCounts.safari += 1;
  });

  return map;
}

export function prepareLivingDexRenderModel({
  showcaseRows,
  viewState,
  searchCtx
}) {
  var mode = viewState.sort; // 'standard' | 'total'
  var parsed = parseSearch(viewState.search);

  var snapshot = buildShinyLivingDexModel(showcaseRows || []).filter(function (e) {
    return POKEMON_SHOW[e.pokemon] !== false;
  });

  // Override owners + variantCounts from showcase aggregation (species-wide, correct presence).
  var agg = buildShowcaseVariantAgg(showcaseRows || []);
  snapshot = snapshot.map(function (e) {
    var p = normalizePokemonKey(e.pokemon);
    var a = agg.get(p);

    var ownersAll = a ? Array.from(a.ownersSet) : [];
    var vc = a ? a.variantCounts : { secret: 0, alpha: 0, safari: 0 };

    return Object.assign({}, e, {
      owners: ownersAll,
      variantCounts: {
        secret: Number(vc.secret) || 0,
        alpha: Number(vc.alpha) || 0,
        safari: Number(vc.safari) || 0
      }
    });
  });

  if (parsed.filters && parsed.filters.region) {
    var rq = parsed.filters.region;
    snapshot = snapshot.filter(function (e) {
      var region = POKEMON_REGION[e.pokemon] || e.region || 'unknown';
      return regionMatches(region, rq);
    });
  }

  var totalSpecies = snapshot.length;
  var ownedSpecies = snapshot.filter(function (e) { return (Number(e.count) || 0) > 0; }).length;
  var unownedSpecies = totalSpecies - ownedSpecies;

  var regionStats = {};
  snapshot.forEach(function (e) {
    var region = POKEMON_REGION[e.pokemon] || 'unknown';
    if (!regionStats[region]) regionStats[region] = { total: 0, owned: 0 };
    regionStats[region].total += 1;
    if ((Number(e.count) || 0) > 0) regionStats[region].owned += 1;
  });

  var forceUnowned = !!parsed.flags.unowned;
  var forceOwned = !!parsed.flags.owned;
  var effectiveUnowned = forceUnowned ? true : (forceOwned ? false : !!viewState.showUnclaimed);

  var modeSet = snapshot;

  if (mode === 'total') {
    // stable: count desc, dex order tiebreak if available
    var dexIndex = {};
    if (Array.isArray(POKEMON_DEX_ORDER) && POKEMON_DEX_ORDER.length) {
      POKEMON_DEX_ORDER.forEach(function (k, i) { dexIndex[k] = i; });
    }

    modeSet = modeSet.slice().sort(function (a, b) {
      var ac = Number(a.count) || 0;
      var bc = Number(b.count) || 0;
      if (bc !== ac) return bc - ac;

      var ai = (dexIndex[a.pokemon] != null) ? dexIndex[a.pokemon] : 999999;
      var bi = (dexIndex[b.pokemon] != null) ? dexIndex[b.pokemon] : 999999;
      return ai - bi;
    });
  }

  if (effectiveUnowned) modeSet = modeSet.filter(function (e) { return (Number(e.count) || 0) === 0; });
  if (forceOwned) modeSet = modeSet.filter(function (e) { return (Number(e.count) || 0) > 0; });

  var visible = modeSet;

  if (parsed.kind === 'member' && parsed.q) {
    visible = visible.filter(function (e) {
      var owners = Array.isArray(e.owners) ? e.owners : [];
      for (var i = 0; i < owners.length; i++) {
        if (memberMatches(owners[i], parsed.q)) return true;
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

      return {
        key: region,
        title: title,
        entries: entries
      };
    }),
    countLabelText: countLabelText
  };
}
