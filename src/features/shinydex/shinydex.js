/**
 * SHINY POKEDEX — SEARCH LEGEND (v2)
 *
 * Global:
 * - Search never changes truth; only filters visibility.
 * - Search is applied LAST, after view+mode filters.
 * - Forgiving matching: display name OR canonical key, case-insensitive substring.
 *
 * Syntax:
 * - "text"      → species search (name/key)
 * - "+text"     → family search (show all stages of any family matched by text)
 * - "text+"     → family search (same as above)
 * - "@name"     → member search
 *
 * HITLIST:
 * - Standard:
 *   - species search: filters species cards
 *   - family search: filters to families matched by query
 *   - member search (@): filters to species claimed by member
 *   - unclaimed-only works
 * - Leaderboards (Total Claims / Total Claim Points):
 *   - species/family search ignored
 *   - member search (@) filters members shown
 *   - unclaimed disabled
 *
 * LIVING DEX:
 * - species search: filters species cards
 * - family search: filters to families matched by query
 * - member search (@): filters to species owned by member
 * - Standard: dex/region order
 * - Total Shinies: sort by count desc, tie-break by dex order
 *
 * Counters:
 * - Always computed from mode dataset (pre-search).
 * - Region headers show region totals for mode dataset (pre-search).
 */

import { buildShinyDexModel } from '../../domains/shinydex/hitlist.model.js';
import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';
import {
  POKEMON_REGION,
  POKEMON_SHOW,
  POKEMON_POINTS,
  pokemonFamilies
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
      <input id="dex-search" type="text" placeholder="Search… (Pokémon, +family, @member)" />
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

  // --------------------------------------------------
  // DEX ORDER + FAMILY ORDER (DEX-STABLE)
  // --------------------------------------------------

  const dexOrder = Object.keys(POKEMON_POINTS);
  const dexIndex = Object.fromEntries(dexOrder.map((k, i) => [k, i]));

  const rootByPokemon = {};
  const stagesByRoot = {};

  dexOrder.forEach(pokemon => {
    const fam = pokemonFamilies[pokemon];
    const root = Array.isArray(fam) && fam.length ? fam[0] : pokemon;

    rootByPokemon[pokemon] = root;
    stagesByRoot[root] ??= [];
    stagesByRoot[root].push(pokemon);
  });

  // --------------------------------------------------
  // SEARCH PARSING + MATCHING
  // --------------------------------------------------

  function normalizeText(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/♀/g, 'f')
      .replace(/♂/g, 'm')
      .replace(/[.'":,!?()[\]{}]/g, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseSearch(raw) {
    const s = String(raw || '').trim();
    if (!s) return { kind: 'none', q: '' };

    if (s.startsWith('@')) {
      const q = normalizeText(s.slice(1));
      return q ? { kind: 'member', q } : { kind: 'none', q: '' };
    }

    const trimmed = s.trim();
    const familyMode =
      trimmed.startsWith('+') || trimmed.endsWith('+');

    if (familyMode) {
      const q = normalizeText(trimmed.replace(/^\+/, '').replace(/\+$/, ''));
      return q ? { kind: 'family', q } : { kind: 'none', q: '' };
    }

    const q = normalizeText(trimmed);
    return q ? { kind: 'species', q } : { kind: 'none', q: '' };
  }

  function speciesMatches(pokemonKey, q) {
    if (!q) return true;

    const display = normalizeText(prettifyPokemonName(pokemonKey));
    const key = normalizeText(pokemonKey);

    return display.includes(q) || key.includes(q);
  }

  function memberMatches(name, q) {
    if (!q) return true;
    return normalizeText(name).includes(q);
  }

  function resolveFamilyRootsByQuery(q) {
    const roots = new Set();
    if (!q) return roots;

    Object.entries(stagesByRoot).forEach(([root, stages]) => {
      const hit = stages.some(p => speciesMatches(p, q));
      if (hit) roots.add(root);
    });

    return roots;
  }

  // --------------------------------------------------
  // CONTROL AVAILABILITY
  // --------------------------------------------------

  function isHitlistLeaderboardMode() {
    return state.view === 'hitlist' &&
      (active().sort === 'claims' || active().sort === 'points');
  }

  function updateControlAvailability() {
    const parsed = parseSearch(active().search);

    // search input is always typeable; behavior depends on mode
    searchInput.disabled = false;

    if (isHitlistLeaderboardMode()) {
      active().showUnclaimed = false;
      unclaimedBtn.disabled = true;
      unclaimedBtn.classList.remove('active');
      return;
    }

    unclaimedBtn.disabled = false;
    unclaimedBtn.classList.toggle('active', active().showUnclaimed);

    // no further UI state needed; parsed is used in filter functions
    void parsed;
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

  // --------------------------------------------------
  // FILTER FUNCTIONS (VIEW-SCOPED)
  // --------------------------------------------------

  function applyHitlistFilters(snapshot, { searchRaw, unclaimedOnly, mode }) {
    // mode: 'standard' | 'claims' | 'points'
    // returns { visible, memberQueryForLeaderboard?: string }

    const parsed = parseSearch(searchRaw);

    // leaderboards: only @member filters members; species/family ignored
    if (mode === 'claims' || mode === 'points') {
      return {
        visible: snapshot,
        memberQueryForLeaderboard: parsed.kind === 'member' ? parsed.q : ''
      };
    }

    let modeSet = snapshot;

    if (unclaimedOnly) {
      modeSet = modeSet.filter(e => !e.claimed);
    }

    // SEARCH LAST (visibility only)
    if (parsed.kind === 'none') return { visible: modeSet };

    if (parsed.kind === 'member') {
      const q = parsed.q;
      return {
        visible: modeSet.filter(e => e.claimed && memberMatches(e.claimedBy || '', q))
      };
    }

    if (parsed.kind === 'family') {
      const roots = resolveFamilyRootsByQuery(parsed.q);
      return {
        visible: modeSet.filter(e => roots.has(rootByPokemon[e.pokemon] || e.pokemon))
      };
    }

    // species
    return {
      visible: modeSet.filter(e => speciesMatches(e.pokemon, parsed.q))
    };
  }

  function applyLivingDexFilters(snapshot, { searchRaw, unclaimedOnly, mode }) {
    const parsed = parseSearch(searchRaw);

    let modeSet = snapshot;

    if (mode === 'total') {
      modeSet = [...modeSet].sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return (dexIndex[a.pokemon] ?? 999999) - (dexIndex[b.pokemon] ?? 999999);
      });
    }

    if (unclaimedOnly) {
      modeSet = modeSet.filter(e => e.count === 0);
    }

    // SEARCH LAST (visibility only)
    if (parsed.kind === 'none') return { visible: modeSet };

    if (parsed.kind === 'member') {
      const q = parsed.q;
      return {
        visible: modeSet.filter(e => Array.isArray(e.owners) && e.owners.some(o => memberMatches(o, q)))
      };
    }

    if (parsed.kind === 'family') {
      const roots = resolveFamilyRootsByQuery(parsed.q);
      return {
        visible: modeSet.filter(e => roots.has(rootByPokemon[e.pokemon] || e.pokemon))
      };
    }

    // species
    return {
      visible: modeSet.filter(e => speciesMatches(e.pokemon, parsed.q))
    };
  }

  // --------------------------------------------------
  // HITLIST PREP
  // --------------------------------------------------

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

    // LEADERBOARD MODES
    if (mode === 'claims' || mode === 'points') {
      const { memberQueryForLeaderboard } = applyHitlistFilters(snapshot, {
        searchRaw: view.search,
        unclaimedOnly: false,
        mode
      });

      const claimed = snapshot.filter(e => e.claimed);

      const byMember = {};
      claimed.forEach(e => {
        byMember[e.claimedBy] ??= [];
        byMember[e.claimedBy].push(e);
      });

      let members = Object.entries(byMember)
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

      if (memberQueryForLeaderboard) {
        members = members.filter(m => memberMatches(m.name, memberQueryForLeaderboard));
      }

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

    // STANDARD MODE
    const filtered = applyHitlistFilters(snapshot, {
      searchRaw: view.search,
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

  // --------------------------------------------------
  // LIVING DEX PREP
  // --------------------------------------------------

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
      searchRaw: view.search,
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

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  function render() {
    updateControlAvailability();

    if (state.view === 'hitlist') {
      renderShinyDexHitlist(prepareHitlist());
      return;
    }

    renderShinyLivingDex(prepareLivingDex());
  }

  // --------------------------------------------------
  // EVENTS
  // --------------------------------------------------

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
