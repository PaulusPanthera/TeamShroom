// src/features/shinydex/shinydex.js
// Shiny Dex — PAGE CONTROLLER
// Owns controls, tabs, state, dispatch

import { buildShinyDexModel } from '../../data/shinydex.model.js';
import { renderHitlistStandard } from './shinydex.hitlist.js';
import { renderHitlistScoreboard } from './shinydex.scoreboard.js';
import { renderShinyLivingDex } from './shinylivingdex.js';
import { POKEMON_SHOW } from '../../data/pokemondatabuilder.js';

export function renderShinyDexHitlist(weeklyModel, showcaseRows) {
  const root = document.getElementById('shiny-dex-container');
  root.innerHTML = '';

  /* ---------- CONTROLS ---------- */

  const controls = document.createElement('div');
  controls.className = 'search-controls';

  const searchInput = document.createElement('input');
  searchInput.placeholder = 'Search…';

  const unclaimedBtn = document.createElement('button');
  unclaimedBtn.textContent = 'Unclaimed';
  unclaimedBtn.className = 'dex-tab active';

  const modeSelect = document.createElement('select');
  modeSelect.innerHTML = `
    <option value="standard">Standard</option>
    <option value="claims">Total Claims</option>
    <option value="points">Total Claim Points</option>
  `;

  const totalCounter = document.createElement('span');

  controls.append(searchInput, unclaimedBtn, modeSelect, totalCounter);
  root.appendChild(controls);

  /* ---------- TABS ---------- */

  const tabs = document.createElement('div');
  tabs.className = 'search-controls';

  const tabHitlist = document.createElement('button');
  tabHitlist.textContent = 'Shiny Dex Hitlist';
  tabHitlist.className = 'dex-tab active';

  const tabLiving = document.createElement('button');
  tabLiving.textContent = 'Shiny Living Dex';
  tabLiving.className = 'dex-tab';

  tabs.append(tabHitlist, tabLiving);
  root.appendChild(tabs);

  /* ---------- CONTENT ---------- */

  const content = document.createElement('div');
  root.appendChild(content);

  /* ---------- DATA ---------- */

  const dex = buildShinyDexModel(weeklyModel).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  const state = {
    view: 'hitlist',
    search: '',
    unclaimed: true,
    mode: 'standard'
  };

  /* ---------- PIPELINE ---------- */

  function apply() {
    content.innerHTML = '';

    if (state.view === 'living') {
      renderShinyLivingDex({
        showcaseRows,
        search: state.search,
        container: content,
        totalCounter
      });
      return;
    }

    let list = dex.filter(e =>
      e.pokemon.includes(state.search)
    );

    if (state.unclaimed) {
      list = list.filter(e => !e.claimed);
    }

    if (state.mode === 'standard') {
      renderHitlistStandard(list, content, totalCounter);
    } else {
      renderHitlistScoreboard(
        list,
        state.mode,
        content,
        totalCounter
      );
    }
  }

  /* ---------- EVENTS ---------- */

  searchInput.addEventListener('input', e => {
    state.search = e.target.value.toLowerCase();
    apply();
  });

  unclaimedBtn.addEventListener('click', () => {
    state.unclaimed = !state.unclaimed;
    unclaimedBtn.classList.toggle('active', state.unclaimed);
    apply();
  });

  modeSelect.addEventListener('change', e => {
    state.mode = e.target.value;
    apply();
  });

  tabHitlist.addEventListener('click', () => {
    state.view = 'hitlist';
    tabHitlist.classList.add('active');
    tabLiving.classList.remove('active');
    apply();
  });

  tabLiving.addEventListener('click', () => {
    state.view = 'living';
    tabLiving.classList.add('active');
    tabHitlist.classList.remove('active');
    apply();
  });

  apply();
}
