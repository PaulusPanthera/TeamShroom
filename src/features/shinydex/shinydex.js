// src/features/shinydex/shinydex.js
// v2.0.0-beta
// Shiny Dex Page Controller
// Owns ALL DOM under the router-provided mount root

import { renderHitlistFromModel } from './shinydex.hitlist.js';
import { renderLivingDexFromModel } from './shinylivingdex.js';

import { prepareHitlistRenderModel } from './shinydex.hitlist.presenter.js';
import { prepareLivingDexRenderModel } from './shinydex.livingdex.presenter.js';

import { bindDexOwnerTooltip, destroyDexOwnerTooltip } from './shinydex.tooltip.js';
import { setupShinyDexHelp } from './shinydex.help.js';

import { buildSearchContext } from './shinydex.search.js';
import {
  getPokemonFamiliesMap,
  getPokemonDexOrder
} from '../../domains/pokemon/pokemon.data.js';

// UnifiedCard v2: variant switching delegation
import { bindUnifiedCardVariantSwitching } from '../../ui/unifiedcard.js';

import {
  createSelectedVariantStore,
  setSelectedVariant
} from './shinydex.variants.state.js';

function assertValidRoot(root) {
  if (!root || !(root instanceof Element)) {
    throw new Error('SHINYDEX_INVALID_ROOT');
  }
}

function bindAbort(signal, onAbort) {
  if (!signal) return;
  if (signal.aborted) {
    onAbort();
    return;
  }

  signal.addEventListener('abort', onAbort, { once: true });
}

function createDexControlsDom() {
  const controls = document.createElement('div');
  controls.className = 'search-controls shiny-dex-controls';

  const searchInput = document.createElement('input');
  searchInput.id = 'dex-search';
  searchInput.type = 'text';
  searchInput.placeholder = 'Search';

  const helpBtn = document.createElement('button');
  helpBtn.id = 'dex-help';
  helpBtn.type = 'button';
  helpBtn.className = 'dex-help-btn';
  helpBtn.setAttribute('aria-label', 'Search Help');

  const helpIcon = document.createElement('img');
  helpIcon.className = 'dex-help-icon';
  helpIcon.src = 'img/symbols/questionmarksprite.png';
  helpIcon.alt = 'Help';
  helpBtn.appendChild(helpIcon);

  const unclaimedBtn = document.createElement('button');
  unclaimedBtn.id = 'dex-unclaimed';
  unclaimedBtn.type = 'button';
  unclaimedBtn.className = 'dex-tab';
  unclaimedBtn.textContent = 'Unclaimed';

  const sortSelect = document.createElement('select');
  sortSelect.id = 'dex-sort';

  const countLabel = document.createElement('span');
  countLabel.id = 'dex-count';

  controls.append(searchInput, helpBtn, unclaimedBtn, sortSelect, countLabel);

  return {
    controls,
    searchInput,
    helpBtn,
    unclaimedBtn,
    sortSelect,
    countLabel
  };
}

function createDexTabsDom() {
  const tabs = document.createElement('div');
  tabs.className = 'search-controls shiny-dex-tabs';

  const tabHitlist = document.createElement('button');
  tabHitlist.id = 'tab-hitlist';
  tabHitlist.type = 'button';
  tabHitlist.className = 'dex-tab active';
  tabHitlist.textContent = 'Shiny Dex Hitlist';

  const tabLiving = document.createElement('button');
  tabLiving.id = 'tab-living';
  tabLiving.type = 'button';
  tabLiving.className = 'dex-tab';
  tabLiving.textContent = 'Shiny Living Dex';

  tabs.append(tabHitlist, tabLiving);

  return { tabs, tabHitlist, tabLiving };
}

function wrapForSidebar(node) {
  const wrap = document.createElement('div');
  // Enables shinydex.css selectors for dex-tab, etc.
  wrap.className = 'shinydex-root';
  wrap.appendChild(node);
  return wrap;
}

