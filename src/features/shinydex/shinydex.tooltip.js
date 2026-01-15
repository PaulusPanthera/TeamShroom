// src/features/shinydex/shinydex.tooltip.js
// v2.0.0-beta
// ShinyDex owners tooltip with variant filtering + Showcase navigation

let tooltipEl = null;
let isBound = false;
let destroyBoundInstance = null;

const PAGE_SIZE = 10;
const AUTO_SWAP_MS = 3333;
const SWAP_CLASS_MS = 160;

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

function normalizeVariantKey(v) {
  const x = String(v || '').trim().toLowerCase();
  if (x === 'secret') return 'secret';
  if (x === 'alpha') return 'alpha';
  if (x === 'safari') return 'safari';
  return 'standard';
}

function normalizeMemberKey(name) {
  return String(name || '').trim().toLowerCase();
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

function shouldKeepBoundForHash(hash) {
  const h = String(hash || '').trim().toLowerCase();
  return h.startsWith('#hitlist') || h.startsWith('#pokedex');
}

function ensureTooltip() {
  if (tooltipEl) return tooltipEl;

  tooltipEl = document.createElement('div');
  tooltipEl.className = 'dex-owner-tooltip';
  tooltipEl.style.left = '-9999px';
  tooltipEl.style.top = '-9999px';

  const title = document.createElement('div');
  title.className = 'owners-title';

  const list = document.createElement('div');
  list.className = 'owners-list';

  const footer = document.createElement('div');
  footer.className = 'owners-footer';

  const page = document.createElement('span');
  page.className = 'owners-page';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'owners-next';
  next.textContent = 'Next';

  footer.append(page, next);
  tooltipEl.append(title, list, footer);

  document.body.appendChild(tooltipEl);

  return tooltipEl;
}

function removeTooltipNode() {
  if (!tooltipEl) return;
  try {
    tooltipEl.remove();
  } catch {
    // ignore
  }
  tooltipEl = null;
}

function getOwnersAll(cardEl) {
  const raw = cardEl?.getAttribute('data-owners');
  const parsed = safeJsonParse(raw);
  const owners = Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  return owners;
}

function getOwnersByVariantMap(cardEl) {
  const raw = cardEl?.getAttribute('data-owners-by-variant');
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== 'object') return null;

  const map = {
    standard: Array.isArray(parsed.standard) ? parsed.standard.filter(Boolean).map(String) : null,
    secret: Array.isArray(parsed.secret) ? parsed.secret.filter(Boolean).map(String) : null,
    alpha: Array.isArray(parsed.alpha) ? parsed.alpha.filter(Boolean).map(String) : null,
    safari: Array.isArray(parsed.safari) ? parsed.safari.filter(Boolean).map(String) : null
  };

  return map;
}

function getOwnersForVariant(cardEl, wantedVariant) {
  const ownersAll = getOwnersAll(cardEl);
  const map = getOwnersByVariantMap(cardEl);

  // No variant mapping: fall back to species-wide owners.
  if (!map) return ownersAll;

  const v = normalizeVariantKey(wantedVariant || cardEl?.getAttribute('data-selected-variant'));

  if (v === 'standard') {
    const standard = map.standard;
    return Array.isArray(standard) && standard.length ? standard : ownersAll;
  }

  const scoped = map[v];
  return Array.isArray(scoped) ? scoped : [];
}

function setTooltipPosition(tt, cardEl) {
  if (!tt || !cardEl) return;

  const r = cardEl.getBoundingClientRect();
  const pad = 12;

  // Force measurable layout without flashing.
  tt.style.left = '-9999px';
  tt.style.top = '-9999px';
  tt.classList.add('show');

  const tr = tt.getBoundingClientRect();

  let x = r.right + pad;
  if (x + tr.width > window.innerWidth - pad) x = r.left - tr.width - pad;

  let y = r.top;
  y = clamp(y, pad, window.innerHeight - tr.height - pad);

  tt.style.left = `${Math.round(x)}px`;
  tt.style.top = `${Math.round(y)}px`;
}

function applySwapEffect(listEl) {
  if (!listEl) return;

  listEl.classList.remove('swap');
  void listEl.offsetWidth; // force reflow
  listEl.classList.add('swap');

  window.setTimeout(() => {
    listEl.classList.remove('swap');
  }, SWAP_CLASS_MS);
}

