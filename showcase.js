// showcase.js
// Team Shroom — Showcase & Member Views
// Design System v1 aligned: no inline styles, no inline events

import { renderUnifiedCard } from './unifiedcard.js';
import {
  normalizeMemberName,
  normalizePokemonName,
  prettifyMemberName
} from './utils.js';

/* ---------------------------------------------------------
   SPRITES
--------------------------------------------------------- */

function getPokemonGif(name) {
  const n = name.replace(/[\s.'’\-]/g, '').toLowerCase();
  const overrides = {
    mrmime: 'mr-mime',
    mimejr: 'mime-jr',
    nidoranf: 'nidoran-f',
    nidoranm: 'nidoran-m',
    typenull: 'type-null',
    porygonz: 'porygon-z'
  };
  const key = overrides[n] || normalizePokemonName(name);
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

function getMemberSpriteUrl() {
  return 'img/membersprites/examplesprite.png';
}

/* ---------------------------------------------------------
   POINTS
--------------------------------------------------------- */

function getPointsForPokemon(name, extra, POKEMON_POINTS) {
  if (extra?.alpha) return 50;
  return POKEMON_POINTS?.[normalizePokemonName(name)] || 1;
}

function getMemberPoints(member, teamShowcase, POKEMON_POINTS) {
  const entry = teamShowcase.find(m => m.name === member.name);
  if (!entry?.shinies) return 0;

  return entry.shinies
    .filter(mon => !mon.lost)
    .reduce((sum, mon) => sum + getPointsForPokemon(mon.name, mon, POKEMON_POINTS), 0);
}

/* ---------------------------------------------------------
   GROUPING
--------------------------------------------------------- */

function groupAlphabetically(members) {
  const map = {};
  members.forEach(m => {
    const k = m.name[0].toUpperCase();
    map[k] ??= [];
    map[k].push(m);
  });
  return Object.keys(map).sort().map(k => ({
    header: k,
    members: map[k].sort((a, b) => a.name.localeCompare(b.name))
  }));
}

function groupByCount(members) {
  const map = {};
  members.forEach(m => {
    const k = m.shinies || 0;
    map[k] ??= [];
    map[k].push(m);
  });
  return Object.keys(map).map(Number).sort((a, b) => b - a).map(k => ({
    header: k,
    members: map[k]
  }));
}

function groupByPoints(members, teamShowcase, POKEMON_POINTS) {
  const map = {};
  members.forEach(m => {
    const pts = getMemberPoints(m, teamShowcase, POKEMON_POINTS);
    map[pts] ??= [];
    map[pts].push(m);
  });
  return Object.keys(map).map(Number).sort((a, b) => b - a).map(k => ({
    header: k,
    members: map[k]
  }));
}

/* ---------------------------------------------------------
   SHOWCASE
--------------------------------------------------------- */

export function renderShowcaseGallery(
  members,
  container,
  mode,
  teamShowcase,
  POKEMON_POINTS
) {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'showcase-summary';
  header.textContent = `Total Shinies: ${
    teamShowcase.reduce((n, m) => n + (m.shinies?.filter(s => !s.lost).length || 0), 0)
  }`;
  container.appendChild(header);

  let groups;
  if (mode === 'shinies') groups = groupByCount(members);
  else if (mode === 'scoreboard') groups = groupByPoints(members, teamShowcase, POKEMON_POINTS);
  else groups = groupAlphabetically(members);

  groups.forEach(group => {
    const h = document.createElement('div');
    h.className = 'showcase-category-header';
    h.textContent = group.header;
    container.appendChild(h);

    const grid = document.createElement('div');
    grid.className = 'showcase-gallery';

    group.members.forEach(member => {
      grid.insertAdjacentHTML('beforeend',
        renderUnifiedCard({
          name: member.name,
          img: getMemberSpriteUrl(),
          info: mode === 'scoreboard'
            ? `Points: ${getMemberPoints(member, teamShowcase, POKEMON_POINTS)}`
            : `Shinies: ${member.shinies}`,
          cardType: 'member',
          states: {
            member: true,
            donator: !!member.donator
          }
        })
      );
    });

    container.appendChild(grid);
  });

  bindShowcaseInteractions(container);
}

/* ---------------------------------------------------------
   MEMBER DETAIL
--------------------------------------------------------- */

export function renderMemberShowcase(member, _, teamShowcase, POKEMON_POINTS) {
  const content = document.getElementById('page-content');
  const entry = teamShowcase.find(m => m.name === member.name);
  const shinies = entry?.shinies || [];

  content.innerHTML = `
    <button class="back-btn" data-nav="showcase">Back</button>

    <div class="member-nameplate">
      <span class="member-name">${member.name}</span>
      <span class="shiny-count">Shinies: ${shinies.filter(s => !s.lost).length}</span>
      <span class="point-count">Points: ${getMemberPoints(member, teamShowcase, POKEMON_POINTS)}</span>
    </div>

    <div class="dex-grid">
      ${shinies.map(mon =>
        renderUnifiedCard({
          name: mon.name,
          img: getPokemonGif(mon.name),
          info: mon.lost ? 'Lost' : `${getPointsForPokemon(mon.name, mon, POKEMON_POINTS)} Points`,
          cardType: 'pokemon',
          states: {
            lost: mon.lost
          },
          symbols: {
            secret: mon.secret,
            safari: mon.safari,
            egg: mon.egg,
            event: mon.event,
            alpha: mon.alpha,
            clip: !!mon.clip
          },
          clip: mon.clip
        })
      ).join('')}
    </div>
  `;

  bindMemberInteractions(content);
}

/* ---------------------------------------------------------
   INTERACTIONS
--------------------------------------------------------- */

function bindShowcaseInteractions(root) {
  root.querySelectorAll('.unified-card[data-card-type="member"]').forEach(card => {
    card.addEventListener('click', () => {
      location.hash = `#showcase-${card.dataset.name}`;
    });
  });
}

function bindMemberInteractions(root) {
  root.querySelector('.back-btn')?.addEventListener('click', () => {
    location.hash = '#showcase';
  });

  root.querySelectorAll('.unified-card[data-clip]').forEach(card => {
    card.addEventListener('click', () => {
      window.open(card.dataset.clip, '_blank');
    });
  });
}

/* ---------------------------------------------------------
   SEARCH / SORT
--------------------------------------------------------- */

export function setupShowcaseSearchAndSort(
  members,
  renderCb,
  _,
  teamShowcase,
  POKEMON_POINTS
) {
  const controls = document.querySelector('.showcase-search-controls');
  controls.innerHTML = '';

  const input = document.createElement('input');
  input.placeholder = 'Search Member';

  const select = document.createElement('select');
  [
    ['Alphabetical', 'alphabetical'],
    ['Total Shinies', 'shinies'],
    ['Total Points', 'scoreboard']
  ].forEach(([l, v]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = l;
    select.appendChild(o);
  });

  const count = document.createElement('span');

  controls.append(input, select, count);

  function update(push) {
    const filtered = members.filter(m =>
      m.name.toLowerCase().includes(input.value.toLowerCase())
    );

    count.textContent = `${filtered.length} Members`;

    renderCb(
      filtered,
      document.getElementById('showcase-gallery-container'),
      select.value,
      teamShowcase,
      POKEMON_POINTS
    );

    if (push) location.hash = `#showcase?sort=${select.value}`;
  }

  input.addEventListener('input', () => update());
  select.addEventListener('change', () => update(true));

  update();
}
