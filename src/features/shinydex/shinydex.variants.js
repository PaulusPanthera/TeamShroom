// src/features/shinydex/shinydex.variants.js
// Variant click-switch for cards (base + optional alpha/secret/safari)

export function wireCardVariantSwitch(root = document) {
  const handler = (e) => {
    const slot = e.target.closest('.status-slot');
    if (!slot) return;

    const card = slot.closest('.unified-card');
    if (!card) return;

    cycleVariant(card);
  };

  root.addEventListener('click', handler);

  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const slot = e.target.closest('.status-slot');
    if (!slot) return;
    e.preventDefault();
    const card = slot.closest('.unified-card');
    if (!card) return;
    cycleVariant(card);
  });
}

function cycleVariant(cardEl) {
  const cycleJson = cardEl.getAttribute('data-variant-cycle') || '[]';
  let cycle;
  try { cycle = JSON.parse(cycleJson); } catch { cycle = ['base']; }

  if (!Array.isArray(cycle) || cycle.length === 0) cycle = ['base'];

  const current = cardEl.getAttribute('data-variant') || 'base';
  const idx = cycle.indexOf(current);
  const next = cycle[(idx + 1) % cycle.length] || 'base';

  cardEl.setAttribute('data-variant', next);

  // mark icons
  cardEl.querySelectorAll('.status-icon').forEach(img => {
    const alt = (img.getAttribute('alt') || '').toLowerCase();
    if (!alt) return;
    img.classList.toggle('is-active', alt === next);
  });

  // update label (simple)
  const pill = cardEl.querySelector('.status-pill');
  if (pill) {
    pill.textContent =
      next === 'alpha' ? 'ALPHA' :
      next === 'secret' ? 'SECRET' :
      next === 'safari' ? 'SAFARI' :
      'STANDARD';
  }

  // notify host logic (if you want to swap claim data/render)
  cardEl.dispatchEvent(new CustomEvent('card:variant', { bubbles: true, detail: { variant: next } }));
}
