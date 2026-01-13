// v2.0.0-alpha.1
// src/features/shinydex/shinydex.tooltip.js
// Owners tooltip (LivingDex) — UI only

function uniq(list) {
  const out = [];
  const seen = {};
  (list || []).forEach(x => {
    const k = String(x || '');
    if (!k) return;
    if (seen[k]) return;
    seen[k] = true;
    out.push(k);
  });
  return out;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function ensureDexOwnerTooltip() {
  let tip = document.querySelector('.dex-owner-tooltip');
  if (tip) return tip;

  tip = document.createElement('div');
  tip.className = 'dex-owner-tooltip';

  tip.innerHTML = `
    <div class="owners-title"></div>
    <div class="owners-list">
      <div class="scrolling-names"></div>
    </div>
  `;

  document.body.appendChild(tip);
  return tip;
}

export function bindDexOwnerTooltip(rootEl) {
  const tip = ensureDexOwnerTooltip();
  const titleEl = tip.querySelector('.owners-title');
  const namesEl = tip.querySelector('.scrolling-names');

  let timer = null;
  let pageIdx = 0;
  let pages = [];

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    pageIdx = 0;
    pages = [];
  }

  function hide() {
    stop();
    tip.classList.remove('show');
  }

  function showAt(x, y) {
    const pad = 14;
    const w = tip.offsetWidth || 260;
    const h = tip.offsetHeight || 140;

    let left = x + pad;
    let top = y + pad;

    if (left + w > window.innerWidth - 10) left = x - w - pad;
    if (top + h > window.innerHeight - 10) top = y - h - pad;

    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    tip.classList.add('show');
  }

  function setPages(owners) {
    const list = uniq(owners);
    pages = chunk(list, 8);     // 8 names per page
    pageIdx = 0;

    if (!pages.length) {
      namesEl.textContent = '';
      return;
    }

    namesEl.textContent = pages[0].join('\n');

    // readable cadence (not too fast)
    if (pages.length > 1) {
      timer = setInterval(() => {
        pageIdx = (pageIdx + 1) % pages.length;
        namesEl.textContent = pages[pageIdx].join('\n');
      }, 2500);
    }
  }

  // event delegation
  rootEl.addEventListener('mouseover', e => {
    const card = e.target && e.target.closest ? e.target.closest('.unified-card[data-owners]') : null;
    if (!card) return;

    const raw = card.getAttribute('data-owners') || '';
    const owners = raw ? raw.split('|').map(x => x.trim()).filter(Boolean) : [];
    if (!owners.length) return;

    titleEl.textContent = 'Owners — ' + (card.getAttribute('data-name') || '');
    setPages(owners);
    showAt(e.clientX, e.clientY);
  });

  rootEl.addEventListener('mousemove', e => {
    if (!tip.classList.contains('show')) return;
    showAt(e.clientX, e.clientY);
  });

  rootEl.addEventListener('mouseout', e => {
    const related = e.relatedTarget;
    if (related && tip.contains(related)) return;
    hide();
  });

  window.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('blur', hide);
}
