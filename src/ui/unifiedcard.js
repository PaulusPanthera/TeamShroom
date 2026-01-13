// v3.1.0
// src/ui/unifiedcard.js
// Unified collector-card renderer (Hitlist + Living Dex)
// - Header: name (left) + points (right)
// - Art window narrower than header
// - Info plate above
// - Variant row (STD/Secret/Alpha/Safari) at bottom
// - Variant switching changes the info plate text

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
    case 'secret': return 'img/symbols/secretshinysprite.png';
    case 'alpha': return 'img/symbols/alphasprite.png';
    case 'safari': return 'img/symbols/safarisprite.png';
    case 'standard':
    default: return 'img/symbols/singlesprite.png';
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
 * @param {string} params.pokemonName
 * @param {string} params.artSrc
 * @param {number|string} params.points
 * @param {string} params.infoText
 * @param {boolean} params.isUnclaimed
 * @param {string[]} [params.owners] Owners list for tooltip (optional)
 * @param {Array<{key:string,title?:string,iconSrc?:string,enabled?:boolean,infoText?:string,active?:boolean}>} params.variants
 */
export function renderUnifiedCard({
  pokemonName,
  artSrc,
  points,
  infoText,
  isUnclaimed,
  owners,
  variants
}) {
  const safeName = escapeHtml(pokemonName || '');
  const pts = Number(points);
  const ptsText = Number.isFinite(pts) ? String(pts) : '';

  const tierToken = tierFromPoints(pts);
  const tierClass = tierToken === 'lm' ? 'tier-lm' : `tier-${tierToken}`;
  const nameLenClass = classForNameLength(pokemonName);

  const normalizedVariants = normalizeVariants(variants);
  const selectedKey =
    (normalizedVariants.find(v => v.active && v.enabled) ||
      normalizedVariants.find(v => v.key === 'standard'))?.key ||
    'standard';

  const selectedVariant = normalizedVariants.find(v => v.key === selectedKey) || normalizedVariants[0];

  const initialInfo =
    (selectedVariant && selectedVariant.infoText) ||
    (infoText || '') ||
    (isUnclaimed ? 'Unclaimed' : '—');

  const ownersArr = Array.isArray(owners) ? owners.filter(Boolean).map(String) : [];
  const ownersAttr = ownersArr.length ? ` data-owners="${escapeHtml(JSON.stringify(ownersArr))}"` : '';

  const variantButtons = normalizedVariants
    .map(v => {
      const isDisabled = !v.enabled;
      const isActive = v.key === selectedKey;
      const cls = ['variant-btn', isDisabled ? 'is-disabled' : '', isActive ? 'is-active' : '']
        .filter(Boolean)
        .join(' ');

      return `
        <button
          type="button"
          class="${cls}"
          data-variant="${escapeHtml(v.key)}"
          data-info="${escapeHtml(v.infoText || '')}"
          aria-label="${escapeHtml(v.title || v.key)}"
        >
          <img class="variant-icon" src="${escapeHtml(v.iconSrc)}" alt="">
        </button>
      `;
    })
    .join('');

  return `
    <div class="unified-card ${tierClass} ${isUnclaimed ? 'is-unclaimed' : ''}"
         data-unified-card
         data-name="${safeName}"
         data-selected-variant="${escapeHtml(selectedKey)}"${ownersAttr}>
      <div class="unified-header">
        <div class="unified-name-wrap">
          <div class="unified-name ${nameLenClass}" title="${safeName}">${safeName}</div>
        </div>
        <div class="unified-value" aria-label="Points">
          <span class="unified-value-number">${escapeHtml(ptsText)}</span>
          <span class="unified-value-suffix">PTS</span>
        </div>
      </div>

      <div class="unified-art" aria-label="Art">
        <img src="${escapeHtml(artSrc || '')}" alt="${safeName}">
      </div>

      <div class="unified-info" aria-label="Card info">
        <div class="unified-info-text">${escapeHtml(initialInfo)}</div>
      </div>

      <div class="unified-variants" aria-label="Variants">
        ${variantButtons}
      </div>
    </div>
  `;
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
    if (infoEl) infoEl.textContent = info || (card.classList.contains('is-unclaimed') ? 'Unclaimed' : '—');

    card.dispatchEvent(new CustomEvent('card:variant', { bubbles: true, detail: { variant } }));
  });
}
