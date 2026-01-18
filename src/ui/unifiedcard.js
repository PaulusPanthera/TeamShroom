// src/ui/unifiedcard.js
// v2.0.0-beta
// Unified collector-card renderer (Pokemon + Member cards)
// - Pokemon: header(name+points) + art + info + variants
// - Member:  header(emblem+name+points) + art + empty panel
// DOM-safe: returns a ready-to-append HTMLElement (no HTML strings)

import { tierFromPoints } from './tier-map.js';

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function classForNameLength(name) {
  const n = String(name || '').trim().length;
  if (n >= 18) return 'is-very-long';
  if (n >= 14) return 'is-long';
  return '';
}

function variantIconFor(key) {
  switch (key) {
    case 'secret':
      return 'img/symbols/secretshinysprite.png';
    case 'alpha':
      return 'img/symbols/alphasprite.png';
    case 'safari':
      return 'img/symbols/safarisprite.png';
    case 'standard':
    default:
      return 'img/symbols/singlesprite.png';
  }
}

function normalizeVariants(variants) {
  const base = Array.isArray(variants) ? variants : [];
  const order = ['standard', 'secret', 'alpha', 'safari'];
  const byKey = new Map(base.map(v => [v && v.key, v]));

  return order.map(key => {
    const v = byKey.get(key) || {};
    return {
      key,
      title: v.title || key,
      iconSrc: v.iconSrc || variantIconFor(key),
      enabled: key === 'standard' ? true : Boolean(v.enabled),
      infoText: v.infoText == null ? '' : String(v.infoText),
      active: Boolean(v.active)
    };
  });
}

/**
 * Render a single unified collector-card.
 *
 * @param {object} params
 * @param {'pokemon'|'member'} [params.cardType]
 * @param {string} [params.pokemonKey]
 * @param {string} params.pokemonName
 * @param {string} params.artSrc
 * @param {number|string} params.points
 * @param {string} params.infoText
 * @param {boolean} params.isUnclaimed
 * @param {string[]} [params.owners]
 * @param {object} [params.ownersByVariant]
 * @param {Array<{key:string,title?:string,iconSrc?:string,enabled?:boolean,infoText?:string,active?:boolean}>} [params.variants]
 * @param {boolean} [params.showVariants]
 * @param {string} [params.headerLeftIconSrc] (member emblem)
 * @param {string} [params.headerRightText] (override points chip)
 * @returns {HTMLDivElement}
 */
