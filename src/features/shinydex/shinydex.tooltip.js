// src/features/shinydex/shinydex.tooltip.js
// Owner tooltip binding for Living Dex cards
// No state mutation outside DOM; idempotent per-container binding.

import { prettifyPokemonName } from '../../utils/utils.js';

const BOUND = Symbol('dex_owner_tooltip_bound');

function ensureTooltipEl() {
  let el = document.querySelector('.dex-owner-tooltip');
  if (el) return el;

  el = document.createElement('div');
  el.className = 'dex-owner-tooltip';
  el.innerHTML = `
    <div class="owners-title"></div>
    <div class="owners-list"><div class="scrolling-names"></div></div>
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

  // First place near cursor, then clamp within viewport.
  el.style.left = `${x + pad}px`;
  el.style.top = `${y + pad}px`;

  const rect = el.getBoundingClientRect();
  const left = clamp(x + pad, 8, vw - rect.width - 8);
  const top = clamp(y + pad, 8, vh - rect.height - 8);

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function setTooltipContent(el, pokemonKey, owners) {
  const title = el.querySelector('.owners-title');
  const names = el.querySelector('.scrolling-names');

  const mon = pokemonKey ? prettifyPokemonName(pokemonKey) : '';
  title.textContent = mon ? `Owners — ${mon}` : 'Owners';

  if (!owners || owners.length === 0) {
    names.textContent = 'No owners';
    return;
  }

  // Pre-line is handled by CSS; keep it simple.
  names.textContent = owners.join('\n');
}

export function bindDexOwnerTooltip(container) {
  if (!container || container[BOUND]) return;
  container[BOUND] = true;

  const tooltip = ensureTooltipEl();

  let activeCard = null;

  function show(card, evt) {
    activeCard = card;

    let owners = [];
    try {
      owners = JSON.parse(card.dataset.owners || '[]');
    } catch {
      owners = [];
    }

    setTooltipContent(tooltip, card.dataset.pokemon || '', owners);
    tooltip.classList.add('show');
    positionTooltip(tooltip, evt.clientX, evt.clientY);
  }

  function hide() {
    activeCard = null;
    tooltip.classList.remove('show');
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

  window.addEventListener('scroll', () => {
    if (!activeCard) return;
    tooltip.classList.remove('show');
    activeCard = null;
  }, { passive: true });
}
