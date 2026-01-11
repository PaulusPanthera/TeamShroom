// src/features/shinyweekly/shinyweekly.ui.js
// Shiny Weekly — UI ONLY
// Render-only module. Consumes aggregated weekly model.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { getMemberSprite } from '../../utils/membersprite.js';

/* ---------------------------------------------------------
   SPRITES
--------------------------------------------------------- */

function getPokemonGif(pokemonKey) {
  const overrides = {
    mrmime: 'mr-mime',
    mimejr: 'mime-jr',
    'nidoran-f': 'nidoran-f',
    'nidoran-m': 'nidoran-m',
    typenull: 'type-null',
    'porygon-z': 'porygon-z'
  };

  const key = overrides[pokemonKey] || pokemonKey;

  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

/* ---------------------------------------------------------
   RENDER
--------------------------------------------------------- */

function renderShinyWeekly(weeks, container, membersData = []) {
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
        ${week.shinyCount} Shinies •
        ${week.hunterCount} Hunters
      </div>
    `;

    const body = document.createElement('div');
    body.className = 'weekly-body';
    body.style.display = index === 0 ? 'block' : 'none';

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    Object.values(week.members).forEach(memberGroup => {
      let state = -1;
      const wrapper = document.createElement('div');

      function renderState() {
        wrapper.innerHTML = '';

        if (state === -1) {
          wrapper.innerHTML = renderUnifiedCard({
            name: memberGroup.name,
            img: getMemberSprite(memberGroup.key, membersData),
            info: `Shinies: ${memberGroup.shinies.length}`,
            cardType: 'member'
          });
        } else {
          const mon = memberGroup.shinies[state];

          const symbols = {
            secret: !!mon.secret,
            alpha: !!mon.alpha,
            run: !!mon.run,
            favorite: !!mon.favorite
          };

          if (mon.method) {
            symbols[mon.method] = true;
          }

          wrapper.innerHTML = renderUnifiedCard({
            name: prettifyPokemonName(mon.pokemon),
            img: getPokemonGif(mon.pokemon),
            info: '',
            cardType: 'pokemon',
            lost: !!mon.lost,
            symbols,
            clip: mon.clip || null
          });
        }

        wrapper.firstElementChild.onclick = () => {
          state++;
          if (state >= memberGroup.shinies.length) state = -1;
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

/* ---------------------------------------------------------
   EXPLICIT EXPORT SURFACE
--------------------------------------------------------- */

export { renderShinyWeekly };
