// v2.0.0-alpha.2
// src/ui/unifiedcard.js
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
  symbols = {},           // { secret, alpha, run, favorite, clip, safari, egg, event, ... }
  clip,
  owners,                 // string[] (optional) -> data-owners for tooltip
  tier                    // 'lm' | '0'...'6' (optional)
}) {
  const classes = [
    'unified-card',
    unclaimed && 'is-unclaimed',
    lost && 'is-lost',
    highlighted && 'is-highlighted'
  ]
    .filter(Boolean)
    .join(' ');

  let attributes = `
    class="${classes}"
    data-card-type="${cardType || ''}"
    data-name="${escapeAttr(name)}"
  `;

  if (clip) {
    attributes += ` data-clip="${escapeAttr(clip)}"`;
  }

  if (tier != null && String(tier).trim() !== '') {
    attributes += ` data-tier="${escapeAttr(String(tier).toLowerCase())}"`;
  }

  if (Array.isArray(owners) && owners.length) {
    attributes += ` data-owners="${escapeAttr(JSON.stringify(owners))}"`;
  }

  const symbolMap = {
    // status
    secret: 'secretshinysprite.png',
    alpha: 'alphasprite.png',
    clip: 'clipsprite.png',

    // methods
    mpb: 'mpbsprite.png',
    mgb: 'mgbsprite.png',
    mub: 'mubsprite.png',
    mcb: 'mcbsprite.png',
    mdb: 'mdbsprite.png',
    egg: 'eggsprite.png',
    safari: 'safarisprite.png',
    single: 'singlesprite.png',
    swarm: 'swarmsprite.png',
    raid: 'raidsprite.png',
    fishing: 'fishingsprite.png',
    headbutt: 'headbuttsprite.png',
    rocksmash: 'rocksmashsprite.png',
    honeytree: 'honeytreesprite.png',
    event: 'eventsprite.png'
  };

  const symbolHtml = Object.entries(symbols)
    .filter(([, enabled]) => enabled)
    .map(([key]) =>
      symbolMap[key]
        ? `
          <img
            class="symbol ${key}"
            src="img/symbols/${symbolMap[key]}"
            alt="${key}"
          >
        `
        : ''
    )
    .join('');

  const overlay = symbolHtml
    ? `<div class="symbol-overlay">${symbolHtml}</div>`
    : '';

  return `
    <div ${attributes}>
      ${overlay}
      <span class="unified-name">${name}</span>
      <img class="unified-img" src="${img}" alt="${name}">
      <div class="unified-status" aria-hidden="true"></div>
      <span class="unified-info">${info}</span>
    </div>
  `;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
