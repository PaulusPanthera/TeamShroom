// src/features/shinydex/shinydex.js
// Shiny Dex — PAGE CONTROLLER

import { buildShinyDexModel } from '../../data/shinydex.model.js';
import { renderHitlistStandard } from './shinydex.hitlist.js';
import { renderHitlistScoreboard } from './shinydex.scoreboard.js';
import { renderShinyLivingDex } from './shinylivingdex.js';
import { POKEMON_SHOW } from '../../data/pokemondatabuilder.js';

export function renderShinyDexHitlist(weeklyModel, showcaseRows) {
  const root = document.getElementById('shiny-dex-container');
  root.innerHTML = '';

  /* ---------------- CONTROLS ---------------- */

  const controls = document.createElement('div');
  controls.className = 'search-controls';

  const searchInput = document.createElement('input');
  searchInput.placeholder = 'Search…';

  const unclaimedBtn = document.createElement('button');
  unclaimedBtn.textContent = 'Unclaimed';
  unclaimedBtn.className = 'dex-tab';

  const modeSelect = document.createElement('select');
  modeSelect.innerHTML = `
    <option value="standard">Standard</option>
    <option value="claims">Total Claims</option>
    <option value="points">Total Claim Points</option>
    <option value="total">Total Shinies</option>
  `;

  const totalCounter = document.createElement('span');

  controls.append(searchInput, unclaimedBtn, modeSelect, totalCounter);
  root.appendChild(controls);

  /* ---------------- TABS ---------------- */

  const tabs = document.createElement('div');
  tabs.className = 'search-controls';

  const hitlistTab = document.createElement('button');
  hitlistTab.textContent = 'Shiny Dex Hitlist';
  hitlistTab.className = 'dex-tab active';

  const livingTab = document.createElement('button');
  livingTab.textContent = 'Shiny Living Dex';
  livingTab.className = 'dex-tab';

  tabs.append(hitlistTab, livingTab);
  root.appendChild(tabs);

  /* ---------------- CONTENT ---------------- */

  const content = document.createElement('div');
  root.appendChild(content);

  /* ---------------- DATA ---------------- */

  const dex = buildShinyDexModel(weeklyModel).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  const state = {
    view: 'hitlist',
    search: '',
    unclaimed: false,
    mode: 'standard'
  };

  function syncControls() {
    hitlistTab.classList.toggle('active', state.view === 'hitlist');
    livingTab.classList.toggle('active', state.view === 'living');
    unclaimedBtn.classList.toggle('active', state.unclaimed);

    const hitlistOnly = state.view === 'hitlist';
    unclaimedBtn.style.display = hitlistOnly ? '' : 'none';
    modeSelect.style.display = '';
  }

  function apply() {
    content.innerHTML = '';
    syncControls();

    if (state.view === 'living') {
      renderShinyLivingDex({
        showcaseRows,
        search: state.search,
        sort: state.mode === 'total' ? 'total' : 'standard',
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
      renderHitlistScoreboard(list, state.mode, content, totalCounter);
    }
  }

  /* ---------------- EVENTS ---------------- */

  searchInput.addEventListener('input', e => {
    state.search = e.target.value.toLowerCase();
    apply();
  });

  unclaimedBtn.addEventListener('click', () => {
    state.unclaimed = !state.unclaimed;
    apply();
  });

  modeSelect.addEventListener('change', e => {
    state.mode = e.target.value;
    apply();
  });

  hitlistTab.addEventListener('click', () => {
    state.view = 'hitlist';
    apply();
  });

  livingTab.addEventListener('click', () => {
    state.view = 'living';
    apply();
  });

  apply();
}
