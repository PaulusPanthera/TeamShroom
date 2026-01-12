// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller
// Owns ALL DOM under #page-content
// Central authority for counters and view logic

import { buildShinyDexModel } from '../../domains/shinydex/hitlist.model.js';
import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';
import { POKEMON_REGION } from '../../data/pokemondatabuilder.js';

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

export function setupShinyDexPage({
  weeklyModel,
  shinyShowcaseRows
}) {
  const root = document.getElementById('page-content');
  root.innerHTML = '';

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  root.innerHTML = `
    <div class="search-controls">
      <input id="dex-search" type="text" placeholder="Search…" />
      <button id="dex-unclaimed" class="dex-toggle">Unclaimed</button>
      <select id="dex-sort"></select>
      <span id="dex-count"></span>
    </div>

    <div class="search-controls">
      <button id="tab-hitlist" class="dex-tab active">Shiny Dex Hitlist</button>
      <button id="tab-living" class="dex-tab">Shiny Living Dex</button>
    </div>

    <div id="shiny-dex-container"></div>
  `;

  const searchInput = root.querySelector('#dex-search');
  const unclaimedBtn = root.querySelector('#dex-unclaimed');
  const sortSelect = root.querySelector('#dex-sort');
  const countLabel = root.querySelector('#dex-count');

  const tabHitlist = root.querySelector('#tab-hitlist');
  const tabLiving = root.querySelector('#tab-living');

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const state = {
    view: 'hitlist',
    hitlist: {
      search: '',
      sort: 'standard',
      showUnclaimed: false
    },
    livingdex: {
      search: '',
      sort: 'standard',
      showUnclaimed: false
    }
  };

  const active = () => state[state.view];

  // --------------------------------------------------
  // SORT OPTIONS
  // --------------------------------------------------

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
    unclaimedBtn.classList.toggle('active', active().showUnclaimed);
  }

  // --------------------------------------------------
  // HITLIST PREP
  // --------------------------------------------------

  function prepareHitlist() {
    let dex = buildShinyDexModel(weeklyModel);

    if (active().search) {
      dex = dex.filter(e =>
        e.pokemon.includes(active().search)
      );
    }

    const totalSpecies = dex.length;
    const claimedSpecies = dex.filter(e => e.claimed).length;
    const unclaimedSpecies = totalSpecies - claimedSpecies;

    if (active().showUnclaimed) {
      dex = dex.filter(e => !e.claimed);
    }

    if (active().sort === 'claims' || active().sort === 'points') {
      const byMember = {};

      dex.forEach(e => {
        if (!e.claimed) return;
        byMember[e.claimedBy] ??= [];
        byMember[e.claimedBy].push(e);
      });

      const members = Object.entries(byMember)
        .map(([name, entries]) => ({
          name,
          entries,
          claims: entries.length,
          points: entries.reduce((s, e) => s + e.points, 0)
        }))
        .sort((a, b) =>
          active().sort === 'claims'
            ? b.claims - a.claims
            : b.points - a.points
        );

      return {
        mode: 'scoreboard',
        sections: members.map((m, i) => ({
          key: m.name,
          title: `${i + 1}. ${m.name} — ${m.claims} Claims · ${m.points} Points`,
          entries: m.entries.map(e => ({
            ...e,
            highlighted: true
          }))
        })),
        countLabelText: `${members.length} Members`
      };
    }

    const byRegion = {};
    dex.forEach(e => {
      const region = POKEMON_REGION[e.pokemon] || 'unknown';
      byRegion[region] ??= [];
      byRegion[region].push(e);
    });

    return {
      mode: 'standard',
      sections: Object.entries(byRegion).map(([region, entries]) => ({
        key: region,
        title: `${region.toUpperCase()} (${entries.filter(e => e.claimed).length} / ${entries.length})`,
        entries: entries.map(e => ({
          ...e,
          highlighted: e.claimed && e.points >= 15
        }))
      })),
      countLabelText: active().showUnclaimed
        ? `${unclaimedSpecies} / ${claimedSpecies} Species`
        : `${claimedSpecies} / ${totalSpecies} Species`
    };
  }

  // --------------------------------------------------
  // LIVING DEX PREP
  // --------------------------------------------------

  function prepareLivingDex() {
    let dex = buildShinyLivingDexModel(shinyShowcaseRows);

    if (active().search) {
      dex = dex.filter(e =>
        e.pokemon.includes(active().search)
      );
    }

    const totalSpecies = dex.length;
    const ownedSpecies = dex.filter(e => e.count > 0).length;
    const unownedSpecies = totalSpecies - ownedSpecies;

    if (active().showUnclaimed) {
      dex = dex.filter(e => e.count === 0);
    }

    if (active().sort === 'total') {
      dex.sort((a, b) => b.count - a.count);
    }

    const byRegion = {};
    dex.forEach(e => {
      const region = e.region;
      byRegion[region] ??= [];
      byRegion[region].push(e);
    });

    return {
      sections: Object.entries(byRegion).map(([region, entries]) => ({
        key: region,
        title: `${region.toUpperCase()} (${entries.filter(e => e.count > 0).length} / ${entries.length})`,
        entries: entries.map(e => ({
          ...e,
          highlighted: e.count > 0
        }))
      })),
      countLabelText: active().showUnclaimed
        ? `${unownedSpecies} / ${totalSpecies} Species`
        : `${ownedSpecies} / ${totalSpecies} Species`
    };
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  function render() {
    const data =
      state.view === 'hitlist'
        ? prepareHitlist()
        : prepareLivingDex();

    if (state.view === 'hitlist') {
      renderShinyDexHitlist(data);
    } else {
      renderShinyLivingDex(data);
    }
  }

  // --------------------------------------------------
  // EVENTS
  // --------------------------------------------------

  searchInput.addEventListener('input', e => {
    active().search = e.target.value.toLowerCase();
    render();
  });

  unclaimedBtn.addEventListener('click', () => {
    active().showUnclaimed = !active().showUnclaimed;
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
    if (state.view === 'livingdex') return;
    state.view = 'livingdex';
    tabLiving.classList.add('active');
    tabHitlist.classList.remove('active');
    configureSort();
    render();
  });

  // --------------------------------------------------
  // INIT
  // --------------------------------------------------

  configureSort();
  render();
}
