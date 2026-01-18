// src/ui/weekly-pokemon-card.js
// v2.0.0-beta
// ShinyWeekly-style Pokemon card renderer (shared between Weekly and Home widgets)

import { tierFromPoints } from './tier-map.js';
import { prettifyPokemonName, getPokemonDbShinyGifSrc } from '../utils/utils.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
}

function normalize(str) {
  return String(str || '').trim().toLowerCase();
}

function classForNameLength(name) {
  const n = String(name || '').trim().length;
  if (n >= 18) return 'is-very-long';
  if (n >= 14) return 'is-long';
  return '';
}

function getPokemonPoints(pokemonPointsMap, pokemonKey) {
  const key = normalize(pokemonKey);
  if (!key) return 0;
  const map = pokemonPointsMap && typeof pokemonPointsMap === 'object' ? pokemonPointsMap : {};
  const v = Object.prototype.hasOwnProperty.call(map, key) ? map[key] : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseEncounter(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;

  const s = String(raw).trim();
  if (!s) return null;

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function prettifyMethod(method) {
  const m = normalize(method);
  if (!m) return '';
  if (m === 'single') return 'Single';
  if (m === 'horde') return 'Horde';
  if (m === 'egg') return 'Egg';
  if (m === 'surf') return 'Surf';
  if (m === 'safari') return 'Safari';
  return String(method).trim();
}

function getPokemonInfoText(mon) {
  if (!mon) return 'Enc: —';

  const encounter = parseEncounter(mon.encounter);
  if (encounter != null) return `Enc: ${encounter}`;

  const method = prettifyMethod(mon.method);
  if (method) return `Enc: ${method}`;

  return 'Enc: —';
}

/**
 * Render a Pokemon card using ShinyWeekly visual rules.
 * Uses the shared card CSS classes (unified-card--) so it matches Weekly.
 */
export function renderWeeklyPokemonCard(mon, pokemonPointsMap, { signal } = {}) {
  const pokemonKey = String((mon && mon.pokemon) || '');
  const pokemonName = prettifyPokemonName(pokemonKey);

  const points = getPokemonPoints(pokemonPointsMap, pokemonKey);
  const tierToken = tierFromPoints(points);
  const tierClass = tierToken === 'lm' ? 'tier-lm' : `tier-${tierToken}`;

  const card = document.createElement('div');
  card.className = ['unified-card', 'unified-card--pokemon', tierClass, mon && (mon.lost || mon.run) ? 'is-unclaimed' : '']
    .filter(Boolean)
    .join(' ');

  // Header
  const header = el('div', 'unified-header');

  const nameWrap = el('div', 'unified-name-wrap');
  const nameEl = el('div', ['unified-name', classForNameLength(pokemonName)].filter(Boolean).join(' '), pokemonName);
  nameWrap.appendChild(nameEl);
  header.appendChild(nameWrap);

  if (Number.isFinite(points) && points > 0) {
    const value = el('div', 'unified-value');
    value.setAttribute('aria-label', 'Points');

    const span = el('span', 'unified-value-text', `${points}P`);
    value.appendChild(span);
    header.appendChild(value);
  }

  // Art
  const art = el('div', 'unified-art');
  art.setAttribute('aria-label', 'Art');

  const artImg = document.createElement('img');
  artImg.alt = pokemonName;
  artImg.loading = 'lazy';
  artImg.src = getPokemonDbShinyGifSrc(pokemonKey);

  artImg.addEventListener(
    'error',
    () => {
      artImg.src = 'img/symbols/questionmarksprite.png';
    },
    { signal }
  );

  art.appendChild(artImg);

  // Info
  const info = el('div', 'unified-info');
  info.setAttribute('aria-label', 'Card info');

  const infoTextEl = el('div', 'unified-info-text', getPokemonInfoText(mon));
  info.appendChild(infoTextEl);

  card.append(header, art, info);

  // Variants (static indicators)
  const variants = el('div', 'unified-variants');
  variants.setAttribute('aria-label', 'Variants');

  const flags = {
    standard: true,
    secret: Boolean(mon && mon.secret),
    alpha: Boolean(mon && mon.alpha),
    safari: Boolean(mon && mon.safari)
  };

  const order = [
    { key: 'standard', iconSrc: 'img/symbols/singlesprite.png' },
    { key: 'secret', iconSrc: 'img/symbols/secretshinysprite.png' },
    { key: 'alpha', iconSrc: 'img/symbols/alphasprite.png' },
    { key: 'safari', iconSrc: 'img/symbols/safarisprite.png' }
  ];

  order.forEach((v) => {
    const active = Boolean(flags[v.key]);
    const btn = el('div', ['variant-btn', active ? 'is-active' : 'is-disabled'].join(' '));

    const icon = document.createElement('img');
    icon.src = v.iconSrc;
    icon.alt = '';
    btn.appendChild(icon);
    variants.appendChild(btn);
  });

  card.appendChild(variants);

  return card;
}
