// shinyweekly.ui.js
// Shiny Weekly UI
// Unified MEMBER card ⇄ Pokémon cards (1-by-1 shuffle)

import { renderUnifiedCard } from "./unifiedcard.js";
import { prettifyPokemonName, getPokemonGifUrl } from "./utils.js";

const MEMBER_FALLBACK = "img/membersprites/placeholder.png";

function createMemberSprite(name) {
  const img = document.createElement("img");
  img.alt = name;

  const base = `img/membersprites/${name.toLowerCase()}sprite`;
  img.src = `${base}.png`;

  img.onerror = () => {
    if (!img.dataset.triedGif) {
      img.dataset.triedGif = "1";
      img.src = `${base}.gif`;
    } else {
      img.src = MEMBER_FALLBACK;
    }
  };

  return img.src;
}

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

    /* Grid */
    const grid = document.createElement("div");
    grid.className = "dex-grid";

    Object.entries(byMember).forEach(([member, shinies]) => {
      const slot = document.createElement("div");
      slot.className = "weekly-member-slot";

      const state = {
        mode: "member",
        index: 0
      };

      function render() {
        slot.innerHTML = "";

        if (state.mode === "member") {
          slot.innerHTML = renderUnifiedCard({
            name: member,
            img: createMemberSprite(member),
            info: `Shinies: ${shinies.length}`,
            cardType: "member"
          });
        } else {
          const shiny = shinies[state.index];

          slot.innerHTML = renderUnifiedCard({
            name: prettifyPokemonName(shiny.name),
            img: getPokemonGifUrl(shiny.name),
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
        }
      }

      slot.onclick = () => {
        if (state.mode === "member") {
          state.mode = "pokemon";
          state.index = 0;
        } else {
          state.index++;
          if (state.index >= shinies.length) {
            state.mode = "member";
            state.index = 0;
          }
        }
        render();
      };

      render();
      grid.appendChild(slot);
    });

    body.appendChild(grid);

    header.onclick = () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    };

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
