// v2.0.0-alpha.1
// src/features/shinydex/shinydex.js
// Shiny Pokédex Page Controller
// Owns ALL DOM under #page-content

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';
import { attachDexHelp } from './shinydex.help.js';

import {
  pokemonFamilies,
  POKEMON_POINTS
} from '../../data/pokemondatabuilder.js';

function buildSearchCtx() {
  var dexKeys = Object.keys(POKEMON_POINTS || {});
  var dexIndexByPokemon = {};
  dexKeys.forEach(function (k, i) { dexIndexByPokemon[k] = i; });

  var rootByPokemon = {};
  var familyMembersByRoot = {};

  var fam = pokemonFamilies || {};
  var entries = Object.entries(fam);

  // heuristic: detect "root -> stages[]" mapping
  var looksLikeStageMap = entries.some(function (pair) {
    var k = pair[0];
    var arr = pair[1];
    if (!Array.isArray(arr) || arr.length < 2) return false;
    // if members are real dex keys, treat as stages map
    for (var i = 0; i < arr.length; i++) {
      if (dexIndexByPokemon[arr[i]] != null) return true;
    }
    return false;
  });

  if (looksLikeStageMap) {
    entries.forEach(function (pair) {
      var root = pair[0];
      var stages = Array.isArray(pair[1]) ? pair[1] : [];
      familyMembersByRoot[root] = stages.slice(0);
      stages.forEach(function (p) {
        rootByPokemon[p] = root;
      });
      // also map root itself
      rootByPokemon[root] = root;
    });
  } else {
    // assume "pokemon -> [root]" mapping
    entries.forEach(function (pair) {
      var pokemon = pair[0];
      var roots = Array.isArray(pair[1]) ? pair[1] : [];
      var root = roots[0] || pokemon;

      rootByPokemon[pokemon] = root;

      familyMembersByRoot[root] = familyMembersByRoot[root] || [];
      familyMembersByRoot[root].push(pokemon);
    });
  }

  return {
    dexIndexByPokemon: dexIndexByPokemon,
    rootByPokemon: rootByPokemon,
    familyMembersByRoot: familyMembersByRoot
  };
}

export function setupShinyDexPage(opts) {
  var weeklyModel = opts && opts.weeklyModel;
  var shinyShowcaseRows = opts && opts.shinyShowcaseRows;

  var root = document.getElementById('page-content');
  if (!root) return;

  root.innerHTML = '';

  root.innerHTML =
    '<div class="search-controls" id="dex-controls">' +
      '<input id="dex-search" type="text" placeholder="Search" />' +

      '<button id="dex-help" class="dex-tab" title="Help" style="padding:6px 10px;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<img src="img/symbols/questionmarksprite.png" alt="Help" style="width:18px;height:18px;image-rendering:pixelated;" />' +
      '</button>' +

      '<button id="dex-unclaimed" class="dex-tab">Unclaimed</button>' +
      '<select id="dex-sort"></select>' +
      '<span id="dex-count"></span>' +
    '</div>' +

    '<div class="search-controls">' +
      '<button id="tab-hitlist" class="dex-tab active">Shiny Dex Hitlist</button>' +
      '<button id="tab-living" class="dex-tab">Shiny Living Dex</button>' +
    '</div>' +

    '<div id="shiny-dex-container"></div>';

  var searchInput = root.querySelector('#dex-search');
  var helpBtn = root.querySelector('#dex-help');
  var unclaimedBtn = root.querySelector('#dex-unclaimed');
  var sortSelect = root.querySelector('#dex-sort');
  var countLabel = root.querySelector('#dex-count');

  var tabHitlist = root.querySelector('#tab-hitlist');
  var tabLiving = root.querySelector('#tab-living');

  var controlsRoot = root.querySelector('#dex-controls');
  attachDexHelp(helpBtn, controlsRoot);

  var searchCtx = buildSearchCtx();

  var state = {
    view: 'hitlist',  // 'hitlist' | 'living'
    search: '',
    showUnclaimed: false,
    sort: 'standard'
  };

  function configureSort() {
    sortSelect.innerHTML = '';

    if (state.view === 'hitlist') {
      sortSelect.innerHTML =
        '<option value="standard">Standard</option>' +
        '<option value="claims">Total Claims</option>' +
        '<option value="points">Total Claim Points</option>';
      state.sort = 'standard';
      state.showUnclaimed = false;
    } else {
      sortSelect.innerHTML =
        '<option value="standard">Standard</option>' +
        '<option value="total">Total Shinies</option>';
      state.sort = 'standard';
      state.showUnclaimed = false;
    }

    unclaimedBtn.classList.toggle('active', state.showUnclaimed);
  }

  function render() {
    unclaimedBtn.classList.toggle('active', state.showUnclaimed);

    // disable unclaimed + search in hitlist leaderboards (UI only)
    var leaderboard = (state.view === 'hitlist' && (state.sort === 'claims' || state.sort === 'points'));
    unclaimedBtn.disabled = !!leaderboard;
    searchInput.disabled = false; // keep enabled (member search works via @name)
    if (leaderboard) {
      // still allow @name filtering; keep input enabled
    }

    var viewState = {
      sort: state.sort,
      search: state.search,
      showUnclaimed: state.showUnclaimed
    };

    if (state.view === 'hitlist') {
      renderShinyDexHitlist({
        weeklyModel: weeklyModel || [],
        viewState: viewState,
        searchCtx: searchCtx,
        countLabel: countLabel
      });
    } else {
      renderShinyLivingDex({
        showcaseRows: shinyShowcaseRows || [],
        viewState: viewState,
        searchCtx: searchCtx,
        countLabel: countLabel
      });
    }
  }

  searchInput.addEventListener('input', function (e) {
    state.search = String(e.target.value || '');
    render();
  });

  unclaimedBtn.addEventListener('click', function () {
    if (unclaimedBtn.disabled) return;
    state.showUnclaimed = !state.showUnclaimed;
    render();
  });

  sortSelect.addEventListener('change', function (e) {
    state.sort = e.target.value;
    render();
  });

  tabHitlist.addEventListener('click', function () {
    if (state.view === 'hitlist') return;
    state.view = 'hitlist';
    tabHitlist.classList.add('active');
    tabLiving.classList.remove('active');
    configureSort();
    render();
  });

  tabLiving.addEventListener('click', function () {
    if (state.view === 'living') return;
    state.view = 'living';
    tabLiving.classList.add('active');
    tabHitlist.classList.remove('active');
    configureSort();
    render();
  });

  configureSort();
  render();
}
