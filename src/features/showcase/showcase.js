// src/features/showcase/showcase.js
// v2.0.0-beta
// Showcase page controller

import { buildShowcaseModel } from '../../domains/showcase/showcase.model.js';
import { filterMembers, sortMembers, buildMemberGalleryCardView } from './showcase.presenter.js';
import {
  renderShowcaseShell,
  renderShowcaseControls,
  renderShowcaseGallery,
  renderMemberShowcaseShell,
  renderMemberShinies
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

  if (route.view === 'member') {
    const member = model.byKey[route.memberKey];

    if (!member) {
      location.hash = '#showcase';
      return;
    }

    renderMemberShowcaseShell({
      name: member.name,
      shinyCount: member.shinyCount,
      points: member.points,
      spriteSrc: spriteSrcForMember(member)
    });

    renderMemberShinies(member.ownedShinies || member.shinies || [], pokemonPoints);

    document.getElementById('showcase-back')?.addEventListener('click', () => {
      location.hash = '#showcase';
    });

    document.querySelectorAll('.unified-card[data-clip]').forEach(card => {
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-clip');
        if (url) window.open(url, '_blank');
      });
    });

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

    renderShowcaseControls({
      sortMode: state.sortMode,
      memberCount: sorted.length
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
