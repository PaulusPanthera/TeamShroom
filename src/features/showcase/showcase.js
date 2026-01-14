// src/features/showcase/showcase.js
// v2.0.0-beta
// Showcase page controller

import { buildShowcaseModel } from '../../domains/showcase/showcase.model.js';
import {
  filterMembers,
  sortMembers,
  buildMemberGalleryCardView,
  filterMemberShinies,
  sortMemberShinies,
  buildMemberShinyCounts,
  groupMemberShiniesByStatus
} from './showcase.presenter.js';

import { POKEMON_DEX_ORDER } from '../../data/pokemondatabuilder.js';

import { bindUnifiedCardVariantSwitching } from '../../ui/unifiedcard.js';
import {
  renderShowcaseShell,
  renderShowcaseControls,
  renderShowcaseGallery,
  renderMemberShowcaseShell,
  renderMemberShinyControls,
  renderMemberShinySections
} from './showcase.ui.js';

function parseHash() {
  const raw = String(location.hash || '').trim();

  if (raw.startsWith('#showcase-')) {
    const key = decodeURIComponent(raw.slice('#showcase-'.length));
    return { view: 'member', memberKey: String(key || '').trim().toLowerCase() };
  }

  if (raw.startsWith('#showcase')) {
    const qIndex = raw.indexOf('?');
    if (qIndex !== -1) {
      const qs = raw.slice(qIndex + 1);
      const params = new URLSearchParams(qs);
      const sort = String(params.get('sort') || '').trim().toLowerCase();
      return { view: 'gallery', sortMode: sort || 'alphabetical' };
    }
    return { view: 'gallery', sortMode: 'alphabetical' };
  }

  return { view: 'gallery', sortMode: 'alphabetical' };
}

function normalizeSort(sortMode) {
  if (sortMode === 'scoreboard') return 'scoreboard';
  if (sortMode === 'shinies') return 'shinies';
  return 'alphabetical';
}

function spriteSrcForMember(member) {
  const key = member && member.key ? String(member.key) : '';
  const ext = member && member.sprite ? String(member.sprite) : '';
  if (key && ext) return `img/membersprites/${key}sprite.${ext}`;
  return 'img/membersprites/examplesprite.png';
}

