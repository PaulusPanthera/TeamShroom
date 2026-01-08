// shinyweekly.ui.js
// Clean, purpose-built Shiny Weekly UI (NO unified cards)

import { prettifyPokemonName } from './utils.js';

export function renderShinyWeekly(weeklyData, container) {
  if (!container) return;
  container.innerHTML = "";

  weeklyData.forEach((week, idx) => {
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
    body.style.display = idx === 0 ? "block" : "none";

    /* Group by member */
    const byMember = {};
    week.shinies.forEach(shiny => {
      if (!byMember[shiny.member]) byMember[shiny.member] = [];
      byMember[shiny.member].push(shiny);
    });

    Object.entries(byMember).forEach(([member, shinies]) => {
      const memberBlock = document.createElement("div");
      memberBlock.className = "weekly-member-row";

      memberBlock.innerHTML = `
        <div class="weekly-member-header">
          <img class="weekly-member-sprite"
               src="img/membersprites/${member.toLowerCase()}sprite.png"
               onerror="this.src='img/membersprites/examplesprite.png'">
          <span class="member-name">${member}</span>
          <span class="weekly-member-count">${shinies.length}</span>
        </div>
        <div class="weekly-shiny-grid"></div>
      `;

      const grid = memberBlock.querySelector(".weekly-shiny-grid");

      shinies.forEach(shiny => {
        const tile = document.createElement("div");
        tile.className = "weekly-shiny-tile";

        const displayName = prettifyPokemonName(shiny.name);

        tile.innerHTML = `
          <img
            src="img/pokemon/${shiny.name.toLowerCase()}.png"
            alt="${displayName}"
            onerror="this.src='img/pokemon/unknown.png'"
          >
          <div class="weekly-shiny-name">${displayName}</div>
        `;

        grid.appendChild(tile);
      });

      body.appendChild(memberBlock);
    });

    /* Toggle */
    header.onclick = () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    };

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
