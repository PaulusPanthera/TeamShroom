// v2.0.0-alpha.1
// src/features/shinydex/shinydex.help.js
// Shiny Dex Help Tooltip — UI ONLY

const HELP_TOOLTIP_ID = 'dex-help-tooltip';

function getOrCreateHelpTooltip() {
  let el = document.getElementById(HELP_TOOLTIP_ID);
  if (el) return el;

  el = document.createElement('div');
  el.id = HELP_TOOLTIP_ID;
  el.className = 'dex-help-tooltip';

  el.innerHTML = `
    <div class="help-title">Search Help</div>
    <div class="help-lines"></div>
  `;

  document.body.appendChild(el);
  return el;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function positionNearButton(tooltip, btn) {
  const pad = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const r = btn.getBoundingClientRect();

  tooltip.style.left = '0px';
  tooltip.style.top = '0px';

  // Force layout
  const tr = tooltip.getBoundingClientRect();
  const w = tr.width || 420;
  const h = tr.height || 180;

  // Prefer below-right, fallback within viewport
  const x = clamp(r.left, pad, vw - w - pad);
  const y = clamp(r.bottom + 10, pad, vh - h - pad);

  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

const HELP_TEXT =
`Pokémon: type a name (partial ok)
Family: +name  or  name+
Member: @name (Hitlist: claimed-by • LivingDex: owners)
Region: r:k  /  r:kan  /  region:un
Tier: tier:0  tier:1  tier:2 ... tier:lm
Flags: unclaimed / claimed  •  unowned / owned`;

export function setupDexHelpTooltip(rootEl) {
  const root = rootEl || document;
  const tooltip = getOrCreateHelpTooltip();

  const btn =
    root.getElementById
      ? (root.getElementById('dex-help') || root.querySelector('.dex-help-btn'))
      : null;

  if (!btn) return;

  const lines = tooltip.querySelector('.help-lines');
  lines.textContent = HELP_TEXT;

  let open = false;

  function show() {
    open = true;
    btn.classList.add('active');
    tooltip.classList.add('show');
    positionNearButton(tooltip, btn);
  }

  function hide() {
    open = false;
    btn.classList.remove('active');
    tooltip.classList.remove('show');
  }

  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    open ? hide() : show();
  });

  window.addEventListener('resize', () => {
    if (!open) return;
    positionNearButton(tooltip, btn);
  });

  document.addEventListener('mousedown', e => {
    if (!open) return;
    const t = e.target;
    if (btn.contains(t) || tooltip.contains(t)) return;
    hide();
  }, true);

  return { show, hide };
}

// Back-compat alias (safe to call)
export function initDexHelpTooltip(rootEl) {
  return setupDexHelpTooltip(rootEl);
}
