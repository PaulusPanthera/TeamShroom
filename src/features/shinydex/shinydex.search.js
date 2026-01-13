// v2.0.0-alpha.1
// src/features/shinydex/shinydex.hitlist.presenter.js
// Hitlist Presenter — view-specific data prep (no DOM)

import { buildShinyDexModel } from '../../domains/shinydex/hitlist.model.js';
import {
  POKEMON_REGION,
  POKEMON_SHOW
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

export function prepareHitlistRenderModel({
  weeklyModel,
  viewState,
  searchCtx
}) {
  var mode = viewState.sort; // 'standard' | 'claims' | 'points'
  var parsed = parseSearch(viewState.search);

  var snapshot = buildShinyDexModel(weeklyModel).filter(function (e) {
    return POKEMON_SHOW[e.pokemon] !== false;
  });

  if (parsed.filters && parsed.filters.region) {
    var rq = parsed.filters.region;
    snapshot = snapshot.filter(function (e) {
      var region = POKEMON_REGION[e.pokemon] || e.region || 'unknown';
      return regionMatches(region, rq);
    });
  }

  var totalSpecies = snapshot.length;
  var claimedSpecies = snapshot.filter(function (e) { return e.claimed; }).length;
  var unclaimedSpecies = totalSpecies - claimedSpecies;

  var regionStats = {};
  snapshot.forEach(function (e) {
    var region = POKEMON_REGION[e.pokemon] || 'unknown';
    if (!regionStats[region]) regionStats[region] = { total: 0, claimed: 0 };
    regionStats[region].total += 1;
    if (e.claimed) regionStats[region].claimed += 1;
  });

  if (mode === 'claims' || mode === 'points') {
    var claimed = snapshot.filter(function (e) { return e.claimed; });

    var byMember = {};
    claimed.forEach(function (e) {
      if (!byMember[e.claimedBy]) byMember[e.claimedBy] = [];
      byMember[e.claimedBy].push(e);
    });

    var fullLeaderboard = Object.entries(byMember)
      .map(function (pair) {
        var name = pair[0];
        var entries = pair[1];
        return {
          name: name,
          entries: entries,
          claims: entries.length,
          points: entries.reduce(function (s, x) { return s + x.points; }, 0)
        };
      })
      .sort(function (a, b) {
        return mode === 'claims'
          ? (b.claims - a.claims)
          : (b.points - a.points);
      });

    var rankByName = {};
    fullLeaderboard.forEach(function (m, idx) {
      rankByName[m.name] = idx + 1;
    });

    var visibleLeaderboard = fullLeaderboard;

    if (parsed.kind === 'member' && parsed.q) {
      visibleLeaderboard = fullLeaderboard.filter(function (m) {
        return memberMatches(m.name, parsed.q);
      });
    }

    return {
      mode: 'scoreboard',
      sections: visibleLeaderboard.map(function (m) {
        return {
          key: m.name,
          title: rankByName[m.name] + '. ' + m.name + ' — ' + m.claims + ' Claims · ' + m.points + ' Points',
          entries: m.entries.map(function (e) {
            return Object.assign({}, e, { highlighted: true, info: e.points + ' pts' });
          })
        };
      }),
      countLabelText: fullLeaderboard.length + ' Members'
    };
  }

  var forceUnclaimed = !!parsed.flags.unclaimed;
  var forceClaimed = !!parsed.flags.claimed;
  var effectiveUnclaimed = forceUnclaimed ? true : (forceClaimed ? false : !!viewState.showUnclaimed);

  var modeSet = snapshot;

  if (effectiveUnclaimed) modeSet = modeSet.filter(function (e) { return !e.claimed; });
  if (forceClaimed) modeSet = modeSet.filter(function (e) { return e.claimed; });

  if (parsed.filters && parsed.filters.tier) {
    var wanted = parsed.filters.tier;
    modeSet = modeSet.filter(function (e) { return tierFromPoints(e.points) === wanted; });
  }

  var visible = modeSet;

  if (parsed.kind === 'member' && parsed.q) {
    visible = visible.filter(function (e) {
      return e.claimed && memberMatches(e.claimedBy || '', parsed.q);
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

  var countLabelText = effectiveUnclaimed
    ? (unclaimedSpecies + ' Unclaimed')
    : (claimedSpecies + ' / ' + totalSpecies + ' Claimed');

  return {
    mode: 'standard',
    sections: Object.entries(byRegion).map(function (pair) {
      var region = pair[0];
      var entries = pair[1];

      var stats = regionStats[region] || { claimed: 0, total: 0 };
      var regionUnclaimed = stats.total - stats.claimed;

      var title = effectiveUnclaimed
        ? (region.toUpperCase() + ' (' + regionUnclaimed + ' Unclaimed)')
        : (region.toUpperCase() + ' (' + stats.claimed + ' / ' + stats.total + ')');

      return {
        key: region,
        title: title,
        entries: entries.map(function (e) {
          return Object.assign({}, e, { highlighted: e.claimed && e.points >= 15 });
        })
      };
    }),
    countLabelText: countLabelText
  };
}
