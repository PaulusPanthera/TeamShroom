// src/features/shinydex/shinydex.hitlist.presenter.js
// v2.0.0-beta
// Hitlist Presenter — view-specific data prep (no DOM)

import { buildShinyDexModel } from '../../domains/shinydex/hitlist.model.js';
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
import { SHINYWARS } from '../../domains/pokemon/shiny.points.js';

function normalizeRegion(raw) {
  return String(raw || '').trim().toLowerCase();
}

function regionMatches(regionValue, query) {
  var r = normalizeRegion(regionValue);
  var q = normalizeRegion(query);
  if (!q) return true;
  return r.indexOf(q) === 0;
}

function normalizePokemonKey(raw) {
  return String(raw || '').trim().toLowerCase();
}

function eventHasSafariFlag(shiny) {
  return Boolean(shiny && shiny.safari === true);
}


/**
 * Special-variant owners are FIRST occurrence of species+flag in weekly.
 * They are NOT tied to the family progressive slot claim.
 * Multiple flags in one event claim all relevant variants at once.
 */
function buildSpecialVariantOwnersByPokemon(weeklyModel) {
  var weeks = Array.isArray(weeklyModel) ? weeklyModel : [];
  var out = {};

  function ensure(pokemonKey) {
    if (!out[pokemonKey]) out[pokemonKey] = { secret: null, alpha: null, safari: null };
    return out[pokemonKey];
  }

  weeks.forEach(function (week) {
    var members = week && week.members ? Object.values(week.members) : [];
    members.forEach(function (memberGroup) {
      var shinies = memberGroup && Array.isArray(memberGroup.shinies) ? memberGroup.shinies : [];
      shinies.forEach(function (shiny) {
        if (!shiny || shiny.lost || shiny.run) return;

        var pokemon = normalizePokemonKey(shiny.pokemon);
        if (!pokemon) return;

        var member = shiny.member ? String(shiny.member) : '';
        if (!member) return;

        var slot = ensure(pokemon);

        if (shiny.secret && !slot.secret) slot.secret = member;
        if (shiny.alpha && !slot.alpha) slot.alpha = member;
        if (eventHasSafariFlag(shiny) && !slot.safari) slot.safari = member;
      });
    });
  });

  return out;
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

  var specialOwnersByPokemon = buildSpecialVariantOwnersByPokemon(weeklyModel);

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
    var claimed = snapshot.filter(function (e) { return e.claimed; });

    // Base points (standard progressive claim slots)
    var byMember = {};
    claimed.forEach(function (e) {
      var n = e.claimedBy || '';
      if (!n) return;
      if (!byMember[n]) byMember[n] = [];
      byMember[n].push(e);
    });

    // Bonus points (special variants are independent from family progressive slot claims)
    var bonusByMember = {};

    function addBonus(memberName, delta) {
      var name = memberName ? String(memberName) : '';
      if (!name) return;
      var n = Number(delta) || 0;
      if (!Number.isFinite(n) || n === 0) return;
      bonusByMember[name] = (bonusByMember[name] || 0) + n;
    }

    snapshot.forEach(function (e) {
      var owners = e && e.variantOwners ? e.variantOwners : null;
      if (!owners) return;

      var tierPts = Number(e && e.points) || 0;

      if (owners.secret) addBonus(owners.secret, SHINYWARS.BONUS.SECRET);
      if (owners.safari) addBonus(owners.safari, SHINYWARS.BONUS.SAFARI);

      // Hitlist base already grants tier points once; variants grant only the delta above tier.
      if (owners.alpha) addBonus(owners.alpha, Math.max(0, SHINYWARS.BASE.ALPHA - tierPts));
    });

    var memberNameSet = new Set(Object.keys(byMember).concat(Object.keys(bonusByMember)));

    var fullLeaderboard = Array.from(memberNameSet)
      .map(function (name) {
        var entries = byMember[name] || [];
        var basePoints = entries.reduce(function (s, x) { return s + (x.points || 0); }, 0);
        var bonusPoints = bonusByMember[name] || 0;
        return {
          name: name,
          entries: entries,
          claims: entries.length,
          basePoints: basePoints,
          bonusPoints: bonusPoints,
          points: basePoints + bonusPoints
        };
      })
      .sort(function (a, b) {
        if (mode === 'claims') {
          var dc = b.claims - a.claims;
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
          title: rankByName[m.name] + '. ' + m.name + ' — ' + m.claims + ' Claims · ' + m.points + ' Points' + (m.bonusPoints ? (' (+' + m.bonusPoints + ' bonus)') : ''),
          entries: m.entries.map(function (e) {
            return Object.assign({}, e);
          })
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
