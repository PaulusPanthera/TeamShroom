// src/features/shinydex/shinydex.hitlist.presenter.js
// v2.0.0-beta
// Hitlist Presenter — view-specific data prep (no DOM)

import {
  buildShinyDexModel,
  buildShinyDexClaimLedger
} from '../../domains/shinydex/hitlist.model.js';
import {
  getPokemonRegionMap,
  getPokemonShowMap
} from '../../domains/pokemon/pokemon.data.js';

import {
  parseSearch,
  resolveFamilyRootsByQuery,
  speciesMatches,
  memberMatches
} from './shinydex.search.js';

import { tierFromPoints } from '../../ui/tier-map.js';

function normalizeRegion(raw) {
  return String(raw || '').trim().toLowerCase();
}

function regionMatches(regionValue, query) {
  var r = normalizeRegion(regionValue);
  var q = normalizeRegion(query);
  if (!q) return true;
  return r.indexOf(q) === 0;
}

function buildScoreboardCardEntries(claims, dexIndexByPokemon) {
  var kindOrder = { standard: 0, secret: 1, alpha: 2, safari: 3 };

  return (Array.isArray(claims) ? claims : [])
    .map(function (claim) {
      return Object.assign({}, claim, {
        claimed: true,
        claimedBy: claim.member || null,
        claimKind: claim.kind || 'standard',
        claimPoints: Number(claim.points) || 0,
        claimValue: Number(claim.claimValue) || 0,
        points: Number(claim.tierPoints) || 0
      });
    })
    .sort(function (a, b) {
      var ai = Object.prototype.hasOwnProperty.call(dexIndexByPokemon, a.pokemon)
        ? dexIndexByPokemon[a.pokemon]
        : Number.MAX_SAFE_INTEGER;
      var bi = Object.prototype.hasOwnProperty.call(dexIndexByPokemon, b.pokemon)
        ? dexIndexByPokemon[b.pokemon]
        : Number.MAX_SAFE_INTEGER;

      if (ai !== bi) return ai - bi;

      var ak = kindOrder[a.claimKind] ?? 9;
      var bk = kindOrder[b.claimKind] ?? 9;
      if (ak !== bk) return ak - bk;

      return (Number(a.sequence) || 0) - (Number(b.sequence) || 0);
    });
}

function formatScoreboardTitle(rank, member) {
  var totalClaims = Number(member.totalClaimValue) || 0;
  var awardCount = Number(member.awardCount) || 0;
  var points = Number(member.points) || 0;
  var bonusPoints = Number(member.bonusPoints) || 0;

  var awardText = awardCount !== totalClaims
    ? (' (' + awardCount + ' awards)')
    : '';

  return rank + '. ' + member.name + ' — ' + totalClaims + ' Total Claims' + awardText +
    ' · ' + points + ' Points' +
    (bonusPoints ? (' (+' + bonusPoints + ' bonus)') : '');
}


