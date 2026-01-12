// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller
// Owns ALL DOM under #page-content

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

export function setupShinyDexPage({
  weeklyModel,
  shinyShowcaseRows
}) {
  const root = document.getElementById('page-content');
  root.innerHTML = '';

  // --------------------------------------------------
  // UI SKELETON
  // --------------------------------------------------

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
  // ELEMENTS
  // --------------------------------------------------

  const searchInput = root.querySelector('#dex-search');
  const unclaimedBtn = root.querySelector('#dex-unclaimed');
  const sortSelect = root.querySelector('#dex-sort');
  const countLabel = root.querySelector('#dex-count');

  const tabHitlist = root.querySelector('#tab-hitlist');
  const tabLiving = root.querySelector('#tab-living');

  // --------------------------------------------------
  // STATE (SINGLE SOURCE OF TRUTH)
  // --------------------------------------------------

  const state = {
    view: 'hitlist',        // 'hitlist' | 'living'
    search: '',
    unclaimed: false,
    sort: 'standard'
  };

  // --------------------------------------------------
  // SORT OPTIONS (PER VIEW)
  // --------------------------------------------------

  function configureSort() {
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

    unclaimedBtn.classList.toggle('active', state.unclaimed);
  }

  // --------------------------------------------------
  // RENDER PIPELINE
  // --------------------------------------------------

  function render() {
    unclaimedBtn.classList.toggle('active', state.unclaimed);

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
    render();
  });

  sortSelect.addEventListener('change', e => {
    state.sort = e.target.value;
    render();
  });

  tabHitlist.addEventListener('click', () => {
    if (state.view === 'hitlist') return;

    state.view = 'hitlist';
    tabHitlist.classList.add('active');
    tabLiving.classList.remove('active');

    configureSort();
    render();
  });

  tabLiving.addEventListener('click', () => {
    if (state.view === 'living') return;

    state.view = 'living';
    tabLiving.classList.add('active');
    tabHitlist.classList.remove('active');

    configureSort();
    render();
  });

  // --------------------------------------------------
  // INIT
  // --------------------------------------------------

  configureSort();
  render();
}
