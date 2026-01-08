// general/shinyweekly.ui.js
// Full updated renderer implementing:
// - horizontal week selector (with counts)
// - week summary panel (totals, unique hunters, top hunter, attribute counts)
// - responsive card grid grouped by member or by pokemon
// - toggles to switch grouping mode
// - uses utils.js exports: prettifyPokemonName, prettifyMemberName, normalizePokemonName

import { prettifyPokemonName, prettifyMemberName, normalizePokemonName } from './utils.js';

const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='; // 1x1

function getPokemonGif(rawName) {
  if (!rawName) return '';
  const token = normalizePokemonName(rawName);
  if (!token) return '';
  const map = {
    'mr-mime': 'mr-mime',
    'mime-jr': 'mime-jr',
    'nidoran-f': 'nidoran-f',
    'nidoran-m': 'nidoran-m'
  };
  if (map[token]) return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${map[token]}.gif`;
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${token}.gif`;
}

function summarizeWeek(week) {
  const shinies = Array.isArray(week.shinies) ? week.shinies : [];
  const total = shinies.length;
  const hunters = new Map();
  const attrs = { egg:0, safari:0, secret:0, lost:0 };

  for (const s of shinies) {
    const m = String(s.member || 'Unknown').trim();
    hunters.set(m, (hunters.get(m) || 0) + 1);
    if (s.egg) attrs.egg++;
    if (s.safari) attrs.safari++;
    if (s.secret) attrs.secret++;
    if (s.lost) attrs.lost++;
  }

  // Unique hunters
  const unique = hunters.size;

  // Top hunter (first by count, tie -> lexicographic)
  let top = '';
  let topCount = 0;
  for (const [name, count] of hunters.entries()) {
    if (count > topCount || (count === topCount && name.toLowerCase() < (top||'').toLowerCase())) {
      top = name;
      topCount = count;
    }
  }

  return { total, unique, top, topCount, attrs };
}

