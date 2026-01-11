
// showcase.js
// Team Shroom — Showcase & Member Views
// JSON-first runtime, enforced contracts only

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import {
  normalizePokemonName,
  prettifyPokemonName
} from '../../utils/utils.js';
import { getMemberSprite } from '../../utils/membersprite.js';

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

/* ---------------------------------------------------------
   POINTS
--------------------------------------------------------- */

function getPointsForPokemon(pokemon, shiny, POKEMON_POINTS) {
  if (shiny.alpha) return 50;
  const pts = POKEMON_POINTS?.[normalizePokemonName(pokemon)];
  return typeof pts === 'number' ? pts : 0;
}

function getMemberPoints(memberName, teamMembers, POKEMON_POINTS) {
  const entry = teamMembers.find(m => m.name === memberName);
  if (!entry?.shinies) return 0;

  return entry.shinies
    .filter(mon => !mon.lost && !mon.sold)
    .reduce(
      (sum, mon) =>
        sum + getPointsForPokemon(mon.pokemon, mon, POKEMON_POINTS),
      0
    );
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
  return Object.keys(map)
    .sort()
    .map(k => ({
      header: k,
      members: map[k].sort((a, b) => a.name.localeCompare(b.name))
    }));
}

function groupByCount(members) {
  const map = {};
  members.forEach(m => {
    const k = m.shinies?.length || 0;
    map[k] ??= [];
    map[k].push(m);
  });
  return Object.keys(map)
    .map(Number)
    .sort((a, b) => b - a)
    .map(k => ({
      header: k,
      members: map[k]
    }));
}

function groupByPoints(members, teamMembers, POKEMON_POINTS) {
  const map = {};
  members.forEach(m => {
    const pts = getMemberPoints(m.name, teamMembers, POKEMON_POINTS);
    map[pts] ??= [];
    map[pts].push(m);
  });
  return Object.keys(map)
    .map(Number)
    .sort((a, b) => b - a)
    .map(k => ({
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
  teamMembers,
  POKEMON_POINTS
) {
  container.innerHTML = '';

  let groups;
  if (mode === 'shinies')
    groups = groupByCount(members);
  else if (mode === 'scoreboard')
    groups = groupByPoints(members, teamMembers, POKEMON_POINTS);
  else groups = groupAlphabetically(members);

  groups.forEach(group => {
    const h = document.createElement('div');
    h.className = 'showcase-category-header';
    h.textContent = group.header;
    container.appendChild(h);

    const grid = document.createElement('div');
    grid.className = 'showcase-gallery';

    group.members.forEach(member => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: member.name,
          img: getMemberSprite(member.name, teamMembers),
          info:
            mode === 'scoreboard'
              ? `Points: ${getMemberPoints(
                  member.name,
                  teamMembers,
                  POKEMON_POINTS
                )}`
              : `Shinies: ${member.shinies.length}`,
          cardType: 'member'
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

export function renderMemberShowcase(
  member,
  sortMode,
  teamMembers,
  POKEMON_POINTS
) {
  const content = document.getElementById('page-content');
  const entry = teamMembers.find(m => m.name === member.name);
  const shinies = entry?.shinies || [];

  content.innerHTML = `
    <button class="back-btn" data-sort="${sortMode || 'alphabetical'}">Back</button>

    <div class="member-nameplate">
      <img
        class="member-sprite"
        src="${getMemberSprite(member.name, teamMembers)}"
        alt=""
      >
      <span class="member-name">${member.name}</span>
      <span class="shiny-count">Shinies: ${
        shinies.filter(s => !s.lost && !s.sold).length
      }</span>
      <span class="point-count">Points: ${getMemberPoints(
        member.name,
        teamMembers,
        POKEMON_POINTS
      )}</span>
    </div>

    <div class="dex-grid">
      ${shinies
        .map(mon => {
          const symbols = {
            secret: mon.secret,
            alpha: mon.alpha,
            run: mon.run,
            favorite: mon.favorite,
            clip: !!mon.clip
          };

          if (mon.method) symbols[mon.method] = true;

          return renderUnifiedCard({
            name: prettifyPokemonName(mon.pokemon),
            img: getPokemonGif(mon.pokemon),
            info: mon.sold
  ? 'Sold'
  : mon.lost
  ? (
      mon.pokemon.toLowerCase() === 'cubchoo' &&
      member.name.toLowerCase() === 'skullz'
        ? 'R.I.P.'
        : 'Lost'
    )
  : `${getPointsForPokemon(
      mon.pokemon,
      mon,
      POKEMON_POINTS
    )} Points`,
            cardType: 'pokemon',
            lost: mon.lost || mon.sold,
            symbols,
            clip: mon.clip || null
          });
        })
        .join('')}
    </div>
  `;

  bindMemberInteractions(content);
}

/* ---------------------------------------------------------
   INTERACTIONS
--------------------------------------------------------- */

function bindShowcaseInteractions(root) {
  root
    .querySelectorAll('.unified-card[data-card-type="member"]')
    .forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.name;
        location.hash = `#showcase-${encodeURIComponent(name)}`;
      });
    });
}

function bindMemberInteractions(root) {
  const back = root.querySelector('.back-btn');
  back?.addEventListener('click', () => {
    const sort = back.dataset.sort || 'alphabetical';
    location.hash = `#showcase?sort=${sort}`;
  });

  root
    .querySelectorAll('.unified-card[data-clip]')
    .forEach(card => {
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
  teamMembers,
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
      teamMembers,
      POKEMON_POINTS
    );

    if (push) location.hash = `#showcase?sort=${select.value}`;
  }

  input.addEventListener('input', () => update());
  select.addEventListener('change', () => update(true));

  update();
}
