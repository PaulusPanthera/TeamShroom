/**
 * SHINY POKEDEX — SEARCH LEGEND (v1)
 *
 * Global:
 * - Search never changes truth; only filters visibility.
 * - Search is applied LAST, after view+mode filters.
 *
 * HITLIST (claim-driven):
 * - Query matches Pokémon species name only (prettifyPokemonName), case-insensitive substring.
 * - No member/owner matching. No fuzzy.
 * - Standard: supports search + unclaimed-only.
 * - Leaderboards (Total Claims / Total Claim Points): search DISABLED, unclaimed DISABLED.
 *
 * LIVING DEX (ownership snapshot):
 * - Query matches Pokémon species name only, case-insensitive substring.
 * - No owner matching. No fuzzy.
 * - Standard: dex/region order, includes unowned species.
 * - Total Shinies: sort by count desc, tie-break by dex order.
 * - Unclaimed-only: show count=0 species in dex order (sorting irrelevant).
 *
 * Counters:
 * - Hitlist: report species counts based on mode dataset (not post-search).
 * - Living Dex: show ownedSpecies/totalSpecies (mode dataset), region headers show owned/total.
 */

// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller
// Owns ALL DOM under #page-content
// Central authority for counters and view logic

import { buildShinyDexModel } from '../../domains/shinydex/hitlist.model.js';
import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';
import {
  POKEMON_REGION,
  POKEMON_SHOW,
  POKEMON_POINTS
} from '../../data/pokemondatabuilder.js';
import { prettifyPokemonName } from '../../utils/utils.js';

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

