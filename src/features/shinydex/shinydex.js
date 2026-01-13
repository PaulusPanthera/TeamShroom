// v2.0.0-alpha.1
/**
 * SHINY POKEDEX — SEARCH LEGEND (v2)
 *
 * Syntax:
 * - "text"      → species search (name/key)
 * - "+text"     → family filter
 * - "text+"     → family filter
 * - "@name"     → member filter
 *
 * Labels:
 * - Hitlist: "claimed / total Claimed" | "unclaimed Unclaimed"
 * - Living:  "owned / total Owned"     | "unowned Unowned"
 */

// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller
// Owns ALL DOM under #page-content

import {
  POKEMON_POINTS,
  pokemonFamilies
} from '../../data/pokemondatabuilder.js';

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

import { buildSearchContext, parseSearch } from './shinydex.search.js';
import { prepareHitlistRenderModel } from './shinydex.hitlist.presenter.js';
import { prepareLivingDexRenderModel } from './shinydex.living.presenter.js';
import { bindDexOwnerTooltip } from './shinydex.tooltip.js';
import { setupShinyDexHelp } from './shinydex.help.js';

export function setupShinyDexPage({
  weeklyModel,
  shinyShowcaseRows
}) {
  const root = document.getElementById('page-content');
  root.innerHTML = '';

  root.innerHTML = `
    <div class="search-controls">
      <input id="dex-search" type="text" placeholder="Search" />

      <button id="dex-help" class="dex-toggle dex-help-btn" type="button" aria-label="Help">
        <img src="img/symbols/questionmarksprite.png" alt="Help">
      </button>

      <button id="dex-unclaimed" class="dex-toggle" type="button">Unclaimed</button>
      <select id="dex-sort"></select>
      <span id="dex-count"></span>
    </div>

    <div class="search-controls">
      <button id="tab-hitlist" class="dex-tab active" type="button">Shiny Dex Hitlist</button>
      <button id="tab-living" class="dex-tab" type="button">Shiny Living Dex</button>
    </div>

    <div id="shiny-dex-container"></div>
  `;

  const searchInput = root.querySelector('#dex-search');
  const unclaimedBtn = root.querySelector('#dex-unclaimed');
  const sortSelect = root.querySelector('#dex-sort');

  const tabHitlist = root.querySelector('#tab-hitlist');
  const tabLiving = root.querySelector('#tab-living');

  const container = root.querySelector('#shiny-dex-container');

  const state = {
    view: 'hitlist',
    hitlist: { search: '', sort: 'standard', showUnclaimed: false },
    livingdex: { search: '', sort: 'standard', showUnclaimed: false }
  };

  const active = () => state[state.view];

  const dexOrder = Object.keys(POKEMON_POINTS);
  const searchCtx = buildSearchContext(dexOrder, pokemonFamilies);

  setupShinyDexHelp(root);

  function isHitlistLeaderboardMode() {
    return state.view === 'hitlist' &&
      (active().sort === 'claims' || active().sort === 'points');
  }

  function updateControlAvailability() {
    const parsed = parseSearch(active().search);
    void parsed;

    searchInput.disabled = false;

    if (isHitlistLeaderboardMode()) {
      active().showUnclaimed = false;
      unclaimedBtn.disabled = true;
      unclaimedBtn.classList.remove('active');
      return;
    }

    unclaimedBtn.disabled = false;
    unclaimedBtn.classList.toggle('active', active().showUnclaimed);
  }

  function configureSort() {
    sortSelect.innerHTML = '';

    if (state.view === 'hitlist') {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="claims">Total Claims</option>
        <option value="points">Total Claim Points</option>
      `;
    } else {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="total">Total Shinies</option>
      `;
    }

    sortSelect.value = active().sort;
    searchInput.value = active().search;

    updateControlAvailability();
  }

  function render() {
    updateControlAvailability();

    if (state.view === 'hitlist') {
      renderShinyDexHitlist(
        prepareHitlistRenderModel({
          weeklyModel,
          viewState: active(),
          searchCtx
        })
      );
      return;
    }

    renderShinyLivingDex(
      prepareLivingDexRenderModel({
        showcaseRows: shinyShowcaseRows,
        viewState: active(),
        searchCtx
      })
    );

    bindDexOwnerTooltip(container);
  }

  searchInput.addEventListener('input', e => {
    active().search = e.target.value;
    render();
  });

  unclaimedBtn.addEventListener('click', () => {
    if (unclaimedBtn.disabled) return;
    active().showUnclaimed = !active().showUnclaimed;
    render();
  });

  sortSelect.addEventListener('change', e => {
    active().sort = e.target.value;
    updateControlAvailability();
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

  configureSort();
  render();
}
