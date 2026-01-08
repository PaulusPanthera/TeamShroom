// shinyweekly.ui.js
// Improved renderer (works standalone). Requires prettifyPokemonName from utils.js
// - Uses lazy-loading with IntersectionObserver
// - Uses card markup and modal preview
// - Expects weeklyData to be an array of week objects (or an object with .data)

import { prettifyPokemonName } from './utils.js';

function getPokemonGif(rawName) {
  if (!rawName) return '';
  let n = String(rawName).toLowerCase().trim();
  n = n.replace(/\u2640/g, ' f').replace(/\u2642/g, ' m');
  n = n.replace(/\(.*?\)/g, '')
       .replace(/\b(safari|event|secret|egg|ss|run|lost|mgb)\b/g, '')
       .replace(/[*]/g, '')
       .trim();
  if (n.includes(' ')) n = n.split(' ')[0];
  const map = {
    'magikar':'magikarp','cryognal':'cryogonal','wurmpel':'wurmple',
    "farfetch'd":'farfetchd',"mr mime":'mr-mime',"mime jr":'mime-jr',
    'nidoran f':'nidoran-f','nidoran m':'nidoran-m','nidoran-female':'nidoran-f'
  };
  if (map[n]) n = map[n];
  n = n.replace(/[^a-z0-9\-]/g,'');
  if (n === 'mrmime') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif';
  if (n === 'mime-jr') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif';
  if (n === 'nidoran-f') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif';
  if (n === 'nidoran-m') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif';
  if (!n) return '';
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${n}.gif`;
}

const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='; // 1x1

export function renderShinyWeekly(weeklyData, container) {
  if (!container) return;
  // normalize input
  if (!Array.isArray(weeklyData) && weeklyData && Array.isArray(weeklyData.data)) weeklyData = weeklyData.data;
  if (!Array.isArray(weeklyData)) {
    container.innerHTML = '<div style="padding:1rem;color:var(--accent);">No weekly shiny data found.</div>';
    return;
  }

  container.classList.add('shiny-weekly');

  container.innerHTML = `
    <div class="layout">
      <aside class="weekly-calendar">
        <h2>Weeks</h2>
        <div class="week-list"></div>
      </aside>
      <section class="weekly-cards">
        <h3 class="week-title"></h3>
        <div class="dex-grid"></div>
        <button class="back-btn" style="display:none">← Back to weeks</button>
      </section>
    </div>

    <div class="shiny-modal" role="dialog" aria-hidden="true">
      <div class="panel">
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

  // Build buttons (newest first)
  [...weeklyData].reverse().forEach((week, idx) => {
    const btn = document.createElement('button');
    btn.className = 'week-btn';
    btn.textContent = week.label || week.week || `Week ${idx+1}`;
    btn.dataset.index = idx;
    btn.addEventListener('click', () => {
      // mark active
      weekList.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showWeek(week);
    });
    weekList.appendChild(btn);

    if (idx === 0) {
      // auto-select most recent
      btn.classList.add('active');
      showWeek( [...weeklyData].reverse()[0] );
    }
  });

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

  // modal handling
  const modal = container.querySelector('.shiny-modal');
  const modalImg = modal.querySelector('img');
  const modalLeft = modal.querySelector('.modal-meta-left');
  const modalRight = modal.querySelector('.modal-meta-right');

  modal.addEventListener('click', (ev) => {
    if (ev.target === modal || ev.target.closest('.panel') === null) closeModal();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModal();
  });

  function openModal(imgSrc, mon) {
    modalImg.src = imgSrc || '';
    modalImg.alt = prettifyPokemonName(mon.name || '');
    modalLeft.textContent = `${prettifyPokemonName(mon.name || '')} • ${mon.member || ''}`;
    modalRight.innerHTML = [
      mon.secret ? '<span class="badge secret">secret</span>' : '',
      mon.egg ? '<span class="badge egg">egg</span>' : '',
      mon.safari ? '<span class="badge safari">safari</span>' : '',
      mon.event ? '<span class="badge event">event</span>' : ''
    ].join(' ');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    modalImg.src = '';
  }

  function showWeek(week) {
    titleEl.textContent = week.label || week.week || '';
    grid.innerHTML = ''; // clear

    (week.shinies || []).forEach(mon => {
      const name = prettifyPokemonName(mon.name || '');
      const imgUrl = getPokemonGif(mon.name || name) || '';
      const card = document.createElement('article');
      card.className = 'card';
      // markup
      card.innerHTML = `
        <div class="img-wrap">
          <img src="${PLACEHOLDER}" alt="${name}" data-src="${imgUrl}" loading="lazy" />
        </div>
        <div class="card-title">
          <div>
            <div class="name">${name}</div>
            <div class="member">${mon.member || ''}</div>
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
      // image lazy load + click to enlarge
      const img = card.querySelector('img');
      img.addEventListener('error', () => {
        // fallback to static sprite if animated gif missing
        if (img.dataset.src && img.dataset.src.includes('/anim/')) {
          img.src = img.dataset.src.replace('/anim/shiny/', '/sprites/black-white/').replace('.gif','.png');
        } else {
          img.src = PLACEHOLDER;
        }
      });
      img.addEventListener('click', () => {
        openModal(img.dataset.src || img.src, mon);
      });

      grid.appendChild(card);
      if (io && img.dataset.src) io.observe(img);
    });

    // show back button to clear cards (optional)
    backBtn.style.display = 'inline-block';
    backBtn.onclick = () => {
      titleEl.textContent = '';
      grid.innerHTML = '';
      weekList.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
      backBtn.style.display = 'none';
    };
  }
}
