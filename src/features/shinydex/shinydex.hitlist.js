// src/features/shinydex/shinydex.js
// v2.0.0-alpha.1
// Shiny Dex Page Controller
// Owns ALL DOM under #page-content

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

/**
 * SHINY POKEDEX — SEARCH LEGEND (v1)
 *
 * Global:
 * - Search never changes truth; only filters visibility.
 * - Search is applied LAST, after view+mode filters.
 *
 * HITLIST (claim-driven):
 * - Standard: Pokémon + family + region + tier tokens.
 * - Leaderboards: search filters MEMBERS; preserves original rank numbers.
 *
 * LIVING DEX (ownership snapshot):
 * - Pokémon + family + region + tier tokens.
 * - Total Shinies: stable sort by count desc, tie-break dex order.
 *
 * Tokens (forgiving):
 * - Pokémon:   "name" | "pokemon:name"
 * - Family:    "+name" | "name+" | "family:name"
 * - Member:    "@name" | "member:name"         (leaderboards only)
 * - Region:    "r:k" | "r:kan" | "region:kanto"
 * - Tier:      "tier:0".."tier:6" | "tier:lm"
 * - Status:    "unclaimed/unowned" | "claimed/owned"
 */

export function setupShinyDexPage({ weeklyModel, shinyShowcaseRows }) {
  const root = document.getElementById('page-content');
  root.innerHTML = '';

  root.innerHTML = `
    <div class="search-controls">
      <input id="dex-search" type="text" placeholder="Search" />

      <button id="dex-help" class="dex-icon-btn" type="button" aria-label="Help">
        <img src="img/symbols/questionmarksprite.png" alt="Help">
      </button>

      <button id="dex-unclaimed" class="dex-action-btn" type="button">
        Unclaimed
      </button>

      <select id="dex-sort"></select>

      <span id="dex-count"></span>
    </div>

    <div id="dex-help-panel" class="dex-help-panel" style="display:none;"></div>

    <div class="search-controls">
      <button id="tab-hitlist" class="dex-tab active" type="button">Shiny Dex Hitlist</button>
      <button id="tab-living" class="dex-tab" type="button">Shiny Living Dex</button>
    </div>

    <div id="shiny-dex-container"></div>

    <div id="dex-owner-tooltip" class="dex-owner-tooltip" aria-hidden="true">
      <div class="owners-title" id="dex-owner-title"></div>
      <div class="owners-list" id="dex-owner-list"></div>
    </div>
  `;

  const searchInput = root.querySelector('#dex-search');
  const helpBtn = root.querySelector('#dex-help');
  const helpPanel = root.querySelector('#dex-help-panel');
  const unclaimedBtn = root.querySelector('#dex-unclaimed');
  const sortSelect = root.querySelector('#dex-sort');
  const countLabel = root.querySelector('#dex-count');

  const tabHitlist = root.querySelector('#tab-hitlist');
  const tabLiving = root.querySelector('#tab-living');

  const tooltip = root.querySelector('#dex-owner-tooltip');
  const tooltipTitle = root.querySelector('#dex-owner-title');
  const tooltipList = root.querySelector('#dex-owner-list');

  const state = {
    hitlist: { search: '', unclaimed: false, sort: 'standard' },
    living: { search: '', unclaimed: false, sort: 'standard' },
    view: 'hitlist',
    helpOpen: false
  };

  function setHelp(open) {
    state.helpOpen = !!open;
    helpPanel.style.display = state.helpOpen ? 'block' : 'none';
    helpPanel.innerHTML = state.helpOpen ? buildHelpHtml() : '';
  }

  function buildHelpHtml() {
    return `
      <div class="dex-help-text">
        <div><b>Search</b></div>
        <div>Pokémon: <span class="mono">name</span> or <span class="mono">pokemon:name</span></div>
        <div>Family: <span class="mono">+name</span> or <span class="mono">name+</span> or <span class="mono">family:name</span></div>
        <div>Region: <span class="mono">r:k</span> / <span class="mono">r:kan</span> / <span class="mono">region:kanto</span></div>
        <div>Tier: <span class="mono">tier:0</span>.. <span class="mono">tier:6</span> / <span class="mono">tier:lm</span></div>
        <div>Status: <span class="mono">unclaimed</span>/<span class="mono">unowned</span> or <span class="mono">claimed</span>/<span class="mono">owned</span></div>
        <div style="margin-top:8px;"><b>Leaderboards</b></div>
        <div>Member filter: <span class="mono">@name</span> or <span class="mono">member:name</span></div>
      </div>
    `;
  }

  function configureSort() {
    sortSelect.innerHTML = '';

    if (state.view === 'hitlist') {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="claims">Total Claims</option>
        <option value="points">Total Claim Points</option>
      `;
      if (state.hitlist.sort !== 'standard' && state.hitlist.sort !== 'claims' && state.hitlist.sort !== 'points') {
        state.hitlist.sort = 'standard';
      }
      sortSelect.value = state.hitlist.sort;
    } else {
      sortSelect.innerHTML = `
        <option value="standard">Standard</option>
        <option value="total">Total Shinies</option>
      `;
      if (state.living.sort !== 'standard' && state.living.sort !== 'total') {
        state.living.sort = 'standard';
      }
      sortSelect.value = state.living.sort;
    }

    syncControlStates();
  }

  function syncControlStates() {
    const v = state.view === 'hitlist' ? state.hitlist : state.living;

    const leaderboard = state.view === 'hitlist' && (v.sort === 'claims' || v.sort === 'points');

    unclaimedBtn.disabled = leaderboard;
    unclaimedBtn.classList.toggle('disabled', leaderboard);

    unclaimedBtn.classList.toggle('active', !leaderboard && !!v.unclaimed);

    searchInput.disabled = false;
    searchInput.value = v.search || '';
  }

  function parseQuery(raw) {
    const text = String(raw || '').trim();
    const q = {
      pokemonText: '',
      familyText: '',
      memberText: '',
      regionText: '',
      tierText: '',
      requireUnclaimed: false,
      requireClaimed: false
    };
    if (!text) return q;

    const parts = text.split(/\s+/).filter(Boolean);

    parts.forEach(p => {
      const lower = p.toLowerCase();

      if (lower === 'unclaimed' || lower === 'unowned') q.requireUnclaimed = true;
      if (lower === 'claimed' || lower === 'owned') q.requireClaimed = true;

      if (lower[0] === '@' && lower.length > 1) {
        q.memberText = lower.slice(1);
        return;
      }

      if (startsWithKey(lower, 'pokemon:')) {
        q.pokemonText = lower.slice('pokemon:'.length);
        return;
      }

      if (startsWithKey(lower, 'family:')) {
        q.familyText = lower.slice('family:'.length);
        return;
      }

      if (startsWithKey(lower, 'member:')) {
        q.memberText = lower.slice('member:'.length);
        return;
      }

      if (startsWithKey(lower, 'r:')) {
        q.regionText = lower.slice(2);
        return;
      }

      if (startsWithKey(lower, 'region:')) {
        q.regionText = lower.slice('region:'.length);
        return;
      }

      if (startsWithKey(lower, 'tier:')) {
        q.tierText = lower.slice('tier:'.length);
        return;
      }

      // forgiving family markers
      if (lower[0] === '+' && lower.length > 1) {
        q.familyText = lower.slice(1);
        return;
      }

      if (lower[lower.length - 1] === '+' && lower.length > 1) {
        q.familyText = lower.slice(0, lower.length - 1);
        return;
      }

      // default: pokemon text
      q.pokemonText = q.pokemonText ? (q.pokemonText + ' ' + lower) : lower;
    });

    q.pokemonText = q.pokemonText.trim();
    q.familyText = q.familyText.trim();
    q.memberText = q.memberText.trim();
    q.regionText = q.regionText.trim();
    q.tierText = q.tierText.trim();

    return q;
  }

  function startsWithKey(s, key) {
    return s.slice(0, key.length) === key;
  }

  // TOOLTIP (OWNERS)
  let tooltipTimer = null;

  function hideOwnersTooltip() {
    if (tooltipTimer) {
      clearInterval(tooltipTimer);
      tooltipTimer = null;
    }
    tooltip.classList.remove('show');
    tooltip.setAttribute('aria-hidden', 'true');
  }

  function showOwnersTooltip(card, x, y) {
    const ownersRaw = card.getAttribute('data-owners') || '';
    if (!ownersRaw) return;

    const owners = ownersRaw.split('|').map(s => s.trim()).filter(Boolean);
    if (!owners.length) return;

    const pokemonName = card.getAttribute('data-name') || '';
    tooltipTitle.textContent = 'Owners — ' + pokemonName;

    const pageSize = 8;
    const pages = [];
    for (let i = 0; i < owners.length; i += pageSize) {
      pages.push(owners.slice(i, i + pageSize));
    }

    let page = 0;
    function renderPage() {
      const list = pages[page] || [];
      const more = owners.length - ((page + 1) * pageSize);
      const lines = list.slice();
      if (more > 0) lines.push('(+ ' + more + ' more)');
      tooltipList.textContent = lines.join('\n');
      page = (page + 1) % pages.length;
    }

    renderPage();

    // readable cadence
    if (tooltipTimer) clearInterval(tooltipTimer);
    if (pages.length > 1) {
      tooltipTimer = setInterval(renderPage, 2600);
    }

    tooltip.style.left = Math.min(x + 14, window.innerWidth - 440) + 'px';
    tooltip.style.top = Math.min(y + 14, window.innerHeight - 220) + 'px';

    tooltip.classList.add('show');
    tooltip.setAttribute('aria-hidden', 'false');
  }

  function bindOwnersTooltip() {
    const container = root.querySelector('#shiny-dex-container');
    if (!container) return;

    container.onmousemove = function (e) {
      const t = e.target;
      if (!t) return;

      const card = closestCard(t);
      if (!card) {
        hideOwnersTooltip();
        return;
      }

      const hasOwners = !!card.getAttribute('data-owners');
      if (!hasOwners) {
        hideOwnersTooltip();
        return;
      }

      showOwnersTooltip(card, e.clientX, e.clientY);
    };

    container.onmouseleave = function () {
      hideOwnersTooltip();
    };
  }

  function closestCard(el) {
    let cur = el;
    while (cur) {
      if (cur.classList && cur.classList.contains('unified-card')) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  function render() {
    const v = state.view === 'hitlist' ? state.hitlist : state.living;
    const q = parseQuery(v.search);

    if (state.view === 'hitlist') {
      renderShinyDexHitlist({
        weeklyModel: weeklyModel,
        sort: v.sort,
        unclaimedOnly: v.unclaimed,
        query: q,
        countLabel: countLabel
      });
    } else {
      renderShinyLivingDex({
        showcaseRows: shinyShowcaseRows,
        sort: v.sort,
        unclaimedOnly: v.unclaimed,
        query: q,
        countLabel: countLabel
      });
    }

    bindOwnersTooltip();
  }

  // EVENTS
  searchInput.addEventListener('input', e => {
    const v = state.view === 'hitlist' ? state.hitlist : state.living;
    v.search = String(e.target.value || '');
    render();
  });

  helpBtn.addEventListener('click', () => {
    setHelp(!state.helpOpen);
  });

  unclaimedBtn.addEventListener('click', () => {
    const v = state.view === 'hitlist' ? state.hitlist : state.living;
    if (unclaimedBtn.disabled) return;
    v.unclaimed = !v.unclaimed;
    syncControlStates();
    render();
  });

  sortSelect.addEventListener('change', e => {
    const v = state.view === 'hitlist' ? state.hitlist : state.living;
    v.sort = String(e.target.value || 'standard');
    syncControlStates();
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

  // INIT
  configureSort();
  setHelp(false);
  render();
}