export function renderUnifiedCard({
  cardType = 'pokemon',
  pokemonKey,
  pokemonName,
  artSrc,
  points,
  infoText,
  isUnclaimed,
  owners,
  ownersByVariant,
  variants,
  showVariants,
  headerLeftIconSrc,
  headerRightText
}) {
  const isMember = cardType === 'member';
  const typeClass = isMember ? 'unified-card--member' : 'unified-card--pokemon';

  const pts = Number(points);
  const defaultPtsText = Number.isFinite(pts) ? `${pts}P` : '';
  const ptsText = headerRightText != null ? String(headerRightText) : defaultPtsText;

  const tierToken = !isMember && Number.isFinite(pts) ? tierFromPoints(pts) : null;
  const tierClass =
    tierToken === 'lm' ? 'tier-lm' : tierToken != null ? `tier-${tierToken}` : '';

  const nameLenClass = classForNameLength(pokemonName);

  const card = document.createElement('div');
  card.className = ['unified-card', typeClass, tierClass, isUnclaimed ? 'is-unclaimed' : '']
    .filter(Boolean)
    .join(' ');

  card.setAttribute('data-unified-card', '');
  card.dataset.name = String(pokemonName || '');

  if (!isMember && pokemonKey != null && String(pokemonKey).trim()) {
    card.dataset.pokemonKey = String(pokemonKey);
  }

  const ownersArr = Array.isArray(owners) ? owners.filter(Boolean).map(String) : [];
  if (ownersArr.length) {
    card.setAttribute('data-owners', JSON.stringify(ownersArr));
  }

  const ownersByVariantObj = ownersByVariant && typeof ownersByVariant === 'object' ? ownersByVariant : null;
  const ownersByVariantPayload = ownersByVariantObj
    ? {
        standard: Array.isArray(ownersByVariantObj.standard) ? ownersByVariantObj.standard.filter(Boolean).map(String) : undefined,
        secret: Array.isArray(ownersByVariantObj.secret) ? ownersByVariantObj.secret.filter(Boolean).map(String) : undefined,
        alpha: Array.isArray(ownersByVariantObj.alpha) ? ownersByVariantObj.alpha.filter(Boolean).map(String) : undefined,
        safari: Array.isArray(ownersByVariantObj.safari) ? ownersByVariantObj.safari.filter(Boolean).map(String) : undefined
      }
    : null;

  const hasOwnersByVariant = ownersByVariantPayload
    ? Object.values(ownersByVariantPayload).some(v => Array.isArray(v) && v.length)
    : false;

  if (hasOwnersByVariant) {
    card.setAttribute('data-owners-by-variant', JSON.stringify(ownersByVariantPayload));
  }

  // Variants: pokemon default ON, member forced OFF
  const variantsEnabled = isMember ? false : showVariants !== false;

  let selectedKey = 'standard';
  let initialInfo = infoText || '';

  let normalizedVariants = null;
  if (variantsEnabled) {
    normalizedVariants = normalizeVariants(variants);

    selectedKey =
      (normalizedVariants.find(v => v.active && v.enabled) ||
        normalizedVariants.find(v => v.key === 'standard'))?.key ||
      'standard';

    const selectedVariant = normalizedVariants.find(v => v.key === selectedKey) || normalizedVariants[0];

    initialInfo =
      (selectedVariant && selectedVariant.infoText) ||
      (infoText || '') ||
      (isUnclaimed ? 'Unclaimed' : '\u2014');
  } else {
    initialInfo = infoText || '';
  }

  card.dataset.selectedVariant = String(selectedKey || 'standard');

  // Header
  const header = document.createElement('div');
  header.className = 'unified-header';

  if (headerLeftIconSrc) {
    const left = document.createElement('div');
    left.className = 'unified-header-left';
    const img = document.createElement('img');
    img.src = String(headerLeftIconSrc);
    img.alt = '';
    left.appendChild(img);
    header.appendChild(left);
  }

  const nameWrap = document.createElement('div');
  nameWrap.className = 'unified-name-wrap';

  const nameEl = document.createElement('div');
  nameEl.className = ['unified-name', nameLenClass].filter(Boolean).join(' ');
  nameEl.textContent = String(pokemonName || '');

  nameWrap.appendChild(nameEl);
  header.appendChild(nameWrap);

  if (ptsText) {
    const value = document.createElement('div');
    value.className = 'unified-value';
    value.setAttribute('aria-label', 'Points');

    const span = document.createElement('span');
    span.className = 'unified-value-text';
    span.textContent = String(ptsText);

    value.appendChild(span);
    header.appendChild(value);
  }

  // Art
  const art = document.createElement('div');
  art.className = 'unified-art';
  art.setAttribute('aria-label', 'Art');

  const artImg = document.createElement('img');
  artImg.src = String(artSrc || '');
  artImg.alt = String(pokemonName || '');
  art.appendChild(artImg);

  // Info
  const info = document.createElement('div');
  info.className = 'unified-info';
  info.setAttribute('aria-label', 'Card info');

  const infoTextEl = document.createElement('div');
  infoTextEl.className = 'unified-info-text';
  infoTextEl.textContent = String(initialInfo || '');

  info.appendChild(infoTextEl);

  card.append(header, art, info);

  // Variants
  if (variantsEnabled && normalizedVariants) {
    const variantsWrap = document.createElement('div');
    variantsWrap.className = 'unified-variants';
    variantsWrap.setAttribute('aria-label', 'Variants');

    normalizedVariants.forEach(v => {
      const isDisabled = !v.enabled;
      const isActive = v.key === selectedKey;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = ['variant-btn', isDisabled ? 'is-disabled' : '', isActive ? 'is-active' : '']
        .filter(Boolean)
        .join(' ');

      btn.setAttribute('data-variant', String(v.key || 'standard'));
      btn.setAttribute('data-info', String(v.infoText || ''));
      btn.setAttribute('aria-label', String(v.title || v.key || 'Variant'));

      const icon = document.createElement('img');
      icon.className = 'variant-icon';
      icon.src = String(v.iconSrc || '');
      icon.alt = '';

      btn.appendChild(icon);
      variantsWrap.appendChild(btn);
    });

    card.appendChild(variantsWrap);
  }

  return card;
}

/**
 * One-time event delegation to switch card variants.
 * Updates the info panel text based on the clicked button's data-info.
 */
export function bindUnifiedCardVariantSwitching(root = document) {
  if (!root || root.__unifiedCardVariantBound) return;
  root.__unifiedCardVariantBound = true;

  root.addEventListener('click', e => {
    const btn = e.target && typeof e.target.closest === 'function' ? e.target.closest('.variant-btn') : null;
    if (!btn) return;
    if (btn.classList.contains('is-disabled')) return;

    const card = btn.closest('.unified-card');
    if (!card) return;

    const variant = btn.getAttribute('data-variant') || 'standard';
    card.setAttribute('data-selected-variant', variant);

    card.querySelectorAll('.variant-btn').forEach(b => b.classList.toggle('is-active', b === btn));

    const info = btn.getAttribute('data-info') || '';
    const infoEl = card.querySelector('.unified-info-text');
    if (infoEl) infoEl.textContent = info || (card.classList.contains('is-unclaimed') ? 'Unclaimed' : '\u2014');

    card.dispatchEvent(new CustomEvent('card:variant', { bubbles: true, detail: { variant } }));
  });
}
