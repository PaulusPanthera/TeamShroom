// src/features/showcase/showcase.ui.js
// v2.0.0-beta
// Showcase UI renderer (DOM-only)

import { renderUnifiedCard, escapeHtml } from '../../ui/unifiedcard.js';
import { prettifyPokemonName, getPokemonDbShinyGifSrc } from '../../utils/utils.js';

function normalize(str) {
  return String(str || '').trim().toLowerCase();
}

function injectDataAttr(html, attrName, attrValue) {
  if (!attrName || attrValue == null) return html;
  const safe = escapeHtml(String(attrValue));
  return html.replace('data-unified-card', `data-unified-card ${attrName}="${safe}"`);
}

function prettifyMethod(method) {
  const m = normalize(method);
  if (!m) return '';
  if (m === 'safari') return '';
  if (m === 'single') return 'Single';
  if (m === 'horde') return 'Horde';
  if (m === 'egg') return 'Egg';
  if (m === 'surf') return 'Surf';
  return String(method).trim();
}

function buildShinyInfoText(s) {
  const parts = [];

  if (s && s.sold) parts.push('Sold');
  else if (s && s.lost) parts.push('Lost');

  // Safari must be represented only via the boolean flag, not as a "method" label.
  const methodRaw = s && s.method ? String(s.method) : '';
  const method = prettifyMethod(methodRaw);
  if (method) parts.push(method);

  if (s && s.secret) parts.push('Secret');
  if (s && s.alpha) parts.push('Alpha');
  if (s && s.safari === true) parts.push('Safari');

  if (s && s.run) parts.push('Run');
  if (s && s.favorite) parts.push('Fav');

  const notes = s && s.notes ? String(s.notes).trim() : '';
  const isAuto = notes && notes.toUpperCase().includes('AUTO-GENERATED');
  if (notes && !isAuto) parts.push(notes.slice(0, 28));

  return parts.length ? parts.join(' • ') : '—';
}

function primaryVariantKeyForShiny(s) {
  // Display intent, not data semantics: pick a single highlight.
  if (s && s.alpha) return 'alpha';
  if (s && s.secret) return 'secret';
  if (s && s.safari === true) return 'safari';
  return 'standard';
}

function buildVariantsForShiny(s, infoText) {
  const safari = Boolean(s && s.safari === true);
  const primary = primaryVariantKeyForShiny(s);

  // UnifiedCard forces standard enabled; keep all infoText identical to avoid confusing toggles.
  return [
    { key: 'standard', enabled: true, infoText, active: primary === 'standard' },
    { key: 'secret', enabled: Boolean(s && s.secret), infoText, active: primary === 'secret' },
    { key: 'alpha', enabled: Boolean(s && s.alpha), infoText, active: primary === 'alpha' },
    { key: 'safari', enabled: safari, infoText, active: primary === 'safari' }
  ];
}

