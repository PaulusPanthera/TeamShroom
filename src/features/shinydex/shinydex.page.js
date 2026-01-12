// src/features/shinydex/shinydex.page.js
// Shiny Pokédex Page Controller
// View orchestration only — no data logic

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinydex.livingdex.js';

export function setupShinyPokedexPage({
  weeklyModel,
  showcaseRows
}) {
  const container = document.getElementById('page-content');
  if (!container) {
    throw new Error('[ShinyDex] page-content not found');
  }

  container.innerHTML = `
    <div class="search-controls">
      <input type="text" id="dex-search" placeholder="Search..." />

      <button id="filter-unclaimed" class="dex-tab active">
        Unclaimed
      </button>

      <select id="dex-sort">
        <option value="standard">Standard</option>
        <option value="claims">Total Claims</option>
        <option value="points">Total Claim Points</option>
      </select>

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

  const searchInput = document.getElementById('dex-search');
  const unclaimedBtn = document.getElementById('filter-unclaimed');
  const sortSelect = document.getElementById('dex-sort');
  const countLabel = document.getElementById('dex-count');

  const tabHitlist = document.getElementById('tab-hitlist');
  const tabLiving = document.getElementById('tab-living');

  let state = {
    view: 'hitlist',
    unclaimedOnly: true,
    search: '',
    sort: 'standard'
  };

  function update() {
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
        showcaseRows,
        search: state.search,
        countLabel
      });
    }
  }

  // -------------------------
  // Controls
  // -------------------------

  searchInput.addEventListener('input', e => {
    state.search = e.target.value.toLowerCase();
    update();
  });

  unclaimedBtn.addEventListener('click', () => {
    state.unclaimedOnly = !state.unclaimedOnly;
    unclaimedBtn.classList.toggle('active', state.unclaimedOnly);
    update();
  });

  sortSelect.addEventListener('change', e => {
    state.sort = e.target.value;
    update();
  });

  tabHitlist.addEventListener('click', () => {
    state.view = 'hitlist';
    tabHitlist.classList.add('active');
    tabLiving.classList.remove('active');
    update();
  });

  tabLiving.addEventListener('click', () => {
    state.view = 'living';
    tabLiving.classList.add('active');
    tabHitlist.classList.remove('active');
    update();
  });

  update();
}
