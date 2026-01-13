// v2.0.0-alpha.1
// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller (Hitlist + Living Dex)
// Owns ALL DOM under #page-content for this page only.

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';
import { bindDexOwnerTooltip } from './shinydex.tooltip.js';
import { bindShinyDexHelp } from './shinydex.help.js';
import { buildSearchContext } from './shinydex.search.js';

export function setupShinyDexPage({ weeklyModel, shinyShowcaseRows }) {
  var root = document.getElementById('page-content');
  root.innerHTML = '';

  // --------------------------------------------------
  // UI SKELETON (scoped wrapper for CSS)
  // --------------------------------------------------

  root.innerHTML = `
    <div class="shinydex-page">
      <div class="search-controls">
        <input id="dex-search" type="text" placeholder="Search" />

        <button id="dex-help" class="help-btn" type="button" aria-label="Search Help">
          <img class="help-icon" src="img/symbols/questionmarksprite.png" alt="?">
        </button>

        <button id="dex-unclaimed" class="dex-tab" type="button">
          Unclaimed
        </button>

        <select id="dex-sort"></select>

        <span id="dex-count"></span>
      </div>

      <div class="search-controls">
        <button id="tab-hitlist" class="dex-tab active" type="button">
          Shiny Dex Hitlist
        </button>
        <button id="tab-living" class="dex-tab" type="button">
          Shiny Living Dex
        </button>
      </div>

      <div id="shiny-dex-container"></div>
    </div>
  `;

  // --------------------------------------------------
  // ELEMENTS
  // --------------------------------------------------

  var searchInput = root.querySelector('#dex-search');
  var helpBtn = root.querySelector('#dex-help');
  var unclaimedBtn = root.querySelector('#dex-unclaimed');
  var sortSelect = root.querySelector('#dex-sort');
  var countLabel = root.querySelector('#dex-count');

  var tabHitlist = root.querySelector('#tab-hitlist');
  var tabLiving = root.querySelector('#tab-living');

  // --------------------------------------------------
  // STATE (single source of truth)
  // --------------------------------------------------

  var state = {
    view: 'hitlist',        // 'hitlist' | 'living'
    search: '',
    unclaimed: false,

    // keep independent dropdown state per tab
    hitlistSort: 'standard',  // 'standard' | 'claims' | 'points'
    livingSort: 'standard'    // 'standard' | 'total'
  };

  var searchCtx = buildSearchContext();

  // --------------------------------------------------
  // SORT OPTIONS (per view)
  // --------------------------------------------------

  function configureSort() {
    sortSelect.innerHTML = '';

    if (state.view === 'hitlist') {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="claims">Total Claims</option>
        <option value="points">Total Claim Points</option>
      `;
      sortSelect.value = state.hitlistSort;
    } else {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="total">Total Shinies</option>
      `;
      sortSelect.value = state.livingSort;
    }

    updateControlStates();
  }

  function updateControlStates() {
    var hitlistMode = state.view === 'hitlist' ? state.hitlistSort : null;
    var leaderboard = state.view === 'hitlist' && (hitlistMode === 'claims' || hitlistMode === 'points');

    // SEARCH: never blocked (member-search is valid in leaderboards)
    searchInput.disabled = false;

    // Unclaimed: disabled only in hitlist leaderboards (3rd state)
    unclaimedBtn.disabled = !!leaderboard;
    unclaimedBtn.classList.toggle('is-disabled', !!leaderboard);

    // Help: always available
    helpBtn.disabled = false;

    unclaimedBtn.classList.toggle('active', !!state.unclaimed);
  }

  // --------------------------------------------------
  // RENDER PIPELINE
  // --------------------------------------------------

  function render() {
    updateControlStates();

    var viewState = {
      search: state.search,
      showUnclaimed: !!state.unclaimed,
      sort: state.view === 'hitlist' ? state.hitlistSort : state.livingSort
    };

    if (state.view === 'hitlist') {
      renderShinyDexHitlist({
        weeklyModel: weeklyModel,
        viewState: viewState,
        searchCtx: searchCtx,
        countLabel: countLabel
      });
    } else {
      renderShinyLivingDex({
        showcaseRows: shinyShowcaseRows,
        viewState: viewState,
        searchCtx: searchCtx,
        countLabel: countLabel
      });
    }
  }

  // --------------------------------------------------
  // EVENTS
  // --------------------------------------------------

  searchInput.addEventListener('input', function (e) {
    state.search = String(e.target.value || '').toLowerCase();
    render();
  });

  unclaimedBtn.addEventListener('click', function () {
    if (unclaimedBtn.disabled) return;
    state.unclaimed = !state.unclaimed;
    render();
  });

  sortSelect.addEventListener('change', function (e) {
    var v = e.target.value;

    if (state.view === 'hitlist') state.hitlistSort = v;
    else state.livingSort = v;

    // if hitlist leaderboards, force unclaimed off
    if (state.view === 'hitlist' && (state.hitlistSort === 'claims' || state.hitlistSort === 'points')) {
      state.unclaimed = false;
    }

    configureSort();
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

  // --------------------------------------------------
  // BIND HELP + TOOLTIP (once, delegated)
  // --------------------------------------------------

  bindDexOwnerTooltip();
  bindShinyDexHelp({
    buttonEl: helpBtn,
    inputEl: searchInput
  });

  // --------------------------------------------------
  // INIT
  // --------------------------------------------------

  configureSort();
  render();
}
