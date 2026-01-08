// shinyweekly.ui.js
// Shiny Weekly UI using UNIFIED CARDS
// Member card ⇄ Pokémon cards (shuffle swap, no expansion)

import { renderUnifiedCard } from './unifiedcard.js';
import { prettifyPokemonName } from './utils.js';

export function renderShinyWeekly(weeklyData, container) {
  if (!container || !Array.isArray(weeklyData)) return;
  container.innerHTML = "";

  // newest week first
  const weeks = [...weeklyData].reverse();

  weeks.forEach((week, weekIndex) => {
    const weekCard = document.createElement("div");
    weekCard.className = "weekly-card";

    /* ===== HEADER ===== */
    const header = document.createElement("div");
    header.className = "weekly-header";
    header.innerHTML = `
      <div class="weekly-title">${week.label || week.week}</div>
      <div class="weekly-meta">
        ⭐ ${week.shinies.length} Shinies • 👥 ${
          new Set(week.shinies.map(s => s.member)).size
        } Hunters
      </div>
    `;

    /* ===== BODY ===== */
    const body = document.createElement("div");
    body.className = "weekly-body";
    body.style.display = weekIndex === 0 ? "block" : "none";

    /* Group shinies by member */
    const byMember = {};
    week.shinies.forEach(shiny => {
      if (!byMember[shiny.member]) byMember[shiny.member] = [];
      byMember[shiny.member].push(shiny);
    });

    /* Member grid */
    const memberGrid = document.createElement("div");
    memberGrid.className = "dex-grid";

    Object.entries(byMember).forEach(([member, shinies]) => {
      const slot = document.createElement("div");
      slot.className = "weekly-member-slot";
      slot.dataset.member = member;
      slot.dataset.open = "false";

      /* MEMBER CARD */
      const memberCardHTML = renderUnifiedCard({
        name: member,
        img: `img/membersprites/${member.toLowerCase()}sprite.png`,
        info: `Shinies: ${shinies.length}`,
        cardType: "member"
      });

      slot.innerHTML = memberCardHTML;

      slot.onclick = () => {
        const isOpen = slot.dataset.open === "true";
        slot.innerHTML = "";

        if (!isOpen) {
          // show Pokémon cards
          const pokeGrid = document.createElement("div");
          pokeGrid.className = "dex-grid";

          shinies.forEach(shiny => {
            pokeGrid.innerHTML += renderUnifiedCard({
              name: prettifyPokemonName(shiny.name),
              img: `img/pokemon/${shiny.name.toLowerCase()}.png`,
              cardType: "pokemon",
              lost: shiny.lost,
              symbols: {
                secret: shiny.secret,
                safari: shiny.safari,
                egg: shiny.egg,
                event: shiny.event,
                alpha: shiny.alpha
              }
            });
          });

          slot.appendChild(pokeGrid);
          slot.dataset.open = "true";
        } else {
          // restore member card
          slot.innerHTML = memberCardHTML;
          slot.dataset.open = "false";
        }
      };

      memberGrid.appendChild(slot);
    });

    body.appendChild(memberGrid);

    /* Toggle week */
    header.onclick = () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    };

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
