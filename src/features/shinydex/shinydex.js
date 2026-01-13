// v2.0.0-alpha.1
// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller
// Owns ALL DOM under #page-content

import { buildSearchContext } from './shinydex.search.js';
import { prepareHitlistRenderModel } from './shinydex.hitlist.presenter.js';
import { prepareLivingDexRenderModel } from './shinydex.livingdex.presenter.js';

import { renderHitlistFromPresenterModel } from './shinydex.hitlist.js';
import { renderLivingDexFromPresenterModel } from './shinylivingdex.js';

import { setupDexOwnerTooltip as bindDexOwnerTooltip } from './shinydex.tooltip.js';
import { bindShinyDexHelp } from './shinydex.help.js';

export function setupShinyDexPage({
  weeklyModel,
  shinyShowcaseRows
}) {
  const root = document.getElementById('page-content');
  root.innerHTML = '';

  root.innerHTML = `
    <div class="search-controls">
      <input id="dex-search" type="text" placeholder="Search" />

      <button id="dex-help" class="dex-help-btn" aria-label="Help"></button>

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

  const searchInput = root.querySelector('#dex-search');
  const helpBtn = root.querySelector('#dex-help');
  const unclaimedBtn = root.querySelector('#dex-unclaimed');
  const sortSelect = root.querySelector('#dex-sort');
  const countLabel = root.querySelector('#dex-count');

  const tabHitlist = root.querySelector('#tab-hitlist');
  const tabLiving = root.querySelector('#tab-living');

  // help + owners tooltip
  bindShinyDexHelp(helpBtn);
  bindDexOwnerTooltip(document.getElementById('shiny-dex-container'));

  const searchCtx = buildSearchContext();

  // per-view state (no leakage)
  const state = {
    view: 'hitlist',
    search: '',
    showUnclaimed: false,

    hitlistSort: 'standard',   // standard | claims | points
    livingSort: 'standard'     // standard | total
  };

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

    // button styling
    unclaimedBtn.classList.toggle('active', !!state.showUnclaimed);

    // disable unclaimed in hitlist scoreboard modes
    const hitScore = state.view === 'hitlist' && (state.hitlistSort === 'claims' || state.hitlistSort === 'points');
    unclaimedBtn.disabled = !!hitScore;
    unclaimedBtn.classList.toggle('is-disabled', !!hitScore);
    if (hitScore) state.showUnclaimed = false;
    unclaimedBtn.classList.toggle('active', !!state.showUnclaimed);

    // disable typing in hitlist leaderboard modes (still visible, inert)
    searchInput.disabled = !!hitScore;
    searchInput.classList.toggle('is-disabled', !!hitScore);
    if (hitScore) searchInput.value = state.search; // keep display
  }

  function render() {
    const sort = state.view === 'hitlist' ? state.hitlistSort : state.livingSort;

    if (state.view === 'hitlist') {
      const model = prepareHitlistRenderModel({
        weeklyModel,
        viewState: {
          sort,
          search: state.search,
          showUnclaimed: state.showUnclaimed
        },
        searchCtx
      });

      // scoreboard sections use member layout, still render in region-section
      renderHitlistFromPresenterModel(model, countLabel);
      return;
    }

    const model = prepareLivingDexRenderModel({
      showcaseRows: shinyShowcaseRows,
      viewState: {
        sort,
        search: state.search,
        showUnclaimed: state.showUnclaimed
      },
      searchCtx
    });

    renderLivingDexFromPresenterModel(model, countLabel);
  }

  // events
  searchInput.addEventListener('input', e => {
    state.search = String(e.target.value || '');
    render();
  });

  unclaimedBtn.addEventListener('click', () => {
    if (unclaimedBtn.disabled) return;
    state.showUnclaimed = !state.showUnclaimed;
    unclaimedBtn.classList.toggle('active', state.showUnclaimed);
    render();
  });

  sortSelect.addEventListener('change', e => {
    const v = e.target.value;

    if (state.view === 'hitlist') state.hitlistSort = v;
    else state.livingSort = v;

    configureSort();
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

  // init
  configureSort();
  render();
}