export function prepareHitlistRenderModel(opts) {
  var weeklyModel = opts && opts.weeklyModel;
  var viewState = opts && opts.viewState;
  var searchCtx = opts && opts.searchCtx;

  var mode = viewState && viewState.sort ? viewState.sort : 'standard'; // 'standard' | 'claims' | 'points'
  var parsed = parseSearch(viewState && viewState.search ? viewState.search : '');

  var showMap = getPokemonShowMap();
  var regionMap = getPokemonRegionMap();

  var snapshot = buildShinyDexModel(weeklyModel).filter(function (e) {
    return showMap[e.pokemon] !== false;
  });

  var claimLedger = buildShinyDexClaimLedger(weeklyModel);
  var specialOwnersByPokemon = claimLedger.specialOwnersByPokemon || {};

  snapshot = snapshot.map(function (e) {
    var s = specialOwnersByPokemon[e.pokemon] || {};
    return Object.assign({}, e, {
      variantOwners: {
        standard: e.claimedBy || null,
        secret: s.secret || null,
        alpha: s.alpha || null,
        safari: s.safari || null
      }
    });
  });

  // region filter
  if (parsed.filters && parsed.filters.region) {
    var rq = parsed.filters.region;
    snapshot = snapshot.filter(function (e) {
      var region = regionMap[e.pokemon] || e.region || 'unknown';
      return regionMatches(region, rq);
    });
  }

  var totalSpecies = snapshot.length;
  var claimedSpecies = snapshot.filter(function (e) { return e.claimed; }).length;
  var unclaimedSpecies = totalSpecies - claimedSpecies;

  var regionStats = {};
  snapshot.forEach(function (e) {
    var region = regionMap[e.pokemon] || 'unknown';
    if (!regionStats[region]) regionStats[region] = { total: 0, claimed: 0 };
    regionStats[region].total += 1;
    if (e.claimed) regionStats[region].claimed += 1;
  });

  // --------------------------------------------------
  // SCOREBOARD MODES (claims/points)
  // --------------------------------------------------
  if (mode === 'claims' || mode === 'points') {
    var visiblePokemonSet = new Set(snapshot.map(function (e) { return e.pokemon; }));
    var dexIndexByPokemon = {};
    snapshot.forEach(function (e, idx) { dexIndexByPokemon[e.pokemon] = idx; });

    // Player cards are built from the claim ledger, not from global species cards.
    // That keeps every award independent: a Secret owned by player B can never appear
    // as a switchable state on player A's Standard claim card.
    var claimsByMember = {};

    function ensureMember(name) {
      var memberName = String(name || '').trim();
      if (!memberName) return null;
      if (!claimsByMember[memberName]) {
        claimsByMember[memberName] = {
          name: memberName,
          standardClaims: [],
          bonusClaims: [],
          allClaims: []
        };
      }
      return claimsByMember[memberName];
    }

    (claimLedger.standardClaims || []).forEach(function (claim) {
      if (!claim || !visiblePokemonSet.has(claim.pokemon)) return;
      var member = ensureMember(claim.member);
      if (!member) return;
      member.standardClaims.push(claim);
      member.allClaims.push(claim);
    });

    (claimLedger.bonusClaims || []).forEach(function (claim) {
      if (!claim || !visiblePokemonSet.has(claim.pokemon)) return;
      var member = ensureMember(claim.member);
      if (!member) return;
      member.bonusClaims.push(claim);
      member.allClaims.push(claim);
    });

    var fullLeaderboard = Object.values(claimsByMember)
      .map(function (m) {
        var basePoints = m.standardClaims.reduce(function (sum, claim) {
          return sum + (Number(claim.points) || 0);
        }, 0);
        var bonusPoints = m.bonusClaims.reduce(function (sum, claim) {
          return sum + (Number(claim.points) || 0);
        }, 0);

        var chronologicalClaims = m.allClaims.slice().sort(function (a, b) {
          var ds = (Number(a.sequence) || 0) - (Number(b.sequence) || 0);
          if (ds !== 0) return ds;
          var kindOrder = { standard: 0, secret: 1, alpha: 2, safari: 3 };
          return (kindOrder[a.kind] ?? 9) - (kindOrder[b.kind] ?? 9);
        });

        var baseClaimValue = m.standardClaims.reduce(function (sum, claim) {
          return sum + (Number(claim.claimValue) || 1);
        }, 0);
        var bonusClaimValue = m.bonusClaims.reduce(function (sum, claim) {
          return sum + (Number(claim.claimValue) || 0);
        }, 0);
        var totalClaimValue = baseClaimValue + bonusClaimValue;

        return {
          name: m.name,
          standardClaims: m.standardClaims,
          bonusClaims: m.bonusClaims,
          allClaims: chronologicalClaims,
          baseClaimCount: m.standardClaims.length,
          bonusClaimCount: m.bonusClaims.length,
          baseClaimValue: baseClaimValue,
          bonusClaimValue: bonusClaimValue,
          totalClaimValue: totalClaimValue,
          awardCount: chronologicalClaims.length,
          claims: totalClaimValue,
          basePoints: basePoints,
          bonusPoints: bonusPoints,
          points: basePoints + bonusPoints
        };
      })
      .sort(function (a, b) {
        if (mode === 'claims') {
          // Total Claims is intentionally weighted:
          // Base +1, Safari +1, Secret +2, Alpha +3.
          var dc = b.totalClaimValue - a.totalClaimValue;
          if (dc !== 0) return dc;

          var dp = b.points - a.points;
          if (dp !== 0) return dp;
          return String(a.name).localeCompare(String(b.name));
        }

        var d = b.points - a.points;
        if (d !== 0) return d;
        return String(a.name).localeCompare(String(b.name));
      });

    var rankByName = {};
    fullLeaderboard.forEach(function (m, idx) {
      rankByName[m.name] = idx + 1;
    });

    var visibleLeaderboard = fullLeaderboard;

    if (parsed.q) {
      var q = parsed.q;
      visibleLeaderboard = fullLeaderboard.filter(function (m) {
        return memberMatches(m.name, q);
      });
    }

    return {
      mode: 'scoreboard',
      sections: visibleLeaderboard.map(function (m) {
        return {
          key: m.name,
          title: formatScoreboardTitle(rankByName[m.name], m),
          entries: buildScoreboardCardEntries(m.allClaims, dexIndexByPokemon),
          claimLog: m.allClaims.map(function (claim) { return Object.assign({}, claim); }),
          baseClaimCount: m.baseClaimCount,
          bonusClaimCount: m.bonusClaimCount,
          baseClaimValue: m.baseClaimValue,
          bonusClaimValue: m.bonusClaimValue,
          totalClaimValue: m.totalClaimValue,
          awardCount: m.awardCount,
          basePoints: m.basePoints,
          bonusPoints: m.bonusPoints,
          points: m.points
        };
      }),
      countLabelText: fullLeaderboard.length + ' Members'
    };
  }

  // --------------------------------------------------
  // STANDARD MODE
  // --------------------------------------------------

  var forceUnclaimed = !!(parsed.flags && parsed.flags.unclaimed);
  var forceClaimed = !!(parsed.flags && parsed.flags.claimed);
  var effectiveUnclaimed = forceUnclaimed ? true : (forceClaimed ? false : !!(viewState && viewState.showUnclaimed));

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
    var region = regionMap[e.pokemon] || 'unknown';
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

      var stats = regionStats[region] || { claimed: 0, total: 0 };
      var regionUnclaimed = stats.total - stats.claimed;

      var title = effectiveUnclaimed
        ? (region.toUpperCase() + ' (' + regionUnclaimed + ' Unclaimed)')
        : (region.toUpperCase() + ' (' + stats.claimed + ' / ' + stats.total + ')');

      return {
        key: region,
        title: title,
        entries: pair[1].map(function (e) {
          return Object.assign({}, e);
        })
      };
    }),
    countLabelText: countLabelText
  };
}