export function bindDexOwnerTooltip(root) {
  if (isBound) return;
  isBound = true;

  const doc = root || document;
  const tt = ensureTooltip();

  const titleEl = tt.querySelector('.owners-title');
  const listEl = tt.querySelector('.owners-list');
  const pageEl = tt.querySelector('.owners-page');
  const nextBtn = tt.querySelector('.owners-next');

  let activeCard = null;
  let pages = [];
  let pageIndex = 0;
  let frozen = false;

  let autoSwapTimer = null;
  let swapTimeout = null;

  function clearTimers() {
    if (autoSwapTimer) {
      window.clearInterval(autoSwapTimer);
      autoSwapTimer = null;
    }
    if (swapTimeout) {
      window.clearTimeout(swapTimeout);
      swapTimeout = null;
    }
  }

  function resetPosition() {
    tt.style.left = '-9999px';
    tt.style.top = '-9999px';
  }

  function show() {
    tt.classList.add('show');
  }

  function hide() {
    clearTimers();

    tt.classList.remove('show');
    tt.classList.remove('is-frozen');

    resetPosition();

    frozen = false;
    activeCard = null;
    pages = [];
    pageIndex = 0;

    if (titleEl) titleEl.textContent = '';
    if (listEl) listEl.textContent = '';
    if (pageEl) pageEl.textContent = '';
    if (nextBtn) nextBtn.style.display = 'none';
  }

  function startAutoSwap() {
    clearTimers();

    if (!activeCard) return;
    if (frozen) return;
    if (pages.length <= 1) return;

    autoSwapTimer = window.setInterval(() => {
      if (!activeCard) return;
      if (frozen) return;

      pageIndex = (pageIndex + 1) % pages.length;
      renderPage(true);
    }, AUTO_SWAP_MS);
  }

  function renderPage(withSwap) {
    if (!listEl) return;

    listEl.textContent = '';

    const current = pages[pageIndex] || [];

    if (!current.length) {
      const empty = document.createElement('div');
      empty.className = 'owner-row owner-empty';
      empty.textContent = 'No owners';
      listEl.appendChild(empty);

      if (pageEl) pageEl.textContent = '';
      if (nextBtn) nextBtn.style.display = 'none';
      return;
    }

    current.forEach(ownerName => {
      const label = String(ownerName || '').trim();
      if (!label) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'owner-row owner-btn';
      btn.textContent = label;
      btn.setAttribute('data-owner', label);
      btn.setAttribute('data-member-key', normalizeMemberKey(label));

      listEl.appendChild(btn);
    });

    const total = pages.length;
    if (pageEl) pageEl.textContent = total > 1 ? `${pageIndex + 1} / ${total}` : '';
    if (nextBtn) nextBtn.style.display = total > 1 ? 'inline-block' : 'none';

    if (withSwap) {
      if (swapTimeout) window.clearTimeout(swapTimeout);
      applySwapEffect(listEl);
      swapTimeout = window.setTimeout(() => {
        if (!listEl) return;
        listEl.classList.remove('swap');
      }, SWAP_CLASS_MS);
    }
  }

  function setActiveCard(cardEl, wantedVariantKey) {
    if (!cardEl) return;

    activeCard = cardEl;

    const name = cardEl.getAttribute('data-name') || '';
    const owners = getOwnersForVariant(cardEl, wantedVariantKey);

    pages = chunk(owners, PAGE_SIZE);
    pageIndex = 0;

    if (titleEl) titleEl.textContent = name ? `Owners — ${name}` : 'Owners';

    renderPage(false);

    setTooltipPosition(tt, cardEl);
    show();

    startAutoSwap();
  }

  function setFrozen(nextState) {
    frozen = Boolean(nextState);
    tt.classList.toggle('is-frozen', frozen);

    if (frozen) {
      clearTimers();
      return;
    }

    startAutoSwap();
  }

  function toggleFreeze() {
    if (!activeCard) return;
    setFrozen(!frozen);
  }

  function getCardFromTarget(target) {
    if (!target || typeof target.closest !== 'function') return null;
    return target.closest('.unified-card[data-owners]');
  }

  function onMouseOver(e) {
    if (frozen) return;

    const card = getCardFromTarget(e.target);
    if (!card) return;
    if (card === activeCard) return;

    setActiveCard(card);
  }

  function onMouseMove() {
    if (!activeCard) return;
    if (frozen) return;

    setTooltipPosition(tt, activeCard);
  }

  function onMouseOut(e) {
    if (frozen) return;
    if (!activeCard) return;

    const fromCard = getCardFromTarget(e.target);
    if (!fromCard || fromCard !== activeCard) return;

    const to = e.relatedTarget;
    if (to && (tt.contains(to) || activeCard.contains(to))) return;

    hide();
  }

  function onCardClick(e) {
    const variantBtn = e && e.target && typeof e.target.closest === 'function'
      ? e.target.closest('.variant-btn')
      : null;

    const card = getCardFromTarget(e.target);
    if (!card) return;

    // Variant icon click must open the tooltip in a clickable (frozen) state,
    // filtered to the clicked variant.
    if (variantBtn) {
      const wantedVariant = variantBtn.getAttribute('data-variant') || 'standard';
      setActiveCard(card, wantedVariant);
      setFrozen(true);
      return;
    }

    if (card !== activeCard) {
      setActiveCard(card);
      setFrozen(false);
    }

    toggleFreeze();
  }

  function onVariantEvent(e) {
    const card = e && e.target ? e.target : null;
    if (!card) return;
    if (!activeCard) return;
    if (card !== activeCard) return;

    const wantedVariant = e && e.detail && e.detail.variant ? String(e.detail.variant) : null;
    const owners = getOwnersForVariant(activeCard, wantedVariant);

    pages = chunk(owners, PAGE_SIZE);
    pageIndex = 0;

    renderPage(true);
    setTooltipPosition(tt, activeCard);

    if (!frozen) startAutoSwap();
  }

  function onNextClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!pages.length) return;

    pageIndex = (pageIndex + 1) % pages.length;
    renderPage(true);

    if (!frozen) startAutoSwap();
  }

  function onOwnerClick(e) {
    const btn = e && e.target && typeof e.target.closest === 'function'
      ? e.target.closest('.owner-btn')
      : null;

    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const memberKey = String(btn.getAttribute('data-member-key') || '').trim().toLowerCase();
    if (!memberKey) return;

    destroy();
    location.hash = `#showcase-${encodeURIComponent(memberKey)}`;
  }

  function onDocClickOutside(e) {
    if (!frozen) return;
    if (tt.contains(e.target)) return;
    if (activeCard && activeCard.contains(e.target)) return;
    hide();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') hide();
  }

  function onScroll() {
    if (activeCard && !frozen) setTooltipPosition(tt, activeCard);
  }

  function onResize() {
    if (activeCard) setTooltipPosition(tt, activeCard);
  }

  function onHashChange() {
    if (shouldKeepBoundForHash(location.hash)) return;
    destroy();
  }

  function destroy() {
    if (!isBound) return;

    hide();

    clearTimers();

    doc.removeEventListener('mouseover', onMouseOver, true);
    doc.removeEventListener('mouseout', onMouseOut, true);
    doc.removeEventListener('click', onCardClick, true);

    doc.removeEventListener('mousemove', onMouseMove);

    doc.removeEventListener('card:variant', onVariantEvent, true);

    document.removeEventListener('click', onDocClickOutside, true);
    document.removeEventListener('keydown', onKeyDown);

    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('hashchange', onHashChange);

    nextBtn?.removeEventListener('click', onNextClick);
    listEl?.removeEventListener('click', onOwnerClick);

    removeTooltipNode();

    isBound = false;
    destroyBoundInstance = null;
  }

  destroyBoundInstance = destroy;

  doc.addEventListener('mouseover', onMouseOver, true);
  doc.addEventListener('mouseout', onMouseOut, true);
  doc.addEventListener('click', onCardClick, true);

  doc.addEventListener('mousemove', onMouseMove, { passive: true });

  doc.addEventListener('card:variant', onVariantEvent, true);

  nextBtn?.addEventListener('click', onNextClick);
  listEl?.addEventListener('click', onOwnerClick);

  document.addEventListener('click', onDocClickOutside, true);
  document.addEventListener('keydown', onKeyDown);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('hashchange', onHashChange);

  // Immediate cleanup if mounted outside the dex routes.
  if (!shouldKeepBoundForHash(location.hash)) destroy();
}

// Emergency escape hatch: allows feature shells to force cleanup.
export function destroyDexOwnerTooltip() {
  if (typeof destroyBoundInstance === 'function') destroyBoundInstance();
}