function makeLines(lines) {
  const wrap = document.createElement('div');
  wrap.className = 'ts-subbar-stats';

  const list = Array.isArray(lines) ? lines : [];
  list.forEach((t) => {
    const line = document.createElement('div');
    line.textContent = String(t || '').trim();
    wrap.appendChild(line);
  });

  return wrap;
}

export function setupShinyDexPage({ root, weeklyModel, shinyShowcaseRows, sidebar, signal } = {}) {
  assertValidRoot(root);

  // Ensure mount is clean and deterministic.
  root.replaceChildren();

  const localController = new AbortController();
  bindAbort(signal, () => {
    try {
      localController.abort();
    } catch {
      // ignore
    }
  });

  const localSignal = localController.signal;

  // Feature-owned state to avoid coupling to shared UI components.
  const selectedVariantByKey = createSelectedVariantStore();

  const dexOrder = getPokemonDexOrder();
  const familiesMap = getPokemonFamiliesMap();

  const searchCtx = buildSearchContext({
    dexOrder: Array.isArray(dexOrder) && dexOrder.length ? dexOrder : null,
    familyRootsByPokemon: familiesMap || {}
  });

  // Main content mount
  const dexRoot = document.createElement('div');
  dexRoot.className = 'shinydex-root';

  const dexContainer = document.createElement('div');
  dexContainer.id = 'shiny-dex-container';

  dexRoot.appendChild(dexContainer);
  root.appendChild(dexRoot);

  // Sidebar controls
  const controlsDom = createDexControlsDom();
  const tabsDom = createDexTabsDom();

  // Sidebar: unified blocks (Status / Controls / Notes).
  const statusWrap = document.createElement('div');
  statusWrap.className = 'ts-subbar-stats';

  const statusMode = document.createElement('div');
  const statusSearch = document.createElement('div');
  const statusProgress = document.createElement('div');
  const statusUnclaimed = document.createElement('div');

  statusWrap.append(statusMode, statusSearch, statusProgress, statusUnclaimed);

  const controlsStack = document.createElement('div');
  controlsStack.append(tabsDom.tabs, controlsDom.controls);

  const notesNode = makeLines([
    'Hitlist = first team claim per family.',
    'Living Dex = how many the team owns.',
    'Owner tags link back to profiles.'
  ]);

  if (sidebar && typeof sidebar.setSections === 'function') {
    if (typeof sidebar.setTitle === 'function') sidebar.setTitle('SHINYDEX');
    if (typeof sidebar.setHint === 'function') {
      sidebar.setHint('Team legacy and ownership. Hitlist history + Living Dex counts.');
    }

    sidebar.setSections([
      { label: 'STATUS', node: statusWrap },
      { label: 'CONTROLS', node: wrapForSidebar(controlsStack) },
      { label: 'NOTES', node: notesNode }
    ]);
  } else {
    // Fallback: render controls inside the dex root (no shell sidebar present).
    const toolbar = document.createElement('div');
    toolbar.className = 'shinydex-toolbar';

    const inner = document.createElement('div');
    inner.className = 'shinydex-toolbar-inner';

    inner.append(controlsDom.controls, tabsDom.tabs);
    toolbar.appendChild(inner);

    dexRoot.prepend(toolbar);
  }

  // Status updater is bound after state is defined.
  let updateSidebarStatus = () => {};

  const searchInput = controlsDom.searchInput;
  const helpBtn = controlsDom.helpBtn;
  const unclaimedBtn = controlsDom.unclaimedBtn;
  const sortSelect = controlsDom.sortSelect;
  const countLabel = controlsDom.countLabel;

  const tabHitlist = tabsDom.tabHitlist;
  const tabLiving = tabsDom.tabLiving;

  const state = {
    view: 'hitlist',
    search: '',
    unclaimed: false,
    sort: 'standard'
  };

  updateSidebarStatus = () => {
    statusMode.textContent = `Mode: ${state.view === 'hitlist' ? 'Hitlist' : 'Living Dex'}`;

    const q = String(state.search || '').trim();
    statusSearch.textContent = `Search: ${q || '—'}`;

    const p = String(countLabel.textContent || '').trim();
    statusProgress.textContent = `Progress: ${p || '—'}`;

    statusUnclaimed.textContent = `Unclaimed Only: ${state.unclaimed ? 'ON' : 'OFF'}`;
  };

  setupShinyDexHelp({
    buttonEl: helpBtn,
    controlsRoot: controlsDom.controls
  });

  bindDexOwnerTooltip(document);

  // Variant switching for the unified cards (hitlist + living)
  // Bind to the feature root, NOT the router mount root.
  bindUnifiedCardVariantSwitching(dexRoot);

  dexRoot.addEventListener(
    'card:variant',
    (e) => {
      const card = e && e.target && typeof e.target.closest === 'function' ? e.target.closest('.unified-card') : null;
      if (!card) return;
      const key = card.getAttribute('data-pokemon-key') || '';
      if (!key) return;

      const v = (e.detail && e.detail.variant)
        ? String(e.detail.variant)
        : (card.getAttribute('data-selected-variant') || 'standard');
      setSelectedVariant(selectedVariantByKey, key, v || 'standard');
    },
    { signal: localSignal }
  );

  function configureSort() {
    sortSelect.replaceChildren();

    const addOption = (value, label) => {
      const opt = document.createElement('option');
      opt.value = String(value || '');
      opt.textContent = String(label || '');
      sortSelect.appendChild(opt);
    };

    if (state.view === 'hitlist') {
      addOption('standard', 'Standard');
      addOption('claims', 'Total Claims');
      addOption('points', 'Total Claim Points');

      if (state.sort !== 'claims' && state.sort !== 'points' && state.sort !== 'standard') {
        state.sort = 'standard';
      }
    } else {
      addOption('standard', 'Standard');
      addOption('total', 'Total Shinies');

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
      updateSidebarStatus();
      renderHitlistFromModel(model, { selectedVariantByKey });
      return;
    }

    const model = prepareLivingDexRenderModel({
      showcaseRows: shinyShowcaseRows,
      viewState: viewState,
      searchCtx: searchCtx
    });

    countLabel.textContent = model.countLabelText || '';
    updateSidebarStatus();
    renderLivingDexFromModel(model, { selectedVariantByKey });
  }

  searchInput.addEventListener(
    'input',
    (e) => {
      state.search = String(e.target.value || '');
      render();
    },
    { signal: localSignal }
  );

  unclaimedBtn.addEventListener(
    'click',
    () => {
      state.unclaimed = !state.unclaimed;
      render();
    },
    { signal: localSignal }
  );

  sortSelect.addEventListener(
    'change',
    (e) => {
      state.sort = e.target.value;
      render();
    },
    { signal: localSignal }
  );

  tabHitlist.addEventListener(
    'click',
    () => {
      if (state.view === 'hitlist') return;

      state.view = 'hitlist';
      tabHitlist.classList.add('active');
      tabLiving.classList.remove('active');

      state.sort = 'standard';
      state.unclaimed = false;

      configureSort();
      render();
    },
    { signal: localSignal }
  );

  tabLiving.addEventListener(
    'click',
    () => {
      if (state.view === 'living') return;

      state.view = 'living';
      tabLiving.classList.add('active');
      tabHitlist.classList.remove('active');

      state.sort = 'standard';
      state.unclaimed = false;

      configureSort();
      render();
    },
    { signal: localSignal }
  );

  configureSort();
  render();

  return () => {
    try {
      localController.abort();
    } catch {
      // ignore
    }

    // Defensive cleanup. Tooltip self-destroys on hash changes too.
    destroyDexOwnerTooltip();
  };
}
