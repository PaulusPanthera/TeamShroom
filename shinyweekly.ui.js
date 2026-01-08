// shinyweekly.ui.js
// Renders Shiny Weekly UI (ES MODULE VERSION)

import { renderUnifiedCard } from './unifiedcard.js';

export function renderShinyWeekly(containerId, rawWeeklyData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  rawWeeklyData.forEach((week, idx) => {
    const weekCard = document.createElement("div");
    weekCard.className = "weekly-card";

    /* ===== HEADER ===== */
    const header = document.createElement("div");
    header.className = "weekly-header";
    header.innerHTML = `
      <div class="weekly-title">${week.label || week.week}</div>
      <div class="weekly-meta">
        ⭐ ${week.shinies.length} Shinies
      </div>
    `;

    /* ===== BODY ===== */
    const body = document.createElement("div");
    body.className = "weekly-body";
    body.style.display = idx === 0 ? "block" : "none";

    /* Group by member */
    const members = {};
    week.shinies.forEach(shiny => {
      if (!members[shiny.member]) members[shiny.member] = [];
      members[shiny.member].push(shiny);
    });

    Object.entries(members).forEach(([member, shinies]) => {
      const memberRow = document.createElement("div");
      memberRow.className = "weekly-member-row";

      const memberHeader = document.createElement("div");
      memberHeader.className = "weekly-member-header";
      memberHeader.innerHTML = `
        <img class="weekly-member-sprite"
             src="img/membersprites/${member.toLowerCase()}sprite.png"
             onerror="this.src='img/membersprites/examplesprite.png'">
        <span>${member}</span>
        <span class="weekly-member-count">${shinies.length}</span>
      `;

      const grid = document.createElement("div");
      grid.className = "weekly-shiny-grid";

      shinies.forEach(shiny => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = renderUnifiedCard({
          name: shiny.name,
          img: `img/pokemon/${shiny.name.toLowerCase()}.png`,
          info: "",
          lost: shiny.lost,
          cardType: "pokemon",
          symbols: {
            secret: shiny.secret,
            safari: shiny.safari,
            egg: shiny.egg,
            event: shiny.event
          }
        });
        grid.appendChild(wrapper.firstElementChild);
      });

      memberRow.appendChild(memberHeader);
      memberRow.appendChild(grid);
      body.appendChild(memberRow);
    });

    /* Toggle */
    header.addEventListener("click", () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
