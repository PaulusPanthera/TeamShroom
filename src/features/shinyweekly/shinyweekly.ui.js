// src/features/shinyweekly/shinyweekly.ui.js
// v2.0.0-beta
// Shiny Weekly UI renderer (DOM-only)

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName, getPokemonDbShinyGifSrc } from '../../utils/utils.js';
import { getMemberSprite } from '../../utils/membersprite.js';

/* ---------------------------------------------------------
   RENDER
--------------------------------------------------------- */

function renderShinyWeekly(weeks, container, membersData = []) {
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

    const memberGroups = Object.values(week.membersByOt || week.members || {});

    memberGroups.forEach(memberGroup => {
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
            safari: !!mon.safari,
            run: !!mon.run
          };

          if (mon.method && mon.method !== 'safari') symbols[mon.method] = true;

          wrapper.innerHTML = renderUnifiedCard({
            name: prettifyPokemonName(mon.pokemon),
            img: getPokemonDbShinyGifSrc(mon.pokemon),
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
