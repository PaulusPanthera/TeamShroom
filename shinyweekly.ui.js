// shinyweekly.ui.js
// Renders Shiny Weekly UI only (ES Module)

import { buildWeeklyViewModel } from './shinyweekly.js';
import { renderUnifiedCard } from './unifiedcard.js';

export function renderShinyWeekly(rawWeeklyData, container) {
  if (!container || !Array.isArray(rawWeeklyData)) return;

  container.innerHTML = "";

  const weeks = buildWeeklyViewModel(rawWeeklyData);

  weeks.forEach((week, idx) => {
    const weekCard = document.createElement("div");
    weekCard.className = "weekly-card";

    // HEADER
    const header = document.createElement("div");
    header.className = "weekly-header";
    header.innerHTML = `
      <div class="weekly-title">${week.label}</div>
      <div class="weekly-meta">
        ⭐ ${week.shinyCount} Shinies • 👥 ${week.hunterCount} Hunters
        ${week.topHunter ? ` • 🏆 ${week.topHunter}` : ""}
      </div>
    `;

    // BODY
    const body = document.createElement("div");
    body.className = "weekly-body";
    body.style.display = idx === 0 ? "block" : "none";

    Object.entries(week.members).forEach(([member, shinies]) => {
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

      const shinyGrid = document.createElement("div");
      shinyGrid.className = "weekly-shiny-grid";

      shinies.forEach(shiny => {
        shinyGrid.appendChild(renderUnifiedCard(shiny));
      });

      memberRow.appendChild(memberHeader);
      memberRow.appendChild(shinyGrid);
      body.appendChild(memberRow);
    });

    header.onclick = () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    };

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
