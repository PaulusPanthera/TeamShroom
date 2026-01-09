// unifiedcard.js
// Unified Card Renderer — HARD CONTRACT
// Structure and size are immutable

export function renderUnifiedCard({
  name,
  img,
  info = '',
  cardType,               // 'member' | 'pokemon'
  unclaimed = false,
  lost = false,
  highlighted = false,
  symbols = {},           // { secret, event, safari, egg, alpha, clip }
  clip
}) {
  /* -------------------------------------------------------
     CLASS LIST — MUST MATCH CSS EXACTLY
  ------------------------------------------------------- */

  const classes = [
    'unified-card',
    unclaimed && 'unclaimed',
    lost && 'lost',
    highlighted && 'highlighted'
  ].filter(Boolean).join(' ');

  /* -------------------------------------------------------
     ATTRIBUTES
  ------------------------------------------------------- */

  let attributes = `
    class="${classes}"
    data-card-type="${cardType || ''}"
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
     OUTPUT — ORDER IS FIXED
  ------------------------------------------------------- */

  return `
    <div ${attributes}>
      ${overlay}
      <span class="unified-name">${name}</span>
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
