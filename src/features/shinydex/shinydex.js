// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

export function setupShinyDexPage({
  weeklyModel,
  shinyShowcaseRows
}) {
  const container = document.getElementById('page-content');

  container.innerHTML = `
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

  const searchInput = container.querySelector('#dex-search');
  const unclaimedBtn = container.querySelector('#dex-unclaimed');
  const sortSelect = container.querySelector('#dex-sort');
  const countLabel = container.querySelector('#dex-count');

  const tabHitlist = container.querySelector('#tab-hitlist');
  const tabLiving = container.querySelector('#tab-living');

  let state = {
    view: 'hitlist',
    search: '',
    unclaimed: false,
    sort: 'standard'
  };

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

    unclaimedBtn.classList.toggle('active', state.unclaimed);
  }

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

  // ---------------- EVENTS ----------------

  searchInput.addEventListener('input', e => {
    state.search = e.target.value.toLowerCase();
    render();
  });

  unclaimedBtn.addEventListener('click', () => {
    state.unclaimed = !state.unclaimed;
    unclaimedBtn.classList.toggle('active', state.unclaimed);
    render();
  });

  sortSelect.addEventListener('change', e => {
    state.sort = e.target.value;
    render();
  });

  tabHitlist.addEventListener('click', () => {
    state.view = 'hitlist';
    tabHitlist.classList.add('active');
    tabLiving.classList.remove('active');
    setupSortOptions();
    render();
  });

  tabLiving.addEventListener('click', () => {
    state.view = 'living';
    tabLiving.classList.add('active');
    tabHitlist.classList.remove('active');
    setupSortOptions();
    render();
  });

  setupSortOptions();
  render();
}
