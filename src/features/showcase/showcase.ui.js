// src/features/showcase/showcase.ui.js
// v2.0.0-beta
// Showcase UI renderer (DOM-only)

import { renderUnifiedCard, escapeHtml } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

function injectDataAttr(html, attrName, attrValue) {
  if (!attrName || attrValue == null) return html;
  const safe = escapeHtml(String(attrValue));
  return html.replace('data-unified-card', `data-unified-card ${attrName}="${safe}"`);
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
 * Member gallery uses UnifiedCard as a member-card type.
 * Structure mapping (requested):
 * 1) tier emblem -> headerLeftIconSrc
 * 2) name -> pokemonName
 * 3) empty panel -> unified-info (text hidden via CSS)
 * 4) sprite position -> art window (centered)
 */
export function renderShowcaseGallery(memberCardViews) {
  const container = document.getElementById('showcase-gallery-container');
  if (!container) return;

  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'showcase-gallery';

  (memberCardViews || []).forEach(v => {
    const pointsText = `${Number(v.points) || 0}P`;

    const html = renderUnifiedCard({
      cardType: 'member',
      pokemonKey: v.memberKey,
      pokemonName: v.name,
      artSrc: v.spriteSrc,
      points: v.points,
      headerLeftIconSrc: v.tierEmblemSrc,
      headerRightText: pointsText,
      infoText: '',
      isUnclaimed: false,
      showVariants: false
    });

    grid.insertAdjacentHTML('beforeend', injectDataAttr(html, 'data-member-key', v.memberKey));
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

    const withClip = s && s.clip
      ? html.replace('data-unified-card', `data-unified-card data-clip="${escapeHtml(String(s.clip))}"`)
      : html;

    grid.insertAdjacentHTML('beforeend', withClip);
  });
}
