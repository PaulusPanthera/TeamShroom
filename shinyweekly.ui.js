// shinyweekly.ui.js
// Clean, purpose-built Shiny Weekly UI
// Uses DB Pokémon GIFs and proper name normalization
// NO unified cards, NO broken fallbacks, NO console spam

import { normalizePokemonName, prettifyPokemonName } from './utils.js';

export function renderShinyWeekly(weeklyData, container) {
  if (!container || !Array.isArray(weeklyData)) return;

  container.innerHTML = "";

  [...weeklyData].reverse().forEach((week, idx) => {
    const weekCard = document.createElement("div");
    weekCard.className = "weekly-card";

    /* ===== HEADER ===== */
    const header = document.createElement("div");
    header.className = "weekly-header";

    const uniqueHunters = new Set(
      (week.shinies || []).map(s => s.member)
    ).size;

    header.innerHTML = `
      <div class="weekly-title">${week.label || week.week}</div>
      <div class="weekly-meta">
        ⭐ ${(week.shinies || []).length} Shinies • 👥 ${uniqueHunters} Hunters
      </div>
    `;

    /* ===== BODY ===== */
    const body = document.createElement("div");
    body.className = "weekly-body";
    body.style.display = idx === 0 ? "block" : "none";

    /* ===== GROUP SHINIES BY MEMBER ===== */
    const byMember = {};
    (week.shinies || []).forEach(shiny => {
      if (!byMember[shiny.member]) byMember[shiny.member] = [];
      byMember[shiny.member].push(shiny);
    });

    Object.entries(byMember).forEach(([member, shinies]) => {
      const memberBlock = document.createElement("div");
      memberBlock.className = "weekly-member-row";

      memberBlock.innerHTML = `
        <div class="weekly-member-header">
          <img
            class="weekly-member-sprite"
            src="img/membersprites/${member.toLowerCase()}sprite.png"
            onerror="this.onerror=null;this.src='img/membersprites/examplesprite.png';"
          >
          <span class="weekly-member-name">${member}</span>
          <span class="weekly-member-count">${shinies.length}</span>
        </div>
        <div class="weekly-shiny-grid"></div>
      `;

      const grid = memberBlock.querySelector(".weekly-shiny-grid");

      shinies.forEach(shiny => {
        const tile = document.createElement("div");
        tile.className = "weekly-shiny-tile";

        const normalized = normalizePokemonName(shiny.name);
        const displayName = prettifyPokemonName(normalized);

        tile.innerHTML = `
          <img
            src="https://img.pokemondb.net/sprites/black-white/anim/shiny/${normalized}.gif"
            alt="${displayName}"
            loading="lazy"
          >
          <div class="weekly-shiny-name">${displayName}</div>
        `;

        grid.appendChild(tile);
      });

      body.appendChild(memberBlock);
    });

    /* ===== TOGGLE WEEK ===== */
    header.addEventListener("click", () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
