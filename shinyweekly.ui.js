// general/shinyweekly.ui.js
// Improved shiny weekly renderer — full patched file ready to paste.
// Exports: renderShinyWeekly(weeklyData, container)
// - uses utils.js for name normalization/display
// - lazy-loads images via IntersectionObserver
// - shows cards grid, badges, and a modal preview
// - improved showWeek behavior: scroll active week into view and bring cards into view

import { prettifyPokemonName, prettifyMemberName, normalizePokemonName } from './utils.js';

const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='; // 1x1

function getPokemonGif(rawName) {
  if (!rawName) return '';
  // Use normalizePokemonName to generate canonical token
  let token = normalizePokemonName(rawName);

  // map a few legacy oddities
  const extraMap = {
    'magikar': 'magikarp',
    'cryognal': 'cryogonal',
    'wurmpel': 'wurmple',
    'farfetchd': 'farfetchd',
    'nidoranf': 'nidoran-f',
    'nidoranm': 'nidoran-m',
    'mrmime': 'mr-mime',
    'mimejr': 'mime-jr'
  };
  if (extraMap[token]) token = extraMap[token];

  if (!token) return '';

  // Some tokens require a custom path (mr-mime etc)
  if (token === 'mr-mime') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif';
  if (token === 'mime-jr') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif';
  if (token === 'nidoran-f') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif';
  if (token === 'nidoran-m') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif';

  // default to PokemonDB shiny animated gif path
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${token}.gif`;
}

export function renderShinyWeekly(weeklyData, container) {
  if (!container) return;
  // normalize input
  if (!Array.isArray(weeklyData) && weeklyData && Array.isArray(weeklyData.data)) weeklyData = weeklyData.data;
  if (!Array.isArray(weeklyData)) {
    container.innerHTML = '<div style="padding:1rem;color:var(--accent);">No weekly shiny data found.</div>';
    return;
  }

  // Basic container and structure
  container.classList.add('shiny-weekly');
  container.innerHTML = `
    <div class="layout">
      <aside class="weekly-calendar">
        <h2>Weeks</h2>
        <div class="week-list"></div>
      </aside>
      <section class="weekly-cards">
        <h3 class="week-title"></h3>
        <div class="dex-grid" aria-live="polite"></div>
        <button class="back-btn" style="display:none">← Back to weeks</button>
      </section>
    </div>

    <div class="shiny-modal" role="dialog" aria-hidden="true">
      <div class="panel" role="document">
        <img alt="" />
        <div class="modal-meta">
          <div class="modal-meta-left"></div>
          <div class="modal-meta-right"></div>
        </div>
      </div>
    </div>
  `;

  const weekList = container.querySelector('.week-list');
  const titleEl = container.querySelector('.week-title');
  const grid = container.querySelector('.dex-grid');
  const backBtn = container.querySelector('.back-btn');

  // Keep a reversed copy where index 0 is most recent
  const weeks = Array.from(weeklyData).slice().reverse();

  // IntersectionObserver for lazy-loading images
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const img = e.target;
      const src = img.dataset.src;
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
      io.unobserve(img);
    }
  }, { root: null, rootMargin: '200px', threshold: 0.01 }) : null;

  // Modal
  const modal = container.querySelector('.shiny-modal');
  const modalImg = modal.querySelector('img');
  const modalLeft = modal.querySelector('.modal-meta-left');
  const modalRight = modal.querySelector('.modal-meta-right');

  function openModal(imgSrc, mon) {
    modalImg.src = imgSrc || '';
    modalImg.alt = prettifyPokemonName(mon.name || '');
    modalLeft.textContent = `${prettifyPokemonName(mon.name || '')} • ${prettifyMemberName(mon.member || '')}`;
    modalRight.innerHTML = [
      mon.secret ? '<span class="badge secret">secret</span>' : '',
      mon.egg ? '<span class="badge egg">egg</span>' : '',
      mon.safari ? '<span class="badge safari">safari</span>' : '',
      mon.event ? '<span class="badge event">event</span>' : ''
    ].join(' ');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    // focus for accessibility
    modal.querySelector('.panel').focus?.();
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    modalImg.src = '';
  }
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal || ev.target.closest('.panel') === null) closeModal();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModal();
  });

  // Show week - builds cards and handles UI behavior
  function showWeek(week, triggeringButton = null) {
    titleEl.textContent = week.label || week.week || '';
    grid.innerHTML = ''; // clear

    const shinies = Array.isArray(week.shinies) ? week.shinies : [];

    if (shinies.length === 0) {
      grid.innerHTML = `<div style="padding:1rem;color:var(--muted)">No shinies logged this week.</div>`;
    } else {
      shinies.forEach(mon => {
        const name = prettifyPokemonName(mon.name || '');
        const imgUrl = getPokemonGif(mon.name || name) || '';
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
          <div class="img-wrap">
            <img src="${PLACEHOLDER}" alt="${name}" data-src="${imgUrl}" loading="lazy" />
          </div>
          <div class="card-title">
            <div>
              <div class="name">${name}</div>
              <div class="member">${prettifyMemberName(mon.member || '')}</div>
            </div>
            <div></div>
          </div>
          <div class="badges">
            ${mon.secret ? '<span class="badge secret">secret</span>' : ''}
            ${mon.egg ? '<span class="badge egg">egg</span>' : ''}
            ${mon.safari ? '<span class="badge safari">safari</span>' : ''}
            ${mon.event ? '<span class="badge event">event</span>' : ''}
          </div>
        `;

        const img = card.querySelector('img');
        img.addEventListener('error', () => {
          // fallback to static png sprites when gif missing
          if (img.dataset.src && img.dataset.src.includes('/anim/')) {
            img.src = img.dataset.src.replace('/anim/shiny/', '/sprites/black-white/').replace('.gif','.png');
          } else {
            img.src = PLACEHOLDER;
          }
        });
        img.addEventListener('click', () => openModal(img.dataset.src || img.src, mon));

        grid.appendChild(card);
        if (io && img.dataset.src) io.observe(img);
      });
    }

    // Show back button and set its behavior
    backBtn.style.display = 'inline-block';
    backBtn.onclick = () => {
      titleEl.textContent = '';
      grid.innerHTML = '';
      weekList.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
      backBtn.style.display = 'none';
    };

    // Ensure triggering button is visible and focused
    if (triggeringButton) {
      try {
        triggeringButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        triggeringButton.focus({ preventScroll: true });
      } catch (e) { /* ignore */ }
    }

    // Bring the cards area into view on long pages (nice UX)
    try {
      const cardsSection = container.querySelector('.weekly-cards');
      if (cardsSection) cardsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { /* ignore */ }
  }

  // Build week buttons
  weeks.forEach((week, idx) => {
    const btn = document.createElement('button');
    btn.className = 'week-btn';
    btn.type = 'button';
    btn.textContent = week.label || week.week || `Week ${idx+1}`;
    btn.dataset.index = idx;

    btn.addEventListener('click', () => {
      weekList.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showWeek(week, btn);
    });

    weekList.appendChild(btn);

    // auto-select the most recent (index 0)
    if (idx === 0) {
      btn.classList.add('active');
      // Slight delay to allow layout paint; not necessary but smoother for some browsers
      setTimeout(() => showWeek(week, btn), 0);
    }
  });

  // Accessibility: allow keyboard navigation for week list
  weekList.addEventListener('keydown', (ev) => {
    const active = weekList.querySelector('.week-btn.active');
    const buttons = Array.from(weekList.querySelectorAll('.week-btn'));
    if (!buttons.length) return;

    if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') {
      ev.preventDefault();
      const nextIndex = Math.min(buttons.indexOf(active) + 1 || 0, buttons.length -1);
      buttons[nextIndex].click();
    } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') {
      ev.preventDefault();
      const prevIndex = Math.max((buttons.indexOf(active) || 0) - 1, 0);
      buttons[prevIndex].click();
    }
  });
}
