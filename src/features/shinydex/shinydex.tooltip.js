// v2.0.0-alpha.1
// src/features/shinydex/shinydex.tooltip.js
// Dex Owner Tooltip — hover + paged owners list + freeze mode
// Runtime-only. Never throws.

function ensureTooltipEl() {
  var el = document.querySelector('.dex-owner-tooltip');
  if (el) return el;

  el = document.createElement('div');
  el.className = 'dex-owner-tooltip';
  el.innerHTML =
    '<div class="owners-title"></div>' +
    '<div class="owners-list"></div>' +
    '<div class="owners-footer" style="margin-top:8px;text-align:center;opacity:0.75;display:none;"></div>';

  document.body.appendChild(el);
  return el;
}

function parseOwnersFromCard(card) {
  // Supports:
  // - data-owners="A,B,C"
  // - data-owners="A|B|C"
  // - data-owners='["A","B","C"]'
  // - data-owners="A B C" (fallback split by whitespace)
  var raw =
    (card && card.getAttribute && card.getAttribute('data-owners')) || '';

  raw = String(raw || '').trim();
  if (!raw) return [];

  // JSON array
  if (raw.charAt(0) === '[') {
    try {
      var arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr
          .map(function (x) { return String(x || '').trim(); })
          .filter(Boolean);
      }
    } catch (_e) {}
  }

  // Delimiters
  var parts;
  if (raw.indexOf('|') !== -1) parts = raw.split('|');
  else if (raw.indexOf(',') !== -1) parts = raw.split(',');
  else parts = raw.split(/\s+/);

  return parts
    .map(function (x) { return String(x || '').trim(); })
    .filter(Boolean);
}

