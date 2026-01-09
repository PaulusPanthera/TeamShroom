// unifiedcard.js
// Unified Card Renderer — Design System v1
// Structure is fixed. State is declarative.

export function renderUnifiedCard({
  name,
  img,
  info = '',
  cardType,               // 'member' | 'pokemon'
  states = {},            // { member, pokemon, lost, unclaimed, highlighted, compact }
  symbols = {},           // { secret, event, safari, egg, alpha, clip }
  clip
}) {
  /* -------------------------------------------------------
     STATE CLASSES
  ------------------------------------------------------- */

  const stateClasses = [
    'unified-card',
    states.member && 'is-member',
    states.pokemon && 'is-pokemon',
    states.unclaimed && 'is-unclaimed',
    states.lost && 'is-lost',
    states.highlighted && 'is-highlighted',
    states.compact && 'is-compact'
  ].filter(Boolean).join(' ');

  /* -------------------------------------------------------
     DATA ATTRIBUTES
  ------------------------------------------------------- */

  let attributes = `
    class="${stateClasses}"
    data-card-type="${cardType}"
    data-name="${escapeAttr(name)}"
  `;

  if (clip) {
    attributes += ` data-clip="${escapeAttr(clip)}"`;
  }

  /* -------------------------------------------------------
     SYMBOL OVERLAY
  ------------------------------------------------------- */

  const symbolMap = {
    secret: 'secretshinysprite.png',
    event: 'eventsprite.png',
    safari: 'safarisprite.png',
    egg: 'eggsprite.png',
    alpha: 'alphasprite.png',
    clip: 'clipsprite.png'
  };

  const symbolHtml = Object.entries(symbols)
    .filter(([, enabled]) => enabled)
    .map(([key]) => `
      <img
        class="symbol ${key}"
        src="img/symbols/${symbolMap[key]}"
        alt="${key}"
      >
    `)
    .join('');

  const overlay = symbolHtml
    ? `<div class="symbol-overlay">${symbolHtml}</div>`
    : '';

  /* -------------------------------------------------------
     NAME SIZE LOGIC
  ------------------------------------------------------- */

  let nameClass = 'unified-name';
  if (name.length > 13) nameClass += ' long-name';
  if (name.length > 16) nameClass += ' very-long-name';

  /* -------------------------------------------------------
     OUTPUT
  ------------------------------------------------------- */

  return `
    <div ${attributes}>
      ${overlay}
      <span class="${nameClass}">${name}</span>
      <img class="unified-img" src="${img}" alt="${name}">
      <span class="unified-info">${info}</span>
    </div>
  `;
}

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
