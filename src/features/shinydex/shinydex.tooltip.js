// v2.0.0-alpha.1
// src/features/shinydex/shinydex.tooltip.js
// Owner tooltip binding for Living Dex cards
// Paged rotation (no scrolling). Idempotent per-container binding.

import { prettifyPokemonName } from '../../utils/utils.js';

const BOUND = Symbol('dex_owner_tooltip_bound');

function ensureTooltipEl() {
  let el = document.querySelector('.dex-owner-tooltip');
  if (el) return el;

  el = document.createElement('div');
  el.className = 'dex-owner-tooltip';
  el.innerHTML = `
    <div class="owners-title"></div>
    <div class="owners-list">
      <div class="owners-pages"></div>
    </div>
  `;
  document.body.appendChild(el);
  return el;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function positionTooltip(el, x, y) {
  const pad = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  el.style.left = `${x + pad}px`;
  el.style.top = `${y + pad}px`;

  const rect = el.getBoundingClientRect();
  const left = clamp(x + pad, 8, vw - rect.width - 8);
  const top = clamp(y + pad, 8, vh - rect.height - 8);

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function uniqPreserveOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const k = String(v);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function buildPages(owners, pageSize) {
  const pages = [];
  for (let i = 0; i < owners.length; i += pageSize) {
    pages.push(owners.slice(i, i + pageSize));
  }
  return pages;
}

function setTooltipTitle(el, pokemonKey) {
  const title = el.querySelector('.owners-title');
  const mon = pokemonKey ? prettifyPokemonName(pokemonKey) : '';
  title.textContent = mon ? `Owners — ${mon}` : 'Owners';
}

function setTooltipPage(el, pageLines, remainder) {
  const box = el.querySelector('.owners-pages');

  const lines = [...pageLines];
  if (remainder > 0 && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1]}  (+${remainder} more)`;
  } else if (lines.length === 0) {
    lines.push('No owners');
  }

  box.textContent = lines.join('\n');
}

export function bindDexOwnerTooltip(container) {
  if (!container || container[BOUND]) return;
  container[BOUND] = true;

  const tooltip = ensureTooltipEl();

  let activeCard = null;
  let rotTimer = null;
  let pageIndex = 0;
  let pages = [];
  let pageSize = 8;

  function stopRotation() {
    if (rotTimer) {
      clearInterval(rotTimer);
      rotTimer = null;
    }
  }

  function startRotation(totalOwners) {
    stopRotation();

    if (pages.length <= 1) return;

    // readable pacing
    rotTimer = setInterval(() => {
      const box = tooltip.querySelector('.owners-pages');
      box.classList.add('fade');

      window.setTimeout(() => {
        pageIndex = (pageIndex + 1) % pages.length;

        const shownCount = (pageIndex + 1) * pageSize;
        const remainder = Math.max(0, totalOwners - shownCount);

        setTooltipPage(tooltip, pages[pageIndex], remainder);
        box.classList.remove('fade');
      }, 140);
    }, 2800);
  }

  function show(card, evt) {
    activeCard = card;

    let owners = [];
    try {
      owners = JSON.parse(card.dataset.owners || '[]');
    } catch {
      owners = [];
    }

    owners = uniqPreserveOrder(Array.isArray(owners) ? owners : []);
    setTooltipTitle(tooltip, card.dataset.pokemon || '');

    pageIndex = 0;
    pages = buildPages(owners, pageSize);

    const remainder = Math.max(0, owners.length - pageSize);
    setTooltipPage(tooltip, pages[0] || [], remainder);

    tooltip.classList.add('show');
    positionTooltip(tooltip, evt.clientX, evt.clientY);

    startRotation(owners.length);
  }

  function hide() {
    activeCard = null;
    tooltip.classList.remove('show');
    stopRotation();
  }

  container.addEventListener('mouseover', evt => {
    const card = evt.target.closest('.unified-card[data-owners][data-pokemon]');
    if (!card || !container.contains(card)) return;
    show(card, evt);
  });

  container.addEventListener('mousemove', evt => {
    if (!activeCard) return;
    positionTooltip(tooltip, evt.clientX, evt.clientY);
  });

  container.addEventListener('mouseout', evt => {
    if (!activeCard) return;
    const to = evt.relatedTarget;
    if (to && activeCard.contains(to)) return;
    hide();
  });

  window.addEventListener(
    'scroll',
    () => {
      if (!activeCard) return;
      hide();
    },
    { passive: true }
  );
}
