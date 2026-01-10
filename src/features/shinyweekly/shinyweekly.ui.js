// shinyweekly.ui.js
// Shiny Weekly — HARD CONTRACT
// UI ONLY. No shared state. One export.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import {
  normalizePokemonName,
  prettifyPokemonName
} from '../../utils/utils.js';
import { getMemberSprite } from '../../utils/membersprite.js';

/* ---------------------------------------------------------
   SPRITES
--------------------------------------------------------- */

function getPokemonGif(name) {
  const n = name.toLowerCase().replace(/[\s.'’\-]/g, '');
  const map = {
    mrmime: 'mr-mime',
    mimejr: 'mime-jr',
    nidoranf: 'nidoran-f',
    nidoranm: 'nidoran-m',
    typenull: 'type-null',
    porygonz: 'porygon-z'
  };
  const key = map[n] || normalizePokemonName(name);
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

/* ---------------------------------------------------------
   EXPORT
--------------------------------------------------------- */

export function renderShinyWeekly(weeks, container, membersData = []) {
  if (!Array.isArray(weeks) || !container) return;

  container.innerHTML = '';

  const orderedWeeks = [...weeks].reverse();

  orderedWeeks.forEach((week, index) => {
    const weekCard = document.createElement('div');
    weekCard.className = 'weekly-card';

    const header = document.createElement('div');
    header.className = 'weekly-header';
    header.innerHTML = `
      <div class="weekly-title">${week.label || week.week}</div>
      <div class="weekly-meta">
        ${week.shinies.length} Shinies •
        ${new Set(week.shinies.map(s => s.member)).size} Hunters
      </div>
    `;

    const body = document.createElement('div');
    body.className = 'weekly-body';
    body.style.display = index === 0 ? 'block' : 'none';

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    const byMember = {};
    week.shinies.forEach(s => {
      byMember[s.member] ??= [];
      byMember[s.member].push(s);
    });

    Object.entries(byMember).forEach(([member, shinies]) => {
      let state = -1;
      const wrapper = document.createElement('div');

      function renderState() {
        wrapper.innerHTML = '';

        if (state === -1) {
          wrapper.innerHTML = renderUnifiedCard({
            name: member,
            img: getMemberSprite(member, membersData),
            info: `Shinies: ${shinies.length}`,
            cardType: 'member',
            states: { member: true }
          });
        } else {
          const mon = shinies[state];
          wrapper.innerHTML = renderUnifiedCard({
            name: prettifyPokemonName(mon.name),
            img: getPokemonGif(mon.name),
            info: '',
            cardType: 'pokemon',
            states: {
              pokemon: true,
              lost: !!mon.lost
            },
            symbols: {
              secret: !!mon.secret,
              safari: !!mon.safari,
              egg: !!mon.egg,
              event: !!mon.event,
              alpha: !!mon.alpha
            }
          });
        }

        wrapper.firstElementChild.onclick = () => {
          state++;
          if (state >= shinies.length) state = -1;
          renderState();
        };
      }

      renderState();
      grid.appendChild(wrapper);
    });

    body.appendChild(grid);
    header.onclick = () => {
      body.style.display =
        body.style.display === 'none' ? 'block' : 'none';
    };

    weekCard.append(header, body);
    container.appendChild(weekCard);
  });
}
