// src/features/shinydex/shinydex.js
// Shiny Dex — Page Controller

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

  const hitlistSelect = document.createElement('select');
  hitlistSelect.innerHTML = `
    <option value="standard">Standard</option>
    <option value="claims">Total Claims</option>
    <option value="points">Total Claim Points</option>
  `;

  const livingSelect = document.createElement('select');
  livingSelect.innerHTML = `
    <option value="standard">Standard</option>
    <option value="total">Total Shinies</option>
  `;

  const totalCounter = document.createElement('span');

  controls.append(searchInput, unclaimedBtn, hitlistSelect, livingSelect, totalCounter);
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

  const content = document.createElement('div');
  root.appendChild(content);

  /* ---------------- DATA ---------------- */

  const dex = buildShinyDexModel(weeklyModel).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  /* ---------------- STATE ---------------- */

  const state = {
    view: 'hitlist',

    hitlist: {
      mode: 'standard',
      unclaimed: false
    },

    living: {
      mode: 'standard',
      unclaimed: false
    },

    search: ''
  };

  function syncControls() {
    hitlistTab.classList.toggle('active', state.view === 'hitlist');
    livingTab.classList.toggle('active', state.view === 'living');

    hitlistSelect.style.display = state.view === 'hitlist' ? '' : 'none';
    livingSelect.style.display = state.view === 'living' ? '' : 'none';

    unclaimedBtn.classList.toggle(
      'active',
      state.view === 'hitlist'
        ? state.hitlist.unclaimed
        : state.living.unclaimed
    );
  }

  function apply() {
    content.innerHTML = '';
    syncControls();

    if (state.view === 'living') {
      renderShinyLivingDex({
        showcaseRows,
        search: state.search,
        sort: state.living.mode,
        unclaimedOnly: state.living.unclaimed,
        container: content,
        totalCounter
      });
      return;
    }

    let list = dex.filter(e =>
      e.pokemon.includes(state.search)
    );

    if (state.hitlist.unclaimed) {
      list = list.filter(e => !e.claimed);
    }

    if (state.hitlist.mode === 'standard') {
      renderHitlistStandard(list, content, totalCounter);
    } else {
      renderHitlistScoreboard(list, state.hitlist.mode, content, totalCounter);
    }
  }

  /* ---------------- EVENTS ---------------- */

  searchInput.addEventListener('input', e => {
    state.search = e.target.value.toLowerCase();
    apply();
  });

  unclaimedBtn.addEventListener('click', () => {
    if (state.view === 'hitlist') {
      state.hitlist.unclaimed = !state.hitlist.unclaimed;
    } else {
      state.living.unclaimed = !state.living.unclaimed;
    }
    apply();
  });

  hitlistSelect.addEventListener('change', e => {
    state.hitlist.mode = e.target.value;
    apply();
  });

  livingSelect.addEventListener('change', e => {
    state.living.mode = e.target.value;
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
