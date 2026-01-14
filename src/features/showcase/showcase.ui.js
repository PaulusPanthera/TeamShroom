// src/features/showcase/showcase.ui.js
// v2.0.0-beta
// Showcase UI renderer (DOM-only)

import { renderUnifiedCard, escapeHtml } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

export function renderShowcaseShell() {
  const content = document.getElementById('page-content');

  content.innerHTML = `
    <div class="showcase-root">
      <div class="showcase-search-controls"></div>
      <div id="showcase-gallery-container"></div>
    </div>
  `;
}

export function renderShowcaseControls({ sortMode, memberCount }) {
  const controls = document.querySelector('.showcase-search-controls');
  if (!controls) return;

  controls.innerHTML = '';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search Member';
  input.id = 'showcase-search';

  const select = document.createElement('select');
  select.id = 'showcase-sort';

  [
    ['Alphabetical', 'alphabetical'],
    ['Total Shinies', 'shinies'],
    ['Total Points', 'scoreboard']
  ].forEach(([label, value]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });

  select.value = sortMode || 'alphabetical';

  const count = document.createElement('span');
  count.id = 'showcase-count';
  count.textContent = `${Number(memberCount) || 0} Members`;

  controls.append(input, select, count);
}

/**
 * Member gallery card layout (matches requested numbered structure):
 * 1) tier emblem
 * 2) name
 * 3) empty big background box
 * 4) sprite position (center)
 */
function renderMemberGalleryCard(v) {
  const pointsText = `${Number(v.points) || 0}P`;

  return `
    <div class="showcase-gallery-card" data-member-key="${escapeHtml(v.memberKey || '')}">
      <div class="showcase-gallery-card-header">
        <img class="showcase-tier-emblem" src="${escapeHtml(v.tierEmblemSrc || '')}" alt="">
        <div class="showcase-gallery-card-name">${escapeHtml(v.name || '')}</div>
        <div class="showcase-gallery-card-points">${escapeHtml(pointsText)}</div>
      </div>

      <div class="showcase-gallery-card-art">
        <img src="${escapeHtml(v.spriteSrc || '')}" alt="${escapeHtml(v.name || '')}">
      </div>

      <div class="showcase-gallery-card-panel"></div>
    </div>
  `;
}

export function renderShowcaseGallery(memberCardViews) {
  const container = document.getElementById('showcase-gallery-container');
  if (!container) return;

  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'showcase-gallery';

  (memberCardViews || []).forEach(v => {
    grid.insertAdjacentHTML('beforeend', renderMemberGalleryCard(v));
  });

  container.appendChild(grid);
}

export function renderMemberShowcaseShell(member) {
  const content = document.getElementById('page-content');

  content.innerHTML = `
    <button class="back-btn" id="showcase-back">Back</button>

    <div class="member-nameplate">
      <img class="member-sprite" src="${escapeHtml(member && member.spriteSrc ? member.spriteSrc : 'img/membersprites/examplesprite.png')}">
      <span class="member-name">${escapeHtml(member && member.name ? member.name : '')}</span>
      <span class="shiny-count">Shinies: ${escapeHtml(String(member && member.shinyCount != null ? member.shinyCount : 0))}</span>
      <span class="point-count">Points: ${escapeHtml(String(member && member.points != null ? member.points : 0))}</span>
    </div>

    <div class="dex-grid" id="member-shiny-grid"></div>
  `;
}

export function renderMemberShinies(shinies, pokemonPoints) {
  const grid = document.getElementById('member-shiny-grid');
  if (!grid) return;

  grid.innerHTML = '';

  (shinies || []).forEach(s => {
    const pokemonKey = s && s.pokemon ? String(s.pokemon) : '';
    const points = Number(pokemonPoints && pokemonPoints[pokemonKey]) || 0;

    let info = '';
    if (s && s.lost) info = 'Lost';
    else if (s && s.sold) info = 'Sold';

    const tags = [];
    if (s && s.secret) tags.push('Secret');
    if (s && s.alpha) tags.push('Alpha');
    if (s && s.run) tags.push('Run');
    if (s && s.favorite) tags.push('Fav');

    if (!info && tags.length) info = tags.join(' • ');
    else if (info && tags.length) info = `${info} • ${tags.join(' • ')}`;

    const html = renderUnifiedCard({
      pokemonKey,
      pokemonName: prettifyPokemonName(pokemonKey),
      artSrc: getPokemonGif(pokemonKey),
      points,
      infoText: info,
      isUnclaimed: Boolean(s && (s.lost || s.sold)),
      variants: [
        { key: 'standard', enabled: true, infoText: info, active: true },
        { key: 'secret', enabled: false, infoText: info, active: false },
        { key: 'alpha', enabled: false, infoText: info, active: false },
        { key: 'safari', enabled: false, infoText: info, active: false }
      ]
    });

    const withClip = s && s.clip ? html.replace('data-unified-card', `data-unified-card data-clip="${escapeHtml(String(s.clip))}"`) : html;
    grid.insertAdjacentHTML('beforeend', withClip);
  });
}
