// src/ui/unifiedcard.js
// Unified Card Renderer — template layout (name lower + big status box)

export function renderUnifiedCard({
  name,
  img,
  info = '',             // kept for compatibility, not used as primary name display now
  cardType = '',

  unclaimed = false,
  unowned = false,
  lost = false,
  highlighted = false,

  tier,                  // 'lm' | '0'...'6'
  owners,                // string[] optional for owner tooltip
  clip,

  // variant system:
  // base claim always exists; variants optionally exist: alpha/secret/safari
  variants = {
    base: { label: '', icons: {} },
    alpha: null,
    secret: null,
    safari: null
  },

  // initial variant to display
  activeVariant = 'base'
}) {
  const isNeg = !!(unclaimed || unowned);

  const classes = [
    'unified-card',
    isNeg && (unclaimed ? 'is-unclaimed' : 'is-unowned'),
    lost && 'is-lost',
    highlighted && 'is-highlighted'
  ].filter(Boolean).join(' ');

  let attrs = `
    class="${classes}"
    data-card-type="${escapeAttr(cardType)}"
    data-name="${escapeAttr(name)}"
    data-variant="${escapeAttr(activeVariant)}"
  `;

  if (tier != null && String(tier).trim() !== '') {
    attrs += ` data-tier="${escapeAttr(String(tier).toLowerCase())}"`;
  }
  if (clip) attrs += ` data-clip="${escapeAttr(clip)}"`;
  if (Array.isArray(owners) && owners.length) {
    attrs += ` data-owners="${escapeAttr(JSON.stringify(owners))}"`;
  }

  const tierLabel = tier != null && String(tier).trim() !== '' ? String(tier).toUpperCase() : '';

  const v = normalizeVariants(variants);
  const current = v[activeVariant] || v.base;

  const availableKeys = Object.keys(v).filter(k => k !== 'base' && v[k]);
  const cycleOrder = ['base', ...availableKeys];

  // status icons shown in slot; active state depends on variant key
  const statusIcons = renderStatusIcons(activeVariant, v);

  return `
    <div ${attrs} data-variant-cycle="${escapeAttr(JSON.stringify(cycleOrder))}">
      <div class="unified-header">
        <span class="tier-badge" aria-hidden="true">${escapeHtml(tierLabel)}</span>
        <div class="symbol-strip" aria-hidden="true">
          ${renderHeaderSymbols(current)}
        </div>
      </div>

      <div class="unified-art">
        <img class="unified-img" src="${img}" alt="${escapeAttr(name)}">
      </div>

      <div class="status-slot" tabindex="0" role="button" aria-label="Switch card variant">
        <span class="status-pill" title="${escapeAttr(current.label || '')}">
          ${escapeHtml(current.label || 'STANDARD')}
        </span>
        ${statusIcons}
      </div>

      <div class="name-box">
        <span class="unified-name" title="${escapeAttr(name)}">${escapeHtml(name)}</span>
      </div>
    </div>
  `;
}

function normalizeVariants(variants) {
  const base = variants?.base || { label: 'STANDARD', icons: {} };
  return {
    base: { label: base.label || 'STANDARD', icons: base.icons || {} },
    alpha: variants?.alpha || null,
    secret: variants?.secret || null,
    safari: variants?.safari || null
  };
}

function renderHeaderSymbols(currentVariant) {
  // keep header strip minimal; leave it for "weird symbols" you already use
  // this function can be wired later to your existing symbol set
  return '';
}

function renderStatusIcons(activeKey, variants) {
  // show the three variant icons if that variant exists
  // icons are "wired symbols on the card"
  const exists = {
    alpha: !!variants.alpha,
    secret: !!variants.secret,
    safari: !!variants.safari
  };

  const icon = (key, file) => {
    if (!exists[key]) return '';
    const on = activeKey === key ? 'is-active' : '';
    return `<img class="status-icon ${on}" src="img/symbols/${file}" alt="${key}">`;
  };

  return `
    ${icon('alpha', 'alphasprite.png')}
    ${icon('secret', 'secretshinysprite.png')}
    ${icon('safari', 'safarisprite.png')}
  `;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