function chunk(arr, size) {
  var out = [];
  for (var i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function clamp(n, a, b) {
  if (n < a) return a;
  if (n > b) return b;
  return n;
}

function setTooltipPos(el, x, y) {
  // keep on-screen-ish
  var pad = 14;
  var w = el.offsetWidth || 260;
  var h = el.offsetHeight || 120;

  var vx = window.innerWidth || 0;
  var vy = window.innerHeight || 0;

  var left = clamp(x + 14, pad, Math.max(pad, vx - w - pad));
  var top = clamp(y + 14, pad, Math.max(pad, vy - h - pad));

  el.style.left = left + 'px';
  el.style.top = top + 'px';
}

export function bindDexOwnerTooltip(root) {
  var scope = root || document;
  var tooltip = ensureTooltipEl();

  var state = {
    visible: false,
    frozen: false,
    owners: [],
    pages: [],
    pageIndex: 0,
    timer: null,
    lastCard: null,
    lastX: 0,
    lastY: 0
  };

  function clearTimer() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function startTimer() {
    clearTimer();
    if (state.frozen) return;
    if (!state.pages || state.pages.length <= 1) return;

    // 3s per page
    state.timer = setInterval(function () {
      state.pageIndex = (state.pageIndex + 1) % state.pages.length;
      render();
    }, 3000);
  }

  function render() {
    if (!state.visible) return;

    var titleEl = tooltip.querySelector('.owners-title');
    var listEl = tooltip.querySelector('.owners-list');
    var footEl = tooltip.querySelector('.owners-footer');

    var pokeName = '';
    if (state.lastCard) {
      pokeName = state.lastCard.getAttribute('data-name') || '';
    }

    titleEl.textContent = 'Owners — ' + (pokeName || 'Unknown');

    var pageTotal = state.pages.length || 0;
    var idx = clamp(state.pageIndex, 0, Math.max(0, pageTotal - 1));
    var current = pageTotal ? state.pages[idx] : [];

    // list: one name per line
    var lines = current.join('\n');
    listEl.innerHTML =
      '<div class="scrolling-names" style="position:relative;inset:auto;animation:none;white-space:pre-line;">' +
      escapeHtml(lines) +
      '</div>';

    // footer: page indicator + freeze hint / next button
    if (pageTotal > 1) {
      footEl.style.display = 'block';

      if (state.frozen) {
        footEl.innerHTML =
          '<div style="margin-bottom:6px;">' +
          'Page ' + (idx + 1) + '/' + pageTotal +
          '</div>' +
          '<button class="owners-next-btn" style="font:inherit;padding:6px 10px;border-radius:8px;cursor:pointer;">Next</button>' +
          '<div style="margin-top:6px;opacity:0.7;">(Click tooltip to unfreeze)</div>';
      } else {
        footEl.innerHTML =
          'Page ' + (idx + 1) + '/' + pageTotal +
          ' • (Click to freeze)';
      }
    } else {
      footEl.style.display = 'none';
      footEl.textContent = '';
    }

    setTooltipPos(tooltip, state.lastX, state.lastY);
  }

  function show(card, x, y) {
    var owners = parseOwnersFromCard(card);

    // no owners -> no tooltip
    if (!owners.length) {
      hide();
      return;
    }

    state.visible = true;
    state.lastCard = card;
    state.lastX = x;
    state.lastY = y;

    // 8 per page
    state.owners = owners;
    state.pages = chunk(owners, 8);
    state.pageIndex = 0;

    tooltip.classList.add('show');

    // allow click only while visible (and frozen)
    tooltip.style.pointerEvents = state.frozen ? 'auto' : 'none';

    render();
    startTimer();
  }

  function hide() {
    state.visible = false;
    state.lastCard = null;
    tooltip.classList.remove('show');
    tooltip.style.pointerEvents = 'none';
    clearTimer();
  }

  function freezeToggle() {
    if (!state.visible) return;

    state.frozen = !state.frozen;
    tooltip.style.pointerEvents = state.frozen ? 'auto' : 'none';

    if (state.frozen) {
      clearTimer();
    } else {
      startTimer();
    }
    render();
  }

  // Tooltip click: toggle freeze + next button handling
  tooltip.addEventListener('click', function (e) {
    if (!state.visible) return;

    var t = e.target;
    if (t && t.classList && t.classList.contains('owners-next-btn')) {
      // manual page step
      if (state.pages && state.pages.length) {
        state.pageIndex = (state.pageIndex + 1) % state.pages.length;
        render();
      }
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // anywhere else: toggle freeze
    freezeToggle();
    e.preventDefault();
    e.stopPropagation();
  });

  // Delegated hover
  scope.addEventListener('mousemove', function (e) {
    if (!state.visible) return;
    if (state.frozen) return;

    state.lastX = e.clientX;
    state.lastY = e.clientY;
    setTooltipPos(tooltip, state.lastX, state.lastY);
  });

  scope.addEventListener('mouseover', function (e) {
    var el = e.target;
    if (!el) return;

    var card = closest(el, '.unified-card[data-card-type="pokemon"]');
    if (!card) return;

    // only for cards that actually have owners data
    var hasOwners = card.getAttribute('data-owners');
    if (!hasOwners) return;

    // reset freeze when entering a new card
    if (state.lastCard !== card) {
      state.frozen = false;
      tooltip.style.pointerEvents = 'none';
    }

    show(card, e.clientX, e.clientY);
  });

  scope.addEventListener('mouseout', function (e) {
    var el = e.target;
    if (!el) return;

    var card = closest(el, '.unified-card[data-card-type="pokemon"]');
    if (!card) return;

    // if moving within the same card, ignore
    var related = e.relatedTarget;
    if (related && closest(related, '.unified-card[data-card-type="pokemon"]') === card) {
      return;
    }

    // frozen tooltip stays until user unfreezes OR leaves card area?
    // Spec: tooltip fixed in freeze mode, so keep it.
    if (state.frozen) return;

    hide();
  });

  // public API: return cleanup if you want it later
  return {
    hide: hide
  };
}

// Back-compat alias (if older controller imports this)
export function setupDexOwnerTooltip(root) {
  return bindDexOwnerTooltip(root);
}

function closest(el, selector) {
  while (el) {
    if (el.matches && el.matches(selector)) return el;
    el = el.parentElement;
  }
  return null;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
