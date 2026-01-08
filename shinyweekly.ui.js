/* shinyweekly.ui.js */
/* Renders Shiny Weekly UI only */

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
        ⭐ ${week.shinyCount} Shinies
        &nbsp;•&nbsp;
        👥 ${week.hunterCount} Hunters
        ${week.topHunter ? `&nbsp;•&nbsp; 🏆 ${week.topHunter}` : ""}
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

      // SPRITE WITH FALLBACK
      const spriteKey = member.toLowerCase().replace(/[^a-z0-9]/g, '');
      const img = document.createElement("img");
      img.className = "weekly-member-sprite";
      img.src = `img/membersprites/${spriteKey}sprite.png`;
      img.onerror = () => {
        img.src = "img/membersprites/examplesprite.png";
      };

      const nameSpan = document.createElement("span");
      nameSpan.textContent = member;

      const countSpan = document.createElement("span");
      countSpan.className = "weekly-member-count";
      countSpan.textContent = shinies.length;

      memberHeader.appendChild(img);
      memberHeader.appendChild(nameSpan);
      memberHeader.appendChild(countSpan);

      const shinyGrid = document.createElement("div");
      shinyGrid.className = "weekly-shiny-grid";

      shinies.forEach(shiny => {
        const card = renderUnifiedCard(shiny);
        shinyGrid.appendChild(card);
      });

      memberRow.appendChild(memberHeader);
      memberRow.appendChild(shinyGrid);
      body.appendChild(memberRow);
    });

    header.addEventListener("click", () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
