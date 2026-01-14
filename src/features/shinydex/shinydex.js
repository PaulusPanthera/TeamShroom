// v2.0.0-alpha
// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller
// Owns ALL DOM under #page-content

import { renderHitlistFromModel } from './shinydex.hitlist.js';
import { renderLivingDexFromModel } from './shinylivingdex.js';

import { prepareHitlistRenderModel } from './shinydex.hitlist.presenter.js';
import { prepareLivingDexRenderModel } from './shinydex.livingdex.presenter.js';

import { bindDexOwnerTooltip } from './shinydex.tooltip.js';
import { setupShinyDexHelp } from './shinydex.help.js';

import { buildSearchContext } from './shinydex.search.js';
import { pokemonFamilies, POKEMON_DEX_ORDER } from '../../data/pokemondatabuilder.js';

// UnifiedCard v3: variant switching delegation
import { bindUnifiedCardVariantSwitching } from '../../ui/unifiedcard.js';

export function setupShinyDexPage({ weeklyModel, shinyShowcaseRows }) {
  const root = document.getElementById('page-content');
  root.innerHTML = '';

  const selectedVariantByKey = new Map();

  const searchCtx = buildSearchContext({
    dexOrder: Array.isArray(POKEMON_DEX_ORDER) && POKEMON_DEX_ORDER.length ? POKEMON_DEX_ORDER : null,
    familyRootsByPokemon: pokemonFamilies || {}
  });

  root.innerHTML = `
    <div class="search-controls shiny-dex-controls">
      <input id="dex-search" type="text" placeholder="Search" />

      <button id="dex-help" class="dex-help-btn" aria-label="Search Help">
        <img class="dex-help-icon" src="img/symbols/questionmarksprite.png" alt="Help">
      </button>

      <button id="dex-unclaimed" class="dex-tab">
        Unclaimed
      </button>

      <select id="dex-sort"></select>

      <span id="dex-count"></span>
    </div>

    <div class="search-controls shiny-dex-tabs">
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

  const state = {
    view: 'hitlist',
    search: '',
    unclaimed: false,
    sort: 'standard'
  };

  const controlsBar = root.querySelector('.shiny-dex-controls') || root;

  setupShinyDexHelp({
    buttonEl: helpBtn,
    controlsRoot: controlsBar
  });

  bindDexOwnerTooltip(document);

  // Variant switching for the unified cards (hitlist + living)
  bindUnifiedCardVariantSwitching(root);

  root.addEventListener('card:variant', (e) => {
    const card = e && e.target && typeof e.target.closest === 'function' ? e.target.closest('.unified-card') : null;
    if (!card) return;

    const key = card.getAttribute('data-pokemon-key') || '';
    if (!key) return;

    const v = (e.detail && e.detail.variant) ? String(e.detail.variant) : (card.getAttribute('data-selected-variant') || 'standard');
    selectedVariantByKey.set(key, v || 'standard');
  });

  function configureSort() {
    sortSelect.innerHTML = '';

    if (state.view === 'hitlist') {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="claims">Total Claims</option>
        <option value="points">Total Claim Points</option>
      `;
      if (state.sort !== 'claims' && state.sort !== 'points' && state.sort !== 'standard') {
        state.sort = 'standard';
      }
    } else {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="total">Total Shinies</option>
      `;
      if (state.sort !== 'total' && state.sort !== 'standard') {
        state.sort = 'standard';
      }
    }

    sortSelect.value = state.sort;
    unclaimedBtn.classList.toggle('active', state.unclaimed);
  }

  function render() {
    unclaimedBtn.classList.toggle('active', state.unclaimed);

    const viewState = {
      sort: state.sort,
      search: state.search,
      showUnclaimed: state.unclaimed
    };

    if (state.view === 'hitlist') {
      const model = prepareHitlistRenderModel({
        weeklyModel: weeklyModel,
        viewState: viewState,
        searchCtx: searchCtx
      });

      countLabel.textContent = model.countLabelText || '';
      renderHitlistFromModel(model, { selectedVariantByKey });
      return;
    }

    const model = prepareLivingDexRenderModel({
      showcaseRows: shinyShowcaseRows,
      viewState: viewState,
      searchCtx: searchCtx
    });

    countLabel.textContent = model.countLabelText || '';
    renderLivingDexFromModel(model, { selectedVariantByKey });
  }

  searchInput.addEventListener('input', e => {
    state.search = String(e.target.value || '');
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

    state.sort = 'standard';
    state.unclaimed = false;

    configureSort();
    render();
  });

  tabLiving.addEventListener('click', () => {
    if (state.view === 'living') return;

    state.view = 'living';
    tabLiving.classList.add('active');
    tabHitlist.classList.remove('active');

    state.sort = 'standard';
    state.unclaimed = false;

    configureSort();
    render();
  });

  configureSort();
  render();
}