export function renderShinyWeekly(weeklyData, container) {
  if (!container) return;
  if (!Array.isArray(weeklyData) && weeklyData && Array.isArray(weeklyData.data)) weeklyData = weeklyData.data;
  if (!Array.isArray(weeklyData)) {
    container.innerHTML = '<div style="padding:1rem;color:var(--accent);">No weekly shiny data found.</div>';
    return;
  }

  container.classList.add('shiny-weekly');

  // Build base layout: top row (strip + summary + controls) + cards area
  container.innerHTML = `
    <div class="top-row">
      <div>
        <div class="week-strip" role="tablist" aria-label="Weeks"></div>
      </div>
      <aside class="week-summary" aria-live="polite">
        <h4>Week Summary</h4>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="label">Total Shinies</div>
            <div class="value total">—</div>
          </div>
          <div class="summary-item">
            <div class="label">Unique Hunters</div>
            <div class="value unique">—</div>
          </div>
          <div class="summary-item">
            <div class="label">Top Hunter</div>
            <div class="value top">—</div>
          </div>
          <div class="summary-item">
            <div class="label">Top Count</div>
            <div class="value topcount">—</div>
          </div>
        </div>
        <div style="height:8px"></div>
        <div class="summary-grid">
          <div class="summary-item"><div class="label">Egg</div><div class="value egg">0</div></div>
          <div class="summary-item"><div class="label">Safari</div><div class="value safari">0</div></div>
          <div class="summary-item"><div class="label">Secret</div><div class="value secret">0</div></div>
          <div class="summary-item"><div class="label">Lost</div><div class="value lost">0</div></div>
        </div>

        <div class="controls" style="margin-top:10px;">
          <label class="toggle"><input type="radio" name="groupby" value="member" checked /> Group by member</label>
          <label class="toggle"><input type="radio" name="groupby" value="pokemon" /> Group by Pokémon</label>
        </div>
      </aside>
    </div>

    <section class="weekly-cards" aria-live="polite">
      <h3 class="week-title"></h3>
      <div class="content-area"></div>
    </section>

    <div class="shiny-modal" role="dialog" aria-hidden="true">
      <div class="panel" role="document" tabindex="-1">
        <img alt="" />
        <div class="modal-meta">
          <div class="modal-meta-left"></div>
          <div class="modal-meta-right"></div>
        </div>
      </div>
    </div>
  `;

  const weeks = Array.from(weeklyData).slice().reverse(); // newest first
  const strip = container.querySelector('.week-strip');
  const summary = container.querySelector('.week-summary');
  const titleEl = container.querySelector('.week-title');
  const contentArea = container.querySelector('.content-area');

  // IntersectionObserver for lazy images
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
      mon.lost ? '<span class="badge lost">lost</span>' : ''
    ].join(' ');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    modal.querySelector('.panel').focus?.();
  }
  function closeModal() {
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

  // Helper to render a group heading and a grid for its items
  function renderGroup(title, subtitle, items) {
    const g = document.createElement('div');
    g.className = 'group';
    const header = document.createElement('div');
    header.className = 'group-title';
    header.innerHTML = `<div>${title}</div><div class="sub">${subtitle || ''}</div>`;
    g.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    for (const mon of items) {
      const name = prettifyPokemonName(mon.name || '');
      const imgUrl = getPokemonGif(mon.name || name) || '';
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="img-wrap">
          <img src="${PLACEHOLDER}" alt="${name}" data-src="${imgUrl}" loading="lazy"/>
        </div>
        <div class="card-title">
          <div>
            <div class="name">${name}</div>
            <div class="member">${prettifyMemberName(mon.member || '')}</div>
          </div>
        </div>
        <div class="attr-row">
          ${mon.egg ? '<div class="attr egg">🥚 Egg</div>' : ''}
          ${mon.safari ? '<div class="attr safari">🌵 Safari</div>' : ''}
          ${mon.secret ? '<div class="attr secret">🔒 Secret</div>' : ''}
          ${mon.lost ? '<div class="attr lost">⚠️ Lost</div>' : ''}
        </div>
      `;
      const img = card.querySelector('img');
      img.addEventListener('error', () => {
        if (img.dataset.src && img.dataset.src.includes('/anim/')) {
          img.src = img.dataset.src.replace('/anim/shiny/', '/sprites/black-white/').replace('.gif','.png');
        } else {
          img.src = PLACEHOLDER;
        }
      });
      img.addEventListener('click', () => openModal(img.dataset.src || img.src, mon));

      grid.appendChild(card);
      if (io && img.dataset.src) io.observe(img);
    }

    g.appendChild(grid);
    return g;
  }

  // main show function — accepts a week and grouping mode
  function showWeek(week, groupBy = 'member', triggeringChip = null) {
    // update title
    titleEl.textContent = week.label || week.week || '';

    // update summary
    const s = summarizeWeek(week);
    summary.querySelector('.total').textContent = s.total;
    summary.querySelector('.unique').textContent = s.unique;
    summary.querySelector('.top').textContent = s.top || '—';
    summary.querySelector('.topcount').textContent = s.topCount || '—';
    summary.querySelector('.egg').textContent = s.attrs.egg;
    summary.querySelector('.safari').textContent = s.attrs.safari;
    summary.querySelector('.secret').textContent = s.attrs.secret;
    summary.querySelector('.lost').textContent = s.attrs.lost;

    // build groups
    contentArea.innerHTML = ''; // clear
    const shinies = Array.isArray(week.shinies) ? week.shinies : [];

    if (groupBy === 'member') {
      // group by member
      const map = new Map();
      for (const s of shinies) {
        const key = String(s.member || 'Unknown').trim();
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(s);
      }
      // order by top contributors first
      const ordered = Array.from(map.entries()).sort((a,b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
      for (const [member, items] of ordered) {
        const grp = renderGroup(member, `${items.length} shiny${items.length===1?'':'ies'}`, items);
        contentArea.appendChild(grp);
      }
    } else {
      // group by pokemon
      const map = new Map();
      for (const s of shinies) {
        const key = prettifyPokemonName(s.name || 'Unknown');
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(s);
      }
      const ordered = Array.from(map.entries()).sort((a,b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
      for (const [poke, items] of ordered) {
        const grp = renderGroup(poke, `${items.length} found`, items);
        contentArea.appendChild(grp);
      }
    }

    // scroll chip into view if provided
    if (triggeringChip) {
      try {
        triggeringChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        triggeringChip.focus({ preventScroll: true });
      } catch (e) { /* ignore */ }
    }
    // bring cards into view for better UX on long pages
    try { contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(e){}
  }

  // Build week chips
  strip.innerHTML = '';
  weeks.forEach((week, i) => {
    const total = Array.isArray(week.shinies) ? week.shinies.length : 0;
    const chip = document.createElement('button');
    chip.className = 'week-chip';
    chip.type = 'button';
    chip.innerHTML = `<div style="display:flex;flex-direction:column;align-items:flex-start;">
                        <div style="font-weight:800">${week.label || week.week || 'Week'}</div>
                        <div style="font-size:0.8rem;color:var(--muted);margin-top:6px;">${new Date(0).toString()/*placeholder not shown*/}</div>
                      </div>
                      <div class="count">${total}</div>`;
    // replace the pointless date line above with none; label is sufficient — keep HTML small
    // wire click
    chip.addEventListener('click', () => {
      // set active visual
      strip.querySelectorAll('.week-chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      // show week with current grouping
      const current = container.querySelector('input[name="groupby"]:checked')?.value || 'member';
      showWeek(week, current, chip);
    });
    strip.appendChild(chip);

    // auto-select most recent week
    if (i === 0) {
      chip.classList.add('active');
      setTimeout(()=>showWeek(week, container.querySelector('input[name="groupby"]:checked')?.value || 'member', chip), 0);
    }
  });

  // Wire group toggles
  container.querySelectorAll('input[name="groupby"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const group = radio.value;
      const activeChip = strip.querySelector('.week-chip.active') || strip.querySelector('.week-chip');
      const idx = Array.from(strip.children).indexOf(activeChip);
      const week = weeks[idx] || weeks[0];
      if (week) showWeek(week, group, activeChip);
    });
  });
}