export function setupShinyDexPage({
  weeklyModel,
  shinyShowcaseRows
}) {
  const root = document.getElementById('page-content');
  root.innerHTML = '';

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

  const tabHitlist = root.querySelector('#tab-hitlist');
  const tabLiving = root.querySelector('#tab-living');

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

  const dexOrder = Object.keys(POKEMON_POINTS);
  const dexIndex = Object.fromEntries(dexOrder.map((k, i) => [k, i]));

  function normalizeForSearch(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/♀/g, 'f')
      .replace(/♂/g, 'm')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function matchesPokemonDisplay(pokemonKey, queryRaw) {
    const q = normalizeForSearch(queryRaw);
    if (!q) return true;

    const display = normalizeForSearch(prettifyPokemonName(pokemonKey));
    const key = normalizeForSearch(pokemonKey);

    return display.includes(q) || key.includes(q);
  }

  function isHitlistLeaderboardMode() {
    return active().sort === 'claims' || active().sort === 'points';
  }

  function updateControlAvailability() {
    if (state.view === 'hitlist') {
      const leaderboard = isHitlistLeaderboardMode();

      searchInput.disabled = leaderboard;
      if (leaderboard) searchInput.value = '';

      if (leaderboard) {
        active().showUnclaimed = false;
        unclaimedBtn.disabled = true;
        unclaimedBtn.classList.remove('active');
      } else {
        unclaimedBtn.disabled = false;
        unclaimedBtn.classList.toggle('active', active().showUnclaimed);
      }

      return;
    }

    searchInput.disabled = false;
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

  function applyHitlistFilters(snapshot, opts) {
    const mode = opts.mode; // 'standard' | 'claims' | 'points'
    const unclaimedOnly = !!opts.unclaimedOnly;

    if (mode === 'claims' || mode === 'points') {
      return {
        visible: snapshot,
        searchAllowed: false
      };
    }

    let modeSet = snapshot;
    if (unclaimedOnly) modeSet = modeSet.filter(e => !e.claimed);

    const visible = opts.search
      ? modeSet.filter(e => matchesPokemonDisplay(e.pokemon, opts.search))
      : modeSet;

    return {
      visible,
      searchAllowed: true
    };
  }

  function applyLivingDexFilters(snapshot, opts) {
    let modeSet = snapshot;

    if (opts.mode === 'total') {
      modeSet = [...modeSet].sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return (dexIndex[a.pokemon] ?? 999999) - (dexIndex[b.pokemon] ?? 999999);
      });
    }

    if (opts.unclaimedOnly) {
      modeSet = modeSet.filter(e => e.count === 0);
    }

    const visible = opts.search
      ? modeSet.filter(e => matchesPokemonDisplay(e.pokemon, opts.search))
      : modeSet;

    return { visible };
  }

  function prepareHitlist() {
    const view = active();
    const mode = view.sort;

    const snapshot = buildShinyDexModel(weeklyModel).filter(
      e => POKEMON_SHOW[e.pokemon] !== false
    );

    const totalSpecies = snapshot.length;
    const claimedSpecies = snapshot.filter(e => e.claimed).length;
    const unclaimedSpecies = totalSpecies - claimedSpecies;

    const regionStats = {};
    snapshot.forEach(e => {
      const region = POKEMON_REGION[e.pokemon] || 'unknown';
      regionStats[region] ??= { total: 0, claimed: 0 };
      regionStats[region].total += 1;
      if (e.claimed) regionStats[region].claimed += 1;
    });

    if (mode === 'claims' || mode === 'points') {
      const claimed = snapshot.filter(e => e.claimed);

      const byMember = {};
      claimed.forEach(e => {
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
          mode === 'claims'
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
            highlighted: true,
            info: `${e.points} pts`
          }))
        })),
        countLabelText: `${members.length} Members`
      };
    }

    const filtered = applyHitlistFilters(snapshot, {
      search: view.search,
      unclaimedOnly: view.showUnclaimed,
      mode
    });

    const byRegion = {};
    filtered.visible.forEach(e => {
      const region = POKEMON_REGION[e.pokemon] || 'unknown';
      byRegion[region] ??= [];
      byRegion[region].push(e);
    });

    return {
      mode: 'standard',
      sections: Object.entries(byRegion).map(([region, entries]) => {
        const stats = regionStats[region] || { claimed: 0, total: 0 };
        return {
          key: region,
          title: `${region.toUpperCase()} (${stats.claimed} / ${stats.total})`,
          entries: entries.map(e => ({
            ...e,
            highlighted: e.claimed && e.points >= 15
          }))
        };
      }),
      countLabelText: view.showUnclaimed
        ? `${unclaimedSpecies} / ${claimedSpecies} Species`
        : `${claimedSpecies} / ${totalSpecies} Species`
    };
  }

  function prepareLivingDex() {
    const view = active();
    const mode = view.sort;

    const snapshot = buildShinyLivingDexModel(shinyShowcaseRows);

    const totalSpecies = snapshot.length;
    const ownedSpecies = snapshot.filter(e => e.count > 0).length;
    const unownedSpecies = totalSpecies - ownedSpecies;

    const regionStats = {};
    snapshot.forEach(e => {
      const region = e.region || 'unknown';
      regionStats[region] ??= { total: 0, owned: 0 };
      regionStats[region].total += 1;
      if (e.count > 0) regionStats[region].owned += 1;
    });

    const filtered = applyLivingDexFilters(snapshot, {
      search: view.search,
      unclaimedOnly: view.showUnclaimed,
      mode
    });

    const byRegion = {};
    filtered.visible.forEach(e => {
      const region = e.region || 'unknown';
      byRegion[region] ??= [];
      byRegion[region].push(e);
    });

    return {
      sections: Object.entries(byRegion).map(([region, entries]) => {
        const stats = regionStats[region] || { owned: 0, total: 0 };
        return {
          key: region,
          title: `${region.toUpperCase()} (${stats.owned} / ${stats.total})`,
          entries: entries.map(e => ({
            ...e,
            highlighted: e.count > 0
          }))
        };
      }),
      countLabelText: view.showUnclaimed
        ? `${unownedSpecies} / ${totalSpecies} Species`
        : `${ownedSpecies} / ${totalSpecies} Species`
    };
  }

  function render() {
    updateControlAvailability();

    if (state.view === 'hitlist') {
      renderShinyDexHitlist(prepareHitlist());
      return;
    }

    renderShinyLivingDex(prepareLivingDex());
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
