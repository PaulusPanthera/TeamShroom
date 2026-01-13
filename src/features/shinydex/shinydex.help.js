// v2.0.0-alpha.1
// src/features/shinydex/shinydex.help.js
// Shiny Dex Help — questionmark button + tooltip
// Runtime-only. Never throws.

function ensureHelpTooltip() {
  var el = document.querySelector('.dex-help-tooltip');
  if (el) return el;

  el = document.createElement('div');
  el.className = 'dex-help-tooltip';
  el.style.position = 'fixed';
  el.style.zIndex = '9999';
  el.style.maxWidth = '520px';
  el.style.padding = '14px 16px';
  el.style.background = 'var(--bg-panel)';
  el.style.color = 'var(--text-main)';
  el.style.border = 'var(--border-soft)';
  el.style.borderRadius = '12px';
  el.style.boxShadow = 'var(--shadow-depth)';
  el.style.fontFamily = "'Press Start 2P', monospace";
  el.style.fontSize = 'var(--font-card-stat)';
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  el.style.transition = 'opacity 0.15s ease';

  document.body.appendChild(el);
  return el;
}

function setPos(el, anchorEl) {
  var rect = anchorEl.getBoundingClientRect();
  var pad = 10;

  var left = rect.left;
  var top = rect.bottom + pad;

  // keep within viewport
  var vw = window.innerWidth || 0;
  var vh = window.innerHeight || 0;

  // measure
  el.style.left = '0px';
  el.style.top = '0px';
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  el.style.display = 'block';

  var w = el.offsetWidth || 320;
  var h = el.offsetHeight || 140;

  if (left + w + pad > vw) left = Math.max(pad, vw - w - pad);
  if (top + h + pad > vh) top = Math.max(pad, rect.top - h - pad);

  el.style.left = Math.max(pad, left) + 'px';
  el.style.top = Math.max(pad, top) + 'px';
}

function show(el) {
  el.style.opacity = '1';
  el.style.pointerEvents = 'auto';
}

function hide(el) {
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
}

function findHelpButton(root) {
  var scope = root || document;

  // supported selectors (controller can use any)
  return (
    scope.querySelector('#dex-help') ||
    scope.querySelector('#dex-help-btn') ||
    scope.querySelector('.dex-help-btn') ||
    scope.querySelector('[data-dex-help]')
  );
}

function buildHelpHtml() {
  // Slim + readable
  return (
    '<div style="color:var(--accent);letter-spacing:1px;margin-bottom:8px;">Search Help</div>' +
    '<div style="line-height:1.6;color:var(--text-main);">' +
      '<div><span style="color:var(--accent);">Pokémon:</span> type a name (partial ok)</div>' +
      '<div><span style="color:var(--accent);">Family:</span> <b>+name</b> or <b>name+</b></div>' +
      '<div><span style="color:var(--accent);">Member:</span> <b>@name</b> (Hitlist: claimed-by • LivingDex: owners)</div>' +
      '<div><span style="color:var(--accent);">Region:</span> <b>r:k</b> / <b>r:kan</b> / <b>region:un</b></div>' +
      '<div><span style="color:var(--accent);">Tier:</span> <b>tier:0</b> <b>tier:1</b> <b>tier:2</b> … <b>tier:lm</b></div>' +
      '<div><span style="color:var(--accent);">Flags:</span> <b>unclaimed</b> / <b>claimed</b> • <b>unowned</b> / <b>owned</b></div>' +
    '</div>'
  );
}

export function bindShinyDexHelp(root) {
  var btn = findHelpButton(root);
  if (!btn) return;

  var tooltip = ensureHelpTooltip();
  tooltip.innerHTML = buildHelpHtml();

  var open = false;

  function setActive(on) {
    // works with your existing "active" style if you have it
    if (on) btn.classList.add('active');
    else btn.classList.remove('active');
  }

  function openTip() {
    open = true;
    setActive(true);
    setPos(tooltip, btn);
    show(tooltip);
  }

  function closeTip() {
    open = false;
    setActive(false);
    hide(tooltip);
  }

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (open) closeTip();
    else openTip();
  });

  document.addEventListener('click', function () {
    if (!open) return;
    closeTip();
  });

  window.addEventListener('resize', function () {
    if (!open) return;
    setPos(tooltip, btn);
  });

  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') closeTip();
  });

  // prevent tooltip click from closing immediately
  tooltip.addEventListener('click', function (e) {
    e.stopPropagation();
  });
}

// Back-compat alias (if controller imports this name)
export function setupShinyDexHelp(root) {
  return bindShinyDexHelp(root);
}