function ensureSelectOptions(select, items) {
  if (!select) return;
  if (select.options && select.options.length > 0) return;

  (items || []).forEach(([label, value]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });
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

export function renderShowcaseControls({ sortMode, memberCount, shinyCount, points }) {
  const controls = document.querySelector('.showcase-search-controls');
  if (!controls) return;

  // Do NOT rebuild controls per render. Preserve input focus while typing.
  let input = controls.querySelector('#showcase-search');
  let select = controls.querySelector('#showcase-sort');
  let count = controls.querySelector('#showcase-count');

  if (!input) {
    input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search Member';
    input.id = 'showcase-search';
    controls.appendChild(input);
  }

  if (!select) {
    select = document.createElement('select');
    select.id = 'showcase-sort';
    controls.appendChild(select);
  }

  ensureSelectOptions(select, [
    ['Alphabetical', 'alphabetical'],
    ['Total Shinies', 'shinies'],
    ['Total Points', 'scoreboard']
  ]);

  select.value = sortMode || 'alphabetical';

  if (!count) {
    count = document.createElement('span');
    count.id = 'showcase-count';
    controls.appendChild(count);
  }

  const m = Number(memberCount) || 0;
  const s = Number(shinyCount) || 0;
  const p = Number(points) || 0;

  count.textContent = `${m} Members • ${s} Shinies • ${p}P`;
}

/**
 * Member gallery uses UnifiedCard as a member-card type.
 * Structure mapping:
 * 1) tier emblem -> headerLeftIconSrc
 * 2) name -> pokemonName
 * 3) empty panel -> unified-info (text hidden via CSS)
 * 4) sprite position -> art window
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
    <div class="showcase-root showcase-member-root">
      <div class="showcase-member-topbar">
        <button class="back-btn" id="showcase-back">Back</button>
      </div>

      <div class="member-nameplate" aria-label="Member summary">
        <img class="member-sprite" src="${escapeHtml(member && member.spriteSrc ? member.spriteSrc : 'img/membersprites/examplesprite.png')}" alt="">
        <div class="member-meta">
          <div class="member-name">${escapeHtml(member && member.name ? member.name : '')}</div>
          <div class="member-stats">
            <span class="shiny-count">Active: ${escapeHtml(String(member && member.shinyCount != null ? member.shinyCount : 0))}</span>
            <span class="inactive-count">Lost/Sold: ${escapeHtml(String(member && member.inactiveShinyCount != null ? member.inactiveShinyCount : 0))}</span>
            <span class="point-count">Points: ${escapeHtml(String(member && member.points != null ? member.points : 0))}</span>
          </div>
        </div>
      </div>

      <div class="showcase-search-controls showcase-member-controls" id="member-shiny-controls"></div>

      <div class="showcase-member-body" id="member-shiny-sections"></div>
    </div>
  `;
}

export function renderMemberShinyControls({ search, sortMode, statusMode, variantMode, countText }) {
  const controls = document.getElementById('member-shiny-controls');
  if (!controls) return;

  // Do NOT rebuild controls per render. Preserve input focus while typing.
  let input = controls.querySelector('#member-shiny-search');
  let sort = controls.querySelector('#member-shiny-sort');
  let status = controls.querySelector('#member-shiny-status');
  let variant = controls.querySelector('#member-shiny-variant');
  let count = controls.querySelector('#member-shiny-count');

  if (!input) {
    input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search Pokemon';
    input.id = 'member-shiny-search';
    controls.appendChild(input);
  }
  if (String(input.value) !== String(search || '')) input.value = String(search || '');

  if (!sort) {
    sort = document.createElement('select');
    sort.id = 'member-shiny-sort';
    controls.appendChild(sort);
  }
  ensureSelectOptions(sort, [
    ['Newest', 'newest'],
    ['Dex Order', 'dex'],
    ['A-Z', 'az'],
    ['Points', 'points']
  ]);
  sort.value = sortMode || 'newest';

  if (!status) {
    status = document.createElement('select');
    status.id = 'member-shiny-status';
    controls.appendChild(status);
  }
  ensureSelectOptions(status, [
    ['Active Only', 'active'],
    ['All', 'all'],
    ['Lost/Sold Only', 'inactive']
  ]);
  status.value = statusMode || 'active';

  if (!variant) {
    variant = document.createElement('select');
    variant.id = 'member-shiny-variant';
    controls.appendChild(variant);
  }
  ensureSelectOptions(variant, [
    ['Any Variant', 'any'],
    ['Standard', 'standard'],
    ['Secret', 'secret'],
    ['Alpha', 'alpha'],
    ['Safari', 'safari']
  ]);
  variant.value = variantMode || 'any';

  if (!count) {
    count = document.createElement('span');
    count.id = 'member-shiny-count';
    controls.appendChild(count);
  }
  count.textContent = String(countText || '');
}

export function renderMemberShinySections(sections, pokemonPoints) {
  const body = document.getElementById('member-shiny-sections');
  if (!body) return;

  body.innerHTML = '';

  const secArr = Array.isArray(sections) ? sections : [];

  if (!secArr.length) {
    const empty = document.createElement('div');
    empty.className = 'showcase-empty';
    empty.textContent = 'No shinies found.';
    body.appendChild(empty);
    return;
  }

  secArr.forEach(sec => {
    const entries = Array.isArray(sec && sec.entries) ? sec.entries : [];
    if (!entries.length) return;

    const section = document.createElement('section');
    section.className = 'showcase-section';

    const header = document.createElement('h2');
    header.className = 'showcase-section-title';
    header.textContent = sec.title || '';

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    entries.forEach(s => {
      const pokemonKey = s && s.pokemon ? String(s.pokemon) : '';
      if (!pokemonKey) return;

      const points = Number(pokemonPoints && pokemonPoints[pokemonKey]) || 0;
      const info = buildShinyInfoText(s);

      const html = renderUnifiedCard({
        pokemonKey,
        pokemonName: prettifyPokemonName(pokemonKey),
        artSrc: getPokemonDbShinyGifSrc(pokemonKey),
        points,
        infoText: info,
        isUnclaimed: Boolean(s && (s.lost || s.sold)),
        variants: buildVariantsForShiny(s, info)
      });

      const withClip = s && s.clip ? injectDataAttr(html, 'data-clip', s.clip) : html;
      grid.insertAdjacentHTML('beforeend', withClip);
    });

    section.append(header, grid);
    body.appendChild(section);
  });
}