export function setupShowcasePage({ membersRows, showcaseRows, pokemonPoints }) {
  const model = buildShowcaseModel({ membersRows, showcaseRows, pokemonPoints });
  const route = parseHash();

  const dexIndex = {};
  if (Array.isArray(POKEMON_DEX_ORDER) && POKEMON_DEX_ORDER.length) {
    POKEMON_DEX_ORDER.forEach((k, i) => { dexIndex[String(k || '').toLowerCase()] = i; });
  }

  if (route.view === 'member') {
    const member = model.byKey[route.memberKey];

    if (!member) {
      location.hash = '#showcase';
      return;
    }

    renderMemberShowcaseShell({
      name: member.name,
      shinyCount: member.shinyCount,
      inactiveShinyCount: member.inactiveShinyCount,
      points: member.points,
      spriteSrc: spriteSrcForMember(member)
    });

    const root = document.querySelector('.showcase-member-root');
    bindUnifiedCardVariantSwitching(root);

    const state = {
      search: '',
      sortMode: 'newest',
      statusMode: 'active',
      variantMode: 'any'
    };

    const allRows = Array.isArray(member.shinies) ? member.shinies : [];
    const withIdx = allRows.map((s, i) => Object.assign({}, s, { __idx: i }));

    function renderMember() {
      const filtered = filterMemberShinies(withIdx, {
        search: state.search,
        status: state.statusMode,
        variant: state.variantMode
      });

      const sorted = sortMemberShinies(filtered, state.sortMode, {
        dexIndex,
        pointsMap: pokemonPoints
      });

      const grouped = groupMemberShiniesByStatus(sorted);

      const sections = [];
      if (grouped.active.length) {
        sections.push({
          key: 'active',
          title: `Active (${grouped.active.length})`,
          entries: grouped.active
        });
      }
      if (grouped.sold.length) {
        sections.push({
          key: 'sold',
          title: `Sold (${grouped.sold.length})`,
          entries: grouped.sold
        });
      }
      if (grouped.lost.length) {
        sections.push({
          key: 'lost',
          title: `Lost (${grouped.lost.length})`,
          entries: grouped.lost
        });
      }

      const countsVisible = buildMemberShinyCounts(sorted);
      const countsAll = buildMemberShinyCounts(withIdx);

      const countText = `${countsVisible.total} / ${countsAll.total} Shinies`;

      renderMemberShinyControls({
        search: state.search,
        sortMode: state.sortMode,
        statusMode: state.statusMode,
        variantMode: state.variantMode,
        countText
      });

      renderMemberShinySections(sections, pokemonPoints);

      const input = document.getElementById('member-shiny-search');
      const sort = document.getElementById('member-shiny-sort');
      const status = document.getElementById('member-shiny-status');
      const variant = document.getElementById('member-shiny-variant');

      if (input) {
        input.oninput = (e) => {
          state.search = String(e.target.value || '');
          renderMember();
        };
      }

      if (sort) {
        sort.onchange = (e) => {
          state.sortMode = String(e.target.value || 'newest');
          renderMember();
        };
      }

      if (status) {
        status.onchange = (e) => {
          state.statusMode = String(e.target.value || 'active');
          renderMember();
        };
      }

      if (variant) {
        variant.onchange = (e) => {
          state.variantMode = String(e.target.value || 'any');
          renderMember();
        };
      }
    }

    renderMember();

    document.getElementById('showcase-back')?.addEventListener('click', () => {
      location.hash = '#showcase';
    });

    // Delegated clip-open; ignore variant button clicks.
    // Bound only inside the member view root to avoid cross-page leakage.
    if (root && !root.__showcaseClipBound) {
      root.__showcaseClipBound = true;
      root.addEventListener('click', (e) => {
        const btn = e && e.target && typeof e.target.closest === 'function'
          ? e.target.closest('.variant-btn')
          : null;
        if (btn) return;

        const card = e && e.target && typeof e.target.closest === 'function'
          ? e.target.closest('.unified-card[data-clip]')
          : null;
        if (!card) return;

        const url = card.getAttribute('data-clip');
        if (url) window.open(url, '_blank');
      });
    }

    return;
  }

  renderShowcaseShell();

  const state = {
    search: '',
    sortMode: normalizeSort(route.sortMode)
  };

  function render() {
    const filtered = filterMembers(model.members, state.search);
    const sorted = sortMembers(filtered, state.sortMode);

    const totalShinies = sorted.reduce((sum, m) => sum + (Number(m && m.shinyCount) || 0), 0);
    const totalPoints = sorted.reduce((sum, m) => sum + (Number(m && m.points) || 0), 0);

    renderShowcaseControls({
      sortMode: state.sortMode,
      memberCount: sorted.length,
      shinyCount: totalShinies,
      points: totalPoints
    });

    const cardViews = sorted.map(m => buildMemberGalleryCardView(m, state.sortMode));
    renderShowcaseGallery(cardViews);

    document.querySelectorAll('.unified-card[data-member-key]').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-member-key');
        if (!key) return;
        location.hash = `#showcase-${encodeURIComponent(String(key))}`;
      });
    });

    const input = document.getElementById('showcase-search');
    const select = document.getElementById('showcase-sort');

    if (input) {
      input.value = state.search;
      input.oninput = (e) => {
        state.search = String(e.target.value || '');
        render();
      };
    }

    if (select) {
      select.value = state.sortMode;
      select.onchange = (e) => {
        state.sortMode = normalizeSort(e.target.value);
        location.hash = `#showcase?sort=${encodeURIComponent(state.sortMode)}`;
      };
    }
  }

  render();
}
