// src/features/shinydex/shinydex.hitlist.presenter.js
// v2.0.0-beta
// Hitlist Presenter — view-specific data prep (no DOM)

import { buildShinyDexModel } from '../../domains/shinydex/hitlist.model.js';
import {
  pokemonFamilies,
  POKEMON_DEX_ORDER,
  POKEMON_POINTS,
  POKEMON_REGION,
  POKEMON_SHOW
} from '../../data/pokemondatabuilder.js';

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

function normalizePokemonKey(raw) {
  return String(raw || '').trim().toLowerCase();
}

function eventHasSafariFlag(shiny) {
  if (!shiny) return false;
  if (shiny.safari === true) return true;
  var method = shiny.method;
  if (typeof method === 'string' && method.toLowerCase().indexOf('safari') >= 0) return true;
  return false;
}

function buildVariantOwnersByPokemon(weeklyModel) {
  var weeks = Array.isArray(weeklyModel) ? weeklyModel : [];

  // flatten to events (order preserved)
  var events = [];
  weeks.forEach(function (week) {
    var members = week && week.members ? Object.values(week.members) : [];
    members.forEach(function (member) {
      var shinies = member && Array.isArray(member.shinies) ? member.shinies : [];
      shinies.forEach(function (shiny) {
        if (!shiny || shiny.lost) return;
        events.push({
          member: shiny.member,
          pokemon: normalizePokemonKey(shiny.pokemon),
          secret: !!shiny.secret,
          alpha: !!shiny.alpha,
          safari: eventHasSafariFlag(shiny)
        });
      });
    });
  });

  // build rootByPokemon and speciesByRoot in dex order (mirror hitlist.model)
  var order = Array.isArray(POKEMON_DEX_ORDER) && POKEMON_DEX_ORDER.length
    ? POKEMON_DEX_ORDER
    : Object.keys(POKEMON_POINTS || {});

  var rootByPokemon = {};
  order.forEach(function (p) {
    var roots = (pokemonFamilies && pokemonFamilies[p]) ? pokemonFamilies[p] : [];
    rootByPokemon[p] = roots.length ? roots[0] : p;
  });

  var speciesByRoot = {};
  order.forEach(function (p) {
    var root = rootByPokemon[p] || p;
    if (!speciesByRoot[root]) speciesByRoot[root] = [];
    speciesByRoot[root].push(p);
  });

  var claimedSlotsByRoot = {};
  var variantOwnersByPokemon = {};

  function ensureEntry(pokemon) {
    if (!variantOwnersByPokemon[pokemon]) {
      variantOwnersByPokemon[pokemon] = { standard: null, secret: null, alpha: null, safari: null };
    }
    return variantOwnersByPokemon[pokemon];
  }

  events.forEach(function (event) {
    var mon = event.pokemon;
    if (!mon) return;

    var root = rootByPokemon[mon] || mon;
    var stages = speciesByRoot[root] || [mon];

    if (!claimedSlotsByRoot[root]) claimedSlotsByRoot[root] = {};

    var nextStage = null;
    for (var i = 0; i < stages.length; i++) {
      var stage = stages[i];
      if (!claimedSlotsByRoot[root][stage]) {
        nextStage = stage;
        break;
      }
    }
    if (!nextStage) return;

    claimedSlotsByRoot[root][nextStage] = event.member;

    var slot = ensureEntry(nextStage);
    if (!slot.standard) slot.standard = event.member;

    // Multiple flags claim all relevant variants in the same event.
    if (event.secret && !slot.secret) slot.secret = event.member;
    if (event.alpha && !slot.alpha) slot.alpha = event.member;
    if (event.safari && !slot.safari) slot.safari = event.member;
  });

  return variantOwnersByPokemon;
}

export function prepareHitlistRenderModel(opts) {
  var weeklyModel = opts && opts.weeklyModel;
  var viewState = opts && opts.viewState;
  var searchCtx = opts && opts.searchCtx;

  var mode = viewState && viewState.sort ? viewState.sort : 'standard'; // 'standard' | 'claims' | 'points'
  var parsed = parseSearch(viewState && viewState.search ? viewState.search : '');

  var snapshot = buildShinyDexModel(weeklyModel).filter(function (e) {
    return POKEMON_SHOW[e.pokemon] !== false;
  });

  var variantOwnersByPokemon = buildVariantOwnersByPokemon(weeklyModel);

  snapshot = snapshot.map(function (e) {
    var vo = variantOwnersByPokemon[e.pokemon] || {};
    return Object.assign({}, e, {
      variantOwners: {
        standard: e.claimedBy || null,
        secret: vo.secret || null,
        alpha: vo.alpha || null,
        safari: vo.safari || null
      }
    });
  });

  // region filter
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

  // --------------------------------------------------
  // SCOREBOARD MODES (claims/points)
  // --------------------------------------------------
  if (mode === 'claims' || mode === 'points') {
    var claimed = snapshot.filter(function (e) { return e.claimed; });

    var byMember = {};
    claimed.forEach(function (e) {
      var n = e.claimedBy || '';
      if (!byMember[n]) byMember[n] = [];
      byMember[n].push(e);
    });

    var fullLeaderboard = Object.entries(byMember)
      .map(function (pair) {
        var name = pair[0];
        var entries = pair[1];
        return {
          name: name,
          entries: entries,
          claims: entries.length,
          points: entries.reduce(function (s, x) { return s + (x.points || 0); }, 0)
        };
      })
      .sort(function (a, b) {
        return mode === 'claims' ? (b.claims - a.claims) : (b.points - a.points);
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
          title: rankByName[m.name] + '. ' + m.name + ' — ' + m.claims + ' Claims · ' + m.points + ' Points',
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
