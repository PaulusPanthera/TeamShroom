// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller
// SINGLE OWNER of DOM + STATE below #page-content

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

export function setupShinyDexPage({
  weeklyModel,
  shinyShowcaseRows
}) {
  const root = document.getElementById('page-content');
  root.innerHTML = `
    <div class="search-controls">
      <input id="dex-search" type="text" placeholder="Search…" />

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

  // --------------------------------------------------
  // STATE (single source of truth)
  // --------------------------------------------------

  const state = {
    view: 'hitlist',      // 'hitlist' | 'living'
    search: '',
    unclaimed: false,
    sort: 'standard'
  };

  // --------------------------------------------------
  // ELEMENTS
  // --------------------------------------------------

  const searchInput = root.querySelector('#dex-search');
  const unclaimedBtn = root.querySelector('#dex-unclaimed');
  const sortSelect  = root.querySelector('#dex-sort');
  const countLabel  = root.querySelector('#dex-count');

  const tabHitlist = root.querySelector('#tab-hitlist');
  const tabLiving  = root.querySelector('#tab-living');

  // --------------------------------------------------
  // SORT OPTIONS (per tab)
  // --------------------------------------------------

  function setupSortOptions() {
    sortSelect.innerHTML = '';

    if (state.view === 'hitlist') {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="claims">Total Claims</option>
        <option value="points">Total Claim Points</option>
      `;
      state.sort = 'standard';
      state.unclaimed = false;
    } else {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="total">Total Shinies</option>
      `;
      state.sort = 'standard';
      state.unclaimed = false;
    }

    updateButtonStates();
  }

  // --------------------------------------------------
  // BUTTON VISUAL STATE (FIXED)
  // --------------------------------------------------

  function updateButtonStates() {
    unclaimedBtn.classList.toggle('active', state.unclaimed);
    tabHitlist.classList.toggle('active', state.view === 'hitlist');
    tabLiving.classList.toggle('active', state.view === 'living');
  }

  // --------------------------------------------------
  // RENDER PIPELINE
  // --------------------------------------------------

  function render() {
    if (state.view === 'hitlist') {
      renderShinyDexHitlist({
        weeklyModel,
        search: state.search,
        unclaimedOnly: state.unclaimed,
        sort: state.sort,
        countLabel
      });
    } else {
      renderShinyLivingDex({
        showcaseRows: shinyShowcaseRows,
        search: state.search,
        unclaimedOnly: state.unclaimed,
        sort: state.sort,
        countLabel
      });
    }
  }

  // --------------------------------------------------
  // EVENTS
  // --------------------------------------------------

  searchInput.addEventListener('input', e => {
    state.search = e.target.value.toLowerCase();
    render();
  });

  unclaimedBtn.addEventListener('click', () => {
    state.unclaimed = !state.unclaimed;
    updateButtonStates();
    render();
  });

  sortSelect.addEventListener('change', e => {
    state.sort = e.target.value;
    render();
  });

  tabHitlist.addEventListener('click', () => {
    state.view = 'hitlist';
    setupSortOptions();
    render();
  });

  tabLiving.addEventListener('click', () => {
    state.view = 'living';
    setupSortOptions();
    render();
  });

  // --------------------------------------------------
  // INIT
  // --------------------------------------------------

  setupSortOptions();
  render();
}
