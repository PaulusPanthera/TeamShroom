// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller
// Owns ALL DOM under #page-content
// View-scoped state. No leakage.

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

      <button id="dex-unclaimed" class="dex-toggle">
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
  // STATE (VIEW-SCOPED)
  // --------------------------------------------------

  const state = {
    view: 'hitlist',
    hitlist: {
      search: '',
      sort: 'standard',
      showUnclaimed: false
    },
    livingdex: {
      search: '',
      sort: 'standard',
      showUnclaimed: false
    }
  };

  function activeState() {
    return state[state.view];
  }

  // --------------------------------------------------
  // SORT CONFIGURATION
  // --------------------------------------------------

  function configureSort() {
    sortSelect.innerHTML = '';

    if (state.view === 'hitlist') {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="claims">Total Claims</option>
        <option value="points">Total Claim Points</option>
      `;
      unclaimedBtn.disabled = false;
    } else {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="total">Total Shinies</option>
      `;
      unclaimedBtn.disabled = false;
    }

    sortSelect.value = activeState().sort;
    unclaimedBtn.classList.toggle('active', activeState().showUnclaimed);
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  function render() {
    const viewState = activeState();

    searchInput.value = viewState.search;
    sortSelect.value = viewState.sort;
    unclaimedBtn.classList.toggle('active', viewState.showUnclaimed);

    if (state.view === 'hitlist') {
      renderShinyDexHitlist({
        weeklyModel,
        search: viewState.search,
        unclaimedOnly: viewState.showUnclaimed,
        sort: viewState.sort,
        countLabel
      });
    } else {
      renderShinyLivingDex({
        showcaseRows: shinyShowcaseRows,
        search: viewState.search,
        unclaimedOnly: viewState.showUnclaimed,
        sort: viewState.sort,
        countLabel
      });
    }
  }

  // --------------------------------------------------
  // EVENTS
  // --------------------------------------------------

  searchInput.addEventListener('input', e => {
    activeState().search = e.target.value.toLowerCase();
    render();
  });

  unclaimedBtn.addEventListener('click', () => {
    const viewState = activeState();
    viewState.showUnclaimed = !viewState.showUnclaimed;
    render();
  });

  sortSelect.addEventListener('change', e => {
    activeState().sort = e.target.value;
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
    if (state.view === 'livingdex') return;

    state.view = 'livingdex';
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
