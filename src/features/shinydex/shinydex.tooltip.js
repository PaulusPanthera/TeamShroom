// src/features/shinydex/shinydex.tooltip.js
// v2.0.0-beta
// Shiny Dex — Owners Tooltip (paged + freeze mode + old-school auto swap)

let tooltipEl = null;
let isBound = false;

const PAGE_SIZE = 10;
const AUTO_SWAP_MS = 3333;
const SWAP_CLASS_MS = 160;

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

  document.body.appendChild(tooltipEl);
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeVariantKey(v) {
  const x = String(v || '').trim().toLowerCase();
  if (x === 'secret') return 'secret';
  if (x === 'alpha') return 'alpha';
  if (x === 'safari') return 'safari';
  return 'standard';
}

function memberKeyFromOwnerName(name) {
  return String(name || '').trim().toLowerCase();
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

  function stopAuto() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = null;
  }

  function startAuto() {
    stopAuto();
    if (!activeCard) return;
    if (frozen) return;
    if (pages.length <= 1) return;

    timer = window.setInterval(() => {
      if (!activeCard) return;
      if (frozen) return;

      pageIndex = (pageIndex + 1) % pages.length;
      renderPage(true);
    }, AUTO_SWAP_MS);
  }

  function setPositionNearCard(cardEl) {
    if (!cardEl) return;

    const r = cardEl.getBoundingClientRect();
    const pad = 12;

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

  function swapEffect() {
    // “old-school” step-swap (no opacity blink)
    listEl.classList.remove('swap');
    // force reflow so the class re-triggers reliably
    void listEl.offsetWidth; // eslint-disable-line no-unused-expressions
    listEl.classList.add('swap');
    window.setTimeout(() => listEl.classList.remove('swap'), SWAP_CLASS_MS);
  }

  function renderPage(withSwap) {
    if (!pages.length) return;

    const current = pages[pageIndex] || [];
    const total = pages.length;

    listEl.innerHTML = current
      .map(o => {
        const label = String(o || '').trim();
        const key = memberKeyFromOwnerName(label);
        return `
          <button
            type="button"
            class="owner-row owner-btn"
            data-owner="${escapeHtml(label)}"
            data-member-key="${escapeHtml(key)}"
          >${escapeHtml(label)}</button>
        `;
      })
      .join('');

    pageEl.textContent = total > 1 ? `${pageIndex + 1} / ${total}` : '';
    nextBtn.style.display = total > 1 ? 'inline-block' : 'none';

    if (withSwap) swapEffect();
  }

  function show() {
    tt.classList.add('show');
  }

  function hide() {
    tt.classList.remove('show');
    tt.style.left = '-9999px';
    tt.style.top = '-9999px';

    stopAuto();

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

  function loadOwnersByVariantFromCard(cardEl) {
    const raw = cardEl?.getAttribute('data-owners-by-variant');
    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const out = {
      standard: Array.isArray(parsed.standard) ? parsed.standard.filter(Boolean).map(String) : null,
      secret: Array.isArray(parsed.secret) ? parsed.secret.filter(Boolean).map(String) : null,
      alpha: Array.isArray(parsed.alpha) ? parsed.alpha.filter(Boolean).map(String) : null,
      safari: Array.isArray(parsed.safari) ? parsed.safari.filter(Boolean).map(String) : null
    };

    return out;
  }

  function getOwnersForActiveVariant(cardEl) {
    if (!cardEl) return [];

    const variant = normalizeVariantKey(cardEl.getAttribute('data-selected-variant'));
    const ownersAll = loadOwnersFromCard(cardEl);
    const map = loadOwnersByVariantFromCard(cardEl);

    if (!map) return ownersAll;

    if (variant === 'standard') {
      const standard = Array.isArray(map.standard) ? map.standard : null;
      return (standard && standard.length) ? standard : ownersAll;
    }

    const scoped = map[variant];
    return Array.isArray(scoped) ? scoped : [];
  }

  function setActiveCard(cardEl) {
    if (!cardEl) return;

    activeCard = cardEl;

    const name = cardEl.getAttribute('data-name') || '';
    const owners = getOwnersForActiveVariant(cardEl);

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

    startAuto();
  }

  function toggleFreeze() {
    if (!activeCard) return;

    frozen = !frozen;
    tt.classList.toggle('is-frozen', frozen);

    if (frozen) stopAuto();
    else startAuto();
  }

  function getCardFromEventTarget(target) {
    if (!target || typeof target.closest !== 'function') return null;
    return target.closest('.unified-card[data-owners]');
  }

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

  doc.addEventListener(
    'mousemove',
    () => {
      if (!activeCard) return;
      if (frozen) return;
      setPositionNearCard(activeCard);
    },
    { passive: true }
  );

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

  doc.addEventListener(
    'click',
    e => {
      // Variant buttons must not toggle freeze.
      const variantBtn = e && e.target && typeof e.target.closest === 'function'
        ? e.target.closest('.variant-btn')
        : null;
      if (variantBtn) return;

      const card = getCardFromEventTarget(e.target);
      if (!card) return;

      if (card !== activeCard) {
        setActiveCard(card);
        frozen = false;
        tt.classList.remove('is-frozen');
      }

      toggleFreeze();
    },
    true
  );

  // Update visible tooltip when the active card switches variant.
  doc.addEventListener(
    'card:variant',
    e => {
      const card = e && e.target ? e.target : null;
      if (!card) return;
      if (!activeCard) return;
      if (card !== activeCard) return;

      const owners = getOwnersForActiveVariant(activeCard);
      if (!owners.length) {
        hide();
        return;
      }

      pages = chunk(owners, PAGE_SIZE);
      pageIndex = 0;
      renderPage(true);
      setPositionNearCard(activeCard);
      startAuto();
    },
    true
  );

  // Owner -> Showcase member profile
  listEl.addEventListener('click', e => {
    const btn = e && e.target && typeof e.target.closest === 'function'
      ? e.target.closest('.owner-btn')
      : null;
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const key = btn.getAttribute('data-member-key') || '';
    const memberKey = String(key || '').trim().toLowerCase();
    if (!memberKey) return;

    hide();
    location.hash = `#showcase-${encodeURIComponent(memberKey)}`;
  });

  nextBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();

    if (!pages.length) return;
    pageIndex = (pageIndex + 1) % pages.length;
    renderPage(true);

    startAuto();
  });

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
