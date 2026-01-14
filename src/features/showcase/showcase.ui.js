// src/features/showcase/showcase.ui.js
// v2.0.0-beta
// Showcase UI renderer (DOM-only)

import { renderUnifiedCard, escapeHtml } from '../../ui/unifiedcard.js';
import { getMemberSprite } from '../../utils/membersprite.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

function injectDataAttr(html, attrName, attrValue) {
  if (!attrName || attrValue == null) return html;
  const safe = escapeHtml(String(attrValue));
  // Insert after data-unified-card token (stable marker)
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
  input.placeholder = 'Search';
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

export function renderShowcaseGallery(memberCardViews) {
  const container = document.getElementById('showcase-gallery-container');
  if (!container) return;

  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'showcase-gallery';

  const spriteIndex = Array.isArray(memberCardViews) ? memberCardViews.map(v => ({
    key: v.memberKey,
    sprite: v.membersForSprites && v.membersForSprites[v.memberKey] ? v.membersForSprites[v.memberKey] : null
  })) : [];

  (memberCardViews || []).forEach(v => {
    const artSrc = getMemberSprite(v.artMemberKey, spriteIndex);

    const html = renderUnifiedCard({
      pokemonKey: v.pokemonKey,
      pokemonName: v.pokemonName,
      artSrc,
      points: v.points,
      infoText: v.infoText,
      isUnclaimed: v.isUnclaimed,
      variants: v.variants
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

export function renderMemberShinies(shinyCardViews) {
  const grid = document.getElementById('member-shiny-grid');
  if (!grid) return;

  grid.innerHTML = '';

  (shinyCardViews || []).forEach(v => {
    const html = renderUnifiedCard({
      pokemonKey: v.pokemonKey,
      pokemonName: v.pokemonName,
      artSrc: getPokemonGif(v.pokemonKey),
      points: v.points,
      infoText: v.infoText,
      isUnclaimed: v.isUnclaimed,
      variants: v.variants
    });

    const withClip = v.clip ? injectDataAttr(html, 'data-clip', v.clip) : html;
    grid.insertAdjacentHTML('beforeend', withClip);
  });
}
