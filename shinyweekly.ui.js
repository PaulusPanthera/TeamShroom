// shinyweekly.ui.js
// Shiny Weekly — Design System v1 (compact card variant)

import { renderUnifiedCard } from './unifiedcard.js';
import { normalizePokemonName, prettifyPokemonName, normalizeMemberName } from './utils.js';

/* ---------------------------------------------------------
   SPRITES
--------------------------------------------------------- */

function getPokemonGif(name) {
  const n = name.replace(/[\s.'’\-]/g, '').toLowerCase();
  if (n === 'mrmime') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif';
  if (n === 'mimejr') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif';
  if (n === 'nidoranf') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif';
  if (n === 'nidoranm') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif';
  if (n === 'typenull') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/type-null.gif';
  if (n === 'porygonz') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/porygon-z.gif';

  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${normalizePokemonName(name)}.gif`;
}

function applyMemberSprite(imgEl, memberName) {
  const base = normalizeMemberName(memberName);
  const formats = ['png', 'gif', 'jpg'];
  let idx = 0;

  imgEl.src = 'img/membersprites/examplesprite.png';

  function tryNext() {
    if (idx >= formats.length) return;
    const url = `img/membersprites/${base}sprite.${formats[idx]}`;
    const test = new Image();
    test.onload = () => (imgEl.src = url);
    test.onerror = () => {
      idx++;
      tryNext();
    };
    test.src = url;
  }

  tryNext();
}

/* ---------------------------------------------------------
   RENDER
--------------------------------------------------------- */

export function renderShinyWeekly(weeks, container) {
  if (!container || !Array.isArray(weeks)) return;
  container.innerHTML = '';

  const orderedWeeks = [...weeks].reverse();

  orderedWeeks.forEach((week, index) => {
    const weekCard = document.createElement('div');
    weekCard.className = 'weekly-card';

    /* ---------- HEADER ---------- */

    const header = document.createElement('div');
    header.className = 'weekly-header';
    header.innerHTML = `
      <div class="weekly-title">${week.label || week.week}</div>
      <div class="weekly-meta">
        ${week.shinies.length} Shinies •
        ${new Set(week.shinies.map(s => s.member)).size} Hunters
      </div>
    `;

    /* ---------- BODY ---------- */

    const body = document.createElement('div');
    body.className = 'weekly-body';
    body.style.display = index === 0 ? 'block' : 'none';

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    /* Group by member */

    const byMember = {};
    week.shinies.forEach(s => {
      byMember[s.member] ??= [];
      byMember[s.member].push(s);
    });

    Object.entries(byMember).forEach(([member, shinies]) => {
      let stateIndex = -1;
      const wrapper = document.createElement('div');

      function renderState() {
        wrapper.innerHTML = '';

        /* MEMBER CARD */
        if (stateIndex === -1) {
          wrapper.innerHTML = renderUnifiedCard({
            name: member,
            img: 'img/membersprites/examplesprite.png',
            info: `Shinies: ${shinies.length}`,
            cardType: 'member',
            states: {
              member: true,
              compact: true
            }
          });

          applyMemberSprite(wrapper.querySelector('.unified-img'), member);
        }

        /* POKÉMON CARD */
        else {
          const shiny = shinies[stateIndex];
          wrapper.innerHTML = renderUnifiedCard({
            name: prettifyPokemonName(shiny.name),
            img: getPokemonGif(shiny.name),
            info: '',
            cardType: 'pokemon',
            states: {
              pokemon: true,
              compact: true,
              lost: !!shiny.lost
            },
            symbols: {
              secret: !!shiny.secret,
              safari: !!shiny.safari,
              egg: !!shiny.egg,
              event: !!shiny.event,
              alpha: !!shiny.alpha
            }
          });
        }

        const card = wrapper.firstElementChild;
        card.style.cursor = 'pointer';
        card.onclick = () => {
          stateIndex++;
          if (stateIndex >= shinies.length) stateIndex = -1;
          renderState();
        };
      }

      renderState();
      grid.appendChild(wrapper);
    });

    body.appendChild(grid);

    header.onclick = () => {
      body.style.display = body.style.display === 'none' ? 'block' : 'none';
    };

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
