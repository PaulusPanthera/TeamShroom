// src/features/showcase/showcase.js
// v2.0.0-beta
// Showcase page controller

import { buildShowcaseModel } from '../../domains/showcase/showcase.model.js';
import { filterMembers, sortMembers, buildMemberGalleryCardView, buildMemberShinyCardView } from './showcase.presenter.js';
import { renderShowcaseShell, renderShowcaseControls, renderShowcaseGallery, renderMemberShowcaseShell, renderMemberShinies } from './showcase.ui.js';
import { getMemberSprite } from '../../utils/membersprite.js';

function parseHash() {
  const raw = String(location.hash || '').trim();
  // #showcase-<memberKey>
  if (raw.startsWith('#showcase-')) {
    const key = decodeURIComponent(raw.slice('#showcase-'.length));
    return { view: 'member', memberKey: String(key || '').trim().toLowerCase() };
  }

  // #showcase?sort=...
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

export function setupShowcasePage({ membersRows, showcaseRows, pokemonPoints }) {
  const model = buildShowcaseModel({ membersRows, showcaseRows, pokemonPoints });
  const route = parseHash();

  if (route.view === 'member') {
    const member = model.byKey[route.memberKey];

    if (!member) {
      location.hash = '#showcase';
      return;
    }

    const spriteSrc = getMemberSprite(member.key, [{ key: member.key, sprite: member.sprite }]);

    renderMemberShowcaseShell({
      name: member.name,
      shinyCount: member.shinyCount,
      points: member.points,
      spriteSrc
    });

    const shinyViews = (member.shinies || []).map(s => buildMemberShinyCardView(s, pokemonPoints));
    renderMemberShinies(shinyViews);

    document.getElementById('showcase-back')?.addEventListener('click', () => {
      location.hash = '#showcase';
    });

    // Clip opener: uses data-clip injected into unified card root.
    document.querySelectorAll('.unified-card[data-clip]').forEach(card => {
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-clip');
        if (url) window.open(url, '_blank');
      });
    });

    return;
  }

  // GALLERY VIEW
  renderShowcaseShell();

  const state = {
    search: '',
    sortMode: normalizeSort(route.sortMode)
  };

  // Provide sprite lookup input compatible with getMemberSprite(memberKey, membersData)
  const membersForSprites = {};
  model.members.forEach(m => {
    if (!m || !m.key) return;
    membersForSprites[m.key] = m.sprite || null;
  });

  function render() {
    const filtered = filterMembers(model.members, state.search);
    const sorted = sortMembers(filtered, state.sortMode);

    renderShowcaseControls({
      sortMode: state.sortMode,
      memberCount: sorted.length
    });

    const cardViews = sorted.map(m => buildMemberGalleryCardView(m, membersForSprites, state.sortMode));
    renderShowcaseGallery(cardViews);

    // Interactions
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
