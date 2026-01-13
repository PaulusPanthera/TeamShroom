// v2.0.0-alpha.1
// src/features/shinydex/shinydex.tooltip.js
// Living Dex Owners Tooltip — UI ONLY

const TOOLTIP_ID = 'dex-owner-tooltip';

function getOrCreateTooltip() {
  let el = document.getElementById(TOOLTIP_ID);
  if (el) return el;

  el = document.createElement('div');
  el.id = TOOLTIP_ID;
  el.className = 'dex-owner-tooltip';

  el.innerHTML = `
    <div class="owners-title">
      <span class="title-text"></span>
      <span class="page-indicator"></span>
    </div>
    <div class="owners-list"></div>
    <div class="tooltip-controls">
      <button class="tooltip-next" type="button">Next</button>
    </div>
  `;

  document.body.appendChild(el);
  return el;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function positionTooltip(el, x, y) {
  const pad = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  el.style.left = '0px';
  el.style.top = '0px';
  el.style.right = 'auto';
  el.style.bottom = 'auto';

  // Force layout so width/height are correct
  const rect = el.getBoundingClientRect();
  const w = rect.width || 360;
  const h = rect.height || 140;

  const px = clamp(x + 18, pad, vw - w - pad);
  const py = clamp(y + 18, pad, vh - h - pad);

  el.style.left = px + 'px';
  el.style.top = py + 'px';
}

function ownersFromCard(card) {
  const packed = card.getAttribute('data-owners') || '';
  if (!packed) return [];
  return packed
    .split('|')
    .map(s => String(s || '').trim())
    .filter(Boolean);
}

function renderPage(tooltip, state, fade) {
  const titleEl = tooltip.querySelector('.title-text');
  const pageEl = tooltip.querySelector('.page-indicator');
  const listEl = tooltip.querySelector('.owners-list');

  const total = state.owners.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  const page = clamp(state.page, 0, pages - 1);

  state.page = page;

  const start = page * state.pageSize;
  const slice = state.owners.slice(start, start + state.pageSize);

  titleEl.textContent = 'Owners — ' + (state.pokemonName || 'Unknown');

  pageEl.textContent = pages > 1
    ? `Page ${page + 1}/${pages}`
    : '';

  if (fade) {
    listEl.classList.add('is-fading');
    window.setTimeout(() => {
      listEl.textContent = slice.join('\n');
      listEl.classList.remove('is-fading');
    }, 120);
  } else {
    listEl.textContent = slice.join('\n');
  }
}

export function setupDexOwnerTooltip(rootEl) {
  const root = rootEl || document;
  const tooltip = getOrCreateTooltip();

  const state = {
    visible: false,
    pinned: false,
    pinnedCard: null,

    pokemonName: '',
    owners: [],
    page: 0,
    pageSize: 8,

    timer: null,
    lastMouse: { x: 0, y: 0 }
  };

  function stopTimer() {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
  }

  function startTimerIfNeeded() {
    stopTimer();
    if (state.pinned) return;

    const pages = Math.ceil(state.owners.length / state.pageSize);
    if (pages <= 1) return;

    state.timer = window.setInterval(() => {
      const maxPage = pages - 1;
      state.page = state.page >= maxPage ? 0 : state.page + 1;
      renderPage(tooltip, state, true);
    }, 3000);
  }

  function showAt(x, y) {
    tooltip.classList.add('show');
    state.visible = true;
    positionTooltip(tooltip, x, y);
  }

  function hide() {
    tooltip.classList.remove('show');
    tooltip.classList.remove('pinned');
    state.visible = false;
    stopTimer();
  }

  function attachToCard(card, x, y) {
    const owners = ownersFromCard(card);
    if (!owners.length) return;

    state.pokemonName = card.getAttribute('data-name') || '';
    state.owners = owners;
    state.page = 0;

    renderPage(tooltip, state, false);
    showAt(x, y);
    startTimerIfNeeded();
  }

  function pinCard(card) {
    state.pinned = true;
    state.pinnedCard = card;

    tooltip.classList.add('pinned');

    // Anchor near the card (top-right)
    const r = card.getBoundingClientRect();
    positionTooltip(tooltip, r.right, r.top);

    stopTimer();
    renderPage(tooltip, state, false);
  }

  function unpin() {
    state.pinned = false;
    state.pinnedCard = null;
    tooltip.classList.remove('pinned');

    // When unpinning, behave like normal hover (hide)
    hide();
  }

  // Hover behavior (only when not pinned)
  root.addEventListener('mousemove', e => {
    state.lastMouse.x = e.clientX;
    state.lastMouse.y = e.clientY;
    if (state.visible && !state.pinned) {
      positionTooltip(tooltip, e.clientX, e.clientY);
    }
  });

  root.addEventListener('mouseover', e => {
    if (state.pinned) return;

    const card = e.target && e.target.closest
      ? e.target.closest('.unified-card[data-owners]')
      : null;

    if (!card) return;

    attachToCard(card, state.lastMouse.x, state.lastMouse.y);
  });

  root.addEventListener('mouseout', e => {
    if (state.pinned) return;

    const card = e.target && e.target.closest
      ? e.target.closest('.unified-card[data-owners]')
      : null;

    if (!card) return;

    // If leaving the card, hide
    hide();
  });

  // Freeze mode toggle (left click on card)
  root.addEventListener('click', e => {
    const card = e.target && e.target.closest
      ? e.target.closest('.unified-card[data-owners]')
      : null;

    if (!card) return;

    // Ensure tooltip is showing correct card data
    if (!state.visible || state.pokemonName !== (card.getAttribute('data-name') || '')) {
      attachToCard(card, state.lastMouse.x, state.lastMouse.y);
    }

    if (state.pinned && state.pinnedCard === card) {
      unpin();
      return;
    }

    pinCard(card);
  });

  // Next button (only visible in pinned mode)
  const nextBtn = tooltip.querySelector('.tooltip-next');
  nextBtn.addEventListener('click', () => {
    if (!state.pinned) return;

    const pages = Math.max(1, Math.ceil(state.owners.length / state.pageSize));
    state.page = pages <= 1 ? 0 : (state.page + 1) % pages;
    renderPage(tooltip, state, true);
  });

  // Click outside exits pinned mode
  document.addEventListener('mousedown', e => {
    if (!state.pinned) return;

    const t = e.target;
    const insideTooltip = tooltip.contains(t);
    const insideCard = state.pinnedCard && state.pinnedCard.contains(t);

    if (!insideTooltip && !insideCard) {
      unpin();
    }
  }, true);

  return {
    hide,
    unpin
  };
}

// Back-compat alias (safe to call)
export function initDexOwnerTooltip(rootEl) {
  return setupDexOwnerTooltip(rootEl);
}
