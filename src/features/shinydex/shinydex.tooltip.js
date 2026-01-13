// v2.0.0-alpha.1
// src/features/shinydex/shinydex.tooltip.js
// Owners tooltip (Living Dex). Pure DOM behavior.

var TOOLTIP_ID = 'dex-owner-tooltip';
var PAGE_SIZE = 8;
var PAGE_MS = 2400;

function ensureTooltipEl() {
  var el = document.getElementById(TOOLTIP_ID);
  if (el) return el;

  el = document.createElement('div');
  el.id = TOOLTIP_ID;
  el.className = 'dex-owner-tooltip';
  el.innerHTML =
    '<div class="owners-title"></div>' +
    '<div class="owners-list"></div>';

  document.body.appendChild(el);
  return el;
}

function safeParseOwners(attr) {
  try {
    if (!attr) return [];
    var arr = JSON.parse(attr);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function chunk(arr, size) {
  var out = [];
  for (var i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function bindDexOwnerTooltip(root) {
  var host = root || document;
  var tooltip = ensureTooltipEl();

  var active = null;
  var timer = null;
  var pageIndex = 0;
  var pages = [];
  var currentTitle = '';

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function hide() {
    stop();
    active = null;
    pages = [];
    pageIndex = 0;
    tooltip.classList.remove('show');
  }

  function renderPage() {
    if (!pages.length) return;

    var names = pages[pageIndex] || [];
    var remaining = 0;

    // how many remaining after this page?
    var shown = pageIndex * PAGE_SIZE + names.length;
    if (shown < (pages.length * PAGE_SIZE)) {
      remaining = Math.max(0, (pages.length * PAGE_SIZE) - shown);
    }

    var lines = names.slice(0);
    // add "+N more" only on page 0 if there are more than one page
    if (pages.length > 1 && pageIndex === 0) {
      var rest = 0;
      for (var i = 1; i < pages.length; i++) rest += pages[i].length;
      lines.push('(+ ' + rest + ' more)');
    }

    tooltip.querySelector('.owners-title').textContent = currentTitle;
    tooltip.querySelector('.owners-list').innerHTML =
      '<div class="scrolling-names">' + lines.map(escapeHtml).join('<br>') + '</div>';
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function position(e) {
    var pad = 14;
    var x = e.clientX + pad;
    var y = e.clientY + pad;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';

    // keep within viewport (simple clamp after paint size known)
    var rect = tooltip.getBoundingClientRect();
    var maxX = window.innerWidth - rect.width - 8;
    var maxY = window.innerHeight - rect.height - 8;

    tooltip.style.left = clamp(x, 8, maxX) + 'px';
    tooltip.style.top = clamp(y, 8, maxY) + 'px';
  }

  host.addEventListener('mouseover', function (e) {
    var card = e.target && e.target.closest
      ? e.target.closest('.unified-card[data-owners]')
      : null;
    if (!card) return;

    active = card;

    var owners = safeParseOwners(card.getAttribute('data-owners'));
    if (!owners.length) return;

    currentTitle = 'Owners — ' + (card.getAttribute('data-name') || 'Pokémon');
    pages = chunk(owners, PAGE_SIZE);
    pageIndex = 0;

    renderPage();

    tooltip.classList.add('show');
    position(e);

    stop();
    if (pages.length > 1) {
      timer = setInterval(function () {
        pageIndex = (pageIndex + 1) % pages.length;
        renderPage();
      }, PAGE_MS);
    }
  });

  host.addEventListener('mousemove', function (e) {
    if (!active) return;
    position(e);
  });

  host.addEventListener('mouseout', function (e) {
    if (!active) return;

    // if leaving the active card, hide
    var leaving = e.target && e.target.closest
      ? e.target.closest('.unified-card[data-owners]')
      : null;

    if (leaving && leaving === active) hide();
  });

  // safety: hide on scroll
  window.addEventListener('scroll', hide, { passive: true });
}
