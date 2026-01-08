/* shinyweekly.ui.js */
/* Renders Shiny Weekly UI only */

function renderShinyWeekly(containerId, rawWeeklyData) {
  const container = document.getElementById(containerId);
  if (!container) return;

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
    body.style.display = idx === 0 ? "block" : "none"; // latest expanded

    Object.entries(week.members).forEach(([member, shinies]) => {
      const memberRow = document.createElement("div");
      memberRow.className = "weekly-member-row";

      const memberHeader = document.createElement("div");
      memberHeader.className = "weekly-member-header";
      memberHeader.innerHTML = `
        <img class="weekly-member-sprite"
             src="img/membersprites/${member.toLowerCase()}sprite.png"
             onerror="this.style.display='none'">
        <span>${member}</span>
        <span class="weekly-member-count">${shinies.length}</span>
      `;

      const shinyGrid = document.createElement("div");
      shinyGrid.className = "weekly-shiny-grid";

      shinies.forEach(shiny => {
        const card = buildUnifiedCard(shiny); // existing system
        shinyGrid.appendChild(card);
      });

      memberRow.appendChild(memberHeader);
      memberRow.appendChild(shinyGrid);
      body.appendChild(memberRow);
    });

    // TOGGLE
    header.addEventListener("click", () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}

// auto-init
document.addEventListener("DOMContentLoaded", () => {
  if (window.shinyWeeklyData) {
    renderShinyWeekly("shiny-weekly-root", shinyWeeklyData);
  }
});
