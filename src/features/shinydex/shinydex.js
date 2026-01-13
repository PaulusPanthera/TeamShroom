// v2.0.0-alpha.1
// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller
// Owns ALL DOM under #page-content

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

import { prettifyPokemonName } from '../../utils/utils.js';
import { pokemonFamilies, POKEMON_POINTS } from '../../data/pokemondatabuilder.js';

function buildSearchCtx() {
  const dexOrder = Object.keys(POKEMON_POINTS || {});
  const rootByPokemon = {};
  const familyRootsSet = new Set();
  const displayByPokemon = {};

  dexOrder.forEach(p => {
    displayByPokemon[p] = prettifyPokemonName(p).toLowerCase();

    const roots = pokemonFamilies && pokemonFamilies[p];
    const root = Array.isArray(roots) && roots.length ? roots[0] : p;

    rootByPokemon[p] = root;
    familyRootsSet.add(root);
  });

  // also ensure roots have display entries
  Array.from(familyRootsSet).forEach(r => {
    if (!displayByPokemon[r]) displayByPokemon[r] = prettifyPokemonName(r).toLowerCase();
  });

  return {
    dexOrder,
    rootByPokemon,
    familyRoots: Array.from(familyRootsSet),
    displayByPokemon
  };
}

export function setupShinyDexPage({
  weeklyModel,
  shinyShowcaseRows
}) {
  const root = document.getElementById('page-content');
  root.innerHTML = '';

  root.innerHTML = `
    <div class="search-controls">
      <input id="dex-search" type="text" placeholder="Search" />

      <button id="dex-help-btn" class="dex-help-btn" aria-label="Help">
        <img src="img/symbols/questionmarksprite.png" alt="Help" style="width:18px;height:18px;image-rendering:pixelated;">
      </button>

      <button id="dex-unclaimed" class="dex-unclaimed">
        Unclaimed
      </button>

      <select id="dex-sort"></select>

      <span id="dex-count"></span>
    </div>

    <div id="dex-help" class="dex-help" style="display:none;">
      <div class="dex-help-title">Search</div>
      <div class="dex-help-body">
        Pokémon: type a name (partial ok)<br>
        Family: +name, name+ , family:name<br>
        Member: @name, member:name<br>
        Region: r:k, r:kan, r:unova<br>
        Tier: tier:0..6, tier:lm<br>
        Flags: unclaimed / claimed
      </div>
    </div>

    <div class="search-controls">
      <button id="tab-hitlist" class="dex-tab active">Shiny Dex Hitlist</button>
      <button id="tab-living" class="dex-tab">Shiny Living Dex</button>
    </div>

    <div id="shiny-dex-container"></div>
  `;

  const searchInput = root.querySelector('#dex-search');
  const helpBtn = root.querySelector('#dex-help-btn');
  const helpBox = root.querySelector('#dex-help');

  const unclaimedBtn = root.querySelector('#dex-unclaimed');
  const sortSelect = root.querySelector('#dex-sort');
  const countLabel = root.querySelector('#dex-count');

  const tabHitlist = root.querySelector('#tab-hitlist');
  const tabLiving = root.querySelector('#tab-living');

  const searchCtx = buildSearchCtx();

  const state = {
    view: 'hitlist',
    hitlist: {
      search: '',
      showUnclaimed: false,
      sort: 'standard'
    },
    living: {
      search: '',
      showUnclaimed: false,
      sort: 'standard'
    }
  };

  function active() {
    return state.view === 'hitlist' ? state.hitlist : state.living;
  }

  function configureSort() {
    sortSelect.innerHTML = '';

    if (state.view === 'hitlist') {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="claims">Total Claims</option>
        <option value="points">Total Claim Points</option>
      `;
      sortSelect.value = state.hitlist.sort;
    } else {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="total">Total Shinies</option>
      `;
      sortSelect.value = state.living.sort;
    }

    applyControlState();
  }

  function applyControlState() {
    const a = active();

    searchInput.value = a.search || '';
    unclaimedBtn.classList.toggle('active', !!a.showUnclaimed);

    // Hitlist leaderboard modes: Unclaimed button disabled
    if (state.view === 'hitlist' && (a.sort === 'claims' || a.sort === 'points')) {
      unclaimedBtn.disabled = true;
      unclaimedBtn.classList.remove('active');
    } else {
      unclaimedBtn.disabled = false;
    }
  }

  function render() {
    applyControlState();
    const a = active();

    if (state.view === 'hitlist') {
      renderShinyDexHitlist({
        weeklyModel,
        viewState: a,
        searchCtx,
        countLabel
      });
    } else {
      renderShinyLivingDex({
        showcaseRows: shinyShowcaseRows,
        search: (a.search || '').toLowerCase(),
        unclaimedOnly: !!a.showUnclaimed,
        sort: a.sort,
        countLabel
      });
    }
  }

  searchInput.addEventListener('input', e => {
    active().search = String(e.target.value || '');
    render();
  });

  helpBtn.addEventListener('click', () => {
    helpBox.style.display = helpBox.style.display === 'none' ? 'block' : 'none';
  });

  unclaimedBtn.addEventListener('click', () => {
    const a = active();

    if (state.view === 'hitlist' && (a.sort === 'claims' || a.sort === 'points')) {
      return;
    }

    a.showUnclaimed = !a.showUnclaimed;
    render();
  });

  sortSelect.addEventListener('change', e => {
    active().sort = e.target.value;
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

  configureSort();
  render();
}
