// v2.0.0-alpha.1
// src/features/shinydex/shinydex.tooltip.js
// Shiny Dex — Owners Tooltip (paged + freeze mode)

let tooltipEl = null;
let ownerTooltipBound = false;


function ensureTooltip() {
  if (tooltipEl) return tooltipEl;

  tooltipEl = document.createElement('div');
  tooltipEl.className = 'dex-owner-tooltip';
  tooltipEl.innerHTML = `
    <div class="owners-title"></div>
    <div class="owners-list"></div>
    <div class="owners-footer">
      <span class="owners-page"></span>
      <button class="owners-next" type="button">Next</button>
    </div>
  `;

  document.body.appendChild(tooltipEl);
  return tooltipEl;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}
export function bindDexOwnerTooltip(root) {
  if (ownerTooltipBound) return;
  ownerTooltipBound = true;

  const doc = root || document;
  const tt = ensureTooltip();
  ...
}

export function bindDexOwnerTooltip(root) {
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

  function startTimer() {
    stopTimer();
    timer = window.setInterval(() => {
      if (frozen) return;
      pageIndex = (pageIndex + 1) % Math.max(1, pages.length);
      renderPage(true);
    }, 3000);
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
    activeCard = null;
    pages = [];
    pageIndex = 0;
    tt.classList.remove('is-frozen');
  }

  function setPositionNearCard(card) {
    const r = card.getBoundingClientRect();
    const pad = 12;

    const desiredLeft = r.left + (r.width / 2) - (tt.offsetWidth / 2);
    const desiredTop = r.top - tt.offsetHeight - 10;

    const left = clamp(desiredLeft, pad, window.innerWidth - tt.offsetWidth - pad);
    const top = clamp(desiredTop, pad, window.innerHeight - tt.offsetHeight - pad);

    tt.style.left = left + 'px';
    tt.style.top = top + 'px';
  }

  function renderPage(withFade) {
    const totalPages = Math.max(1, pages.length);
    const idx = clamp(pageIndex, 0, totalPages - 1);

    const names = pages[idx] || [];
    const html = names.length
      ? names.map(n => `<div class="owner-name">${escapeHtml(n)}</div>`).join('')
      : `<div class="owner-name">—</div>`;

    if (withFade) {
      listEl.classList.add('fade');
      window.setTimeout(() => {
        listEl.innerHTML = html;
        listEl.classList.remove('fade');
      }, 120);
    } else {
      listEl.innerHTML = html;
    }

    pageEl.textContent = totalPages > 1 ? `${idx + 1}/${totalPages}` : '';
    nextBtn.style.display = frozen && totalPages > 1 ? 'inline-flex' : 'none';
    tt.classList.toggle('is-frozen', frozen);
  }

  function openForCard(card) {
    const ownersRaw = card.dataset.owners;
    if (!ownersRaw) return;

    let owners = [];
    try {
      owners = JSON.parse(ownersRaw);
      if (!Array.isArray(owners)) owners = [];
    } catch (_) {
      owners = [];
    }

    owners = owners
      .map(x => String(x || '').trim())
      .filter(Boolean);

    const pokemonName = card.dataset.name || '';
    titleEl.textContent = `Owners — ${pokemonName}`;

    pages = chunk(owners, 8);
    pageIndex = 0;

    renderPage(false);
    show();
    setPositionNearCard(card);
    startTimer();
  }

  function toggleFreeze(card) {
    if (!activeCard || activeCard !== card) return;
    frozen = !frozen;
    if (frozen) {
      stopTimer();
    } else {
      startTimer();
    }
    renderPage(false);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  doc.addEventListener('mouseover', e => {
    const card = e.target && e.target.closest
      ? e.target.closest('.unified-card[data-owners]')
      : null;

    if (!card) return;
    if (frozen) return;

    activeCard = card;
    openForCard(card);
  });

  doc.addEventListener('mousemove', e => {
    if (!activeCard) return;
    if (frozen) return;

    // keep it near the card, not the cursor (stable)
    setPositionNearCard(activeCard);
  });

  doc.addEventListener('mouseout', e => {
    if (!activeCard) return;
    if (frozen) return;

    const to = e.relatedTarget;
    if (to && activeCard.contains(to)) return;

    // leaving the card: hide
    hide();
  });

  doc.addEventListener('click', e => {
    const card = e.target && e.target.closest
      ? e.target.closest('.unified-card[data-owners]')
      : null;

    // click on card toggles freeze
    if (card) {
      if (!activeCard || activeCard !== card) {
        activeCard = card;
        frozen = false;
        openForCard(card);
        return;
      }
      toggleFreeze(card);
      e.preventDefault();
      return;
    }

    // clicking outside closes if frozen
    if (frozen) {
      hide();
    }
  });

  nextBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (!pages.length) return;
    pageIndex = (pageIndex + 1) % pages.length;
    renderPage(true);
  });

  window.addEventListener('scroll', () => {
    if (activeCard && !frozen) setPositionNearCard(activeCard);
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (activeCard) setPositionNearCard(activeCard);
  });
}
