// src/features/shinydex/shinydex.js
// Shiny Dex — PAGE CONTROLLER
// Owns ALL state + controls. Renderers are pure.

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

export function setupShinyDexPage({
  weeklyModel,
  shinyShowcaseRows
}) {
  const container = document.getElementById('page-content');
  if (!container) {
    throw new Error('[ShinyDex] page-content not found');
  }

  // -------------------------------------------------------
  // INITIAL MARKUP
  // -------------------------------------------------------

  container.innerHTML = `
    <div class="search-controls" id="dex-controls">
      <input type="text" id="dex-search" placeholder="Search…" />

      <button id="dex-unclaimed" class="dex-tab">
        Unclaimed
      </button>

      <select id="dex-sort"></select>

      <span id="dex-count"></span>
    </div>

    <div class="search-controls">
      <button id="tab-hitlist" class="dex-tab active">
        Shiny Dex Hitlist
      </button>
      <button id="tab-living" class="dex-tab">
        Shiny Living Dex
      </button>
    </div>

    <div id="shiny-dex-container"></div>
  `;

  // -------------------------------------------------------
  // ELEMENTS
  // -------------------------------------------------------

  const searchInput = document.getElementById('dex-search');
  const unclaimedBtn = document.getElementById('dex-unclaimed');
  const sortSelect = document.getElementById('dex-sort');
  const countLabel = document.getElementById('dex-count');

  const tabHitlist = document.getElementById('tab-hitlist');
  const tabLiving = document.getElementById('tab-living');

  // -------------------------------------------------------
  // STATE (single source of truth)
  // -------------------------------------------------------

  const state = {
    view: 'hitlist',          // 'hitlist' | 'living'
    search: '',
    unclaimedOnly: false,     // DEFAULT = claimed shown
    sort: 'standard'
  };

  // -------------------------------------------------------
  // SORT OPTION CONFIGS
  // -------------------------------------------------------

  const HITLIST_SORTS = `
    <option value="standard">Standard</option>
    <option value="claims">Total Claims</option>
    <option value="points">Total Claim Points</option>
  `;

  const LIVINGDEX_SORTS = `
    <option value="standard">Standard</option>
    <option value="total">Total Shinies</option>
  `;

  // -------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------

  function setActive(el, active) {
    el.classList.toggle('active', active);
  }

  function applyButtonState() {
    setActive(unclaimedBtn, state.unclaimedOnly);
    setActive(tabHitlist, state.view === 'hitlist');
    setActive(tabLiving, state.view === 'living');
  }

  function configureSortDropdown() {
    if (state.view === 'hitlist') {
      sortSelect.innerHTML = HITLIST_SORTS;
      state.sort = 'standard';
      unclaimedBtn.style.display = '';
    } else {
      sortSelect.innerHTML = LIVINGDEX_SORTS;
      state.sort = 'standard';
      unclaimedBtn.style.display = '';
    }
    sortSelect.value = state.sort;
  }

  // -------------------------------------------------------
  // RENDER PIPELINE
  // -------------------------------------------------------

  function render() {
    applyButtonState();

    if (state.view === 'hitlist') {
      renderShinyDexHitlist({
        weeklyModel,
        search: state.search,
        unclaimedOnly: state.unclaimedOnly,
        sort: state.sort,
        countLabel
      });
    } else {
      renderShinyLivingDex({
        showcaseRows: shinyShowcaseRows,
        search: state.search,
        unclaimedOnly: state.unclaimedOnly,
        sort: state.sort,
        countLabel
      });
    }
  }

  // -------------------------------------------------------
  // EVENTS
  // -------------------------------------------------------

  searchInput.addEventListener('input', e => {
    state.search = e.target.value.toLowerCase();
    render();
  });

  unclaimedBtn.addEventListener('click', () => {
    state.unclaimedOnly = !state.unclaimedOnly;
    render();
  });

  sortSelect.addEventListener('change', e => {
    state.sort = e.target.value;
    render();
  });

  tabHitlist.addEventListener('click', () => {
    if (state.view === 'hitlist') return;
    state.view = 'hitlist';
    state.unclaimedOnly = false;
    configureSortDropdown();
    render();
  });

  tabLiving.addEventListener('click', () => {
    if (state.view === 'living') return;
    state.view = 'living';
    state.unclaimedOnly = false;
    configureSortDropdown();
    render();
  });

  // -------------------------------------------------------
  // INIT
  // -------------------------------------------------------

  configureSortDropdown();
  render();
}
