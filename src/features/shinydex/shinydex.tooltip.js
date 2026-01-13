// v2.0.0-alpha.1
// src/features/shinydex/shinydex.tooltip.js
// Shiny Dex — Owners Tooltip (paged + freeze mode)

let tooltipEl = null;
let isBound = false;

const PAGE_SIZE = 10;

function ensureTooltip() {
  if (tooltipEl) return tooltipEl;

  tooltipEl = document.createElement('div');
  tooltipEl.className = 'dex-owner-tooltip';
  tooltipEl.innerHTML = `
    <div class="owners-title"></div>
    <div class="owners-list"></div>
    <div class="owners-footer">
      <span class="owners-page"></span>
      <button type="button" class="owners-next">Next</button>
    </div>
  `;

  // Positioning uses fixed; tooltip should live at body root.
  document.body.appendChild(tooltipEl);

  // Hidden default position (CSS fades with .show)
  tooltipEl.style.left = '-9999px';
  tooltipEl.style.top = '-9999px';

  return tooltipEl;
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function bindDexOwnerTooltip(root) {
  if (isBound) return;
  isBound = true;

  const doc = root || document;
  const tt = ensureTooltip();

  let activeCard = null;
  let pages = [];
  let pageIndex = 0;
  let timer = null;
  let frozen = false;

  const titleEl = tt.querySelector('.owners-title');
  const listEl = tt.querySelector('.owners-list');
  const pageEl = tt.querySelector('.owners-page');
  const nextBtn = tt.querySelector('.owners-next');

  function stopTimer() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function setPositionNearCard(cardEl) {
    if (!cardEl) return;

    const r = cardEl.getBoundingClientRect();
    const pad = 12;

    // Force measure
    tt.style.left = '-9999px';
    tt.style.top = '-9999px';
    tt.classList.add('show');
    const tr = tt.getBoundingClientRect();

    // Prefer right side; if overflow, flip left.
    let x = r.right + pad;
    if (x + tr.width > window.innerWidth - pad) {
      x = r.left - tr.width - pad;
    }

    // Vertical: align with top of card but keep inside viewport.
    let y = r.top;
    y = clamp(y, pad, window.innerHeight - tr.height - pad);

    tt.style.left = `${Math.round(x)}px`;
    tt.style.top = `${Math.round(y)}px`;
  }

  function renderPage(withFade) {
    if (!pages.length) return;

    const current = pages[pageIndex] || [];
    const total = pages.length;

    if (withFade) {
      listEl.classList.add('fade');
      window.setTimeout(() => listEl.classList.remove('fade'), 120);
    }

    listEl.innerHTML = current
      .map(o => `<div class="owner-row">${o}</div>`)
      .join('');

    pageEl.textContent = total > 1 ? `${pageIndex + 1} / ${total}` : '';
    nextBtn.style.display = total > 1 ? 'inline-block' : 'none';
  }

  function show() {
    tt.classList.add('show');
  }

  function hide() {
    tt.classList.remove('show');
    tt.style.left = '-9999px';
    tt.style.top = '-9999px';

    stopTimer();

    frozen = false;
    tt.classList.remove('is-frozen');

    activeCard = null;
    pages = [];
    pageIndex = 0;

    titleEl.textContent = '';
    listEl.innerHTML = '';
    pageEl.textContent = '';
    nextBtn.style.display = 'none';
  }

  function loadOwnersFromCard(cardEl) {
    const raw = cardEl?.getAttribute('data-owners');
    const parsed = safeJsonParse(raw);
    const owners = Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    return owners;
  }

  function setActiveCard(cardEl) {
    if (!cardEl) return;

    activeCard = cardEl;

    const name = cardEl.getAttribute('data-name') || '';
    const owners = loadOwnersFromCard(cardEl);

    if (!owners.length) {
      hide();
      return;
    }

    pages = chunk(owners, PAGE_SIZE);
    pageIndex = 0;

    titleEl.textContent = name ? `Owners — ${name}` : 'Owners';
    renderPage(false);

    setPositionNearCard(cardEl);
    show();
  }

  function toggleFreeze() {
    if (!activeCard) return;

    frozen = !frozen;
    tt.classList.toggle('is-frozen', frozen);

    if (!frozen) {
      // when unfreezing, keep it visible only if still hovering card
      // (next mouseout will hide)
      stopTimer();
    }
  }

  // Delegation target: unified cards with data-owners
  function getCardFromEventTarget(target) {
    if (!target || typeof target.closest !== 'function') return null;
    return target.closest('.unified-card[data-owners]');
  }

  // Hover: show tooltip (unless frozen)
  doc.addEventListener(
    'mouseover',
    e => {
      if (frozen) return;

      const card = getCardFromEventTarget(e.target);
      if (!card) return;

      if (card === activeCard) return;
      setActiveCard(card);
    },
    true
  );

  // Move: keep aligned (unless frozen)
  doc.addEventListener(
    'mousemove',
    () => {
      if (!activeCard) return;
      if (frozen) return;
      setPositionNearCard(activeCard);
    },
    { passive: true }
  );

  // Leave card: hide (unless frozen)
  doc.addEventListener(
    'mouseout',
    e => {
      if (frozen) return;
      if (!activeCard) return;

      const fromCard = getCardFromEventTarget(e.target);
      if (!fromCard || fromCard !== activeCard) return;

      const to = e.relatedTarget;
      if (to && (tt.contains(to) || activeCard.contains(to))) return;

      hide();
    },
    true
  );

  // Click on card toggles freeze
  doc.addEventListener(
    'click',
    e => {
      const card = getCardFromEventTarget(e.target);
      if (!card) return;

      // If clicking a different card, switch first (and freeze toggles from false->true)
      if (card !== activeCard) {
        setActiveCard(card);
        frozen = false;
        tt.classList.remove('is-frozen');
      }

      toggleFreeze();
    },
    true
  );

  // Next page button
  nextBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();

    if (!pages.length) return;
    pageIndex = (pageIndex + 1) % pages.length;
    renderPage(true);
  });

  // Click outside closes when frozen
  document.addEventListener(
    'click',
    e => {
      if (!frozen) return;
      if (tt.contains(e.target)) return;
      if (activeCard && activeCard.contains(e.target)) return;
      hide();
    },
    true
  );

  // Escape closes
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hide();
  });

  window.addEventListener(
    'scroll',
    () => {
      if (activeCard && !frozen) setPositionNearCard(activeCard);
    },
    { passive: true }
  );

  window.addEventListener('resize', () => {
    if (activeCard) setPositionNearCard(activeCard);
  });
}
