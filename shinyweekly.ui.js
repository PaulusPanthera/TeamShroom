// shinyweekly.ui.js
// Shiny Weekly UI using unified cards only
// Structure: expandable weeks → member card shuffles with pokemon cards
// This version ONLY adds "Hunter of the Week" highlighting

import { renderUnifiedCard } from './unifiedcard.js';
import { prettifyPokemonName } from './utils.js';

export function renderShinyWeekly(weeklyData, container) {
  if (!container || !Array.isArray(weeklyData)) return;
  container.innerHTML = "";

  // Newest week first
  const weeks = [...weeklyData].reverse();

  weeks.forEach((week, weekIndex) => {
    /* ===============================
       WEEK CARD
    =============================== */
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

    /* ===============================
       GROUP SHINIES BY MEMBER
    =============================== */
    const byMember = {};
    week.shinies.forEach(shiny => {
      if (!byMember[shiny.member]) byMember[shiny.member] = [];
      byMember[shiny.member].push(shiny);
    });

    /* ===============================
       DETERMINE HUNTER OF THE WEEK
    =============================== */
    let hunterOfTheWeek = null;
    let maxCount = 0;

    Object.entries(byMember).forEach(([member, shinies]) => {
      if (shinies.length > maxCount) {
        maxCount = shinies.length;
        hunterOfTheWeek = member;
      }
    });

    /* ===============================
       MEMBER ROWS
    =============================== */
    Object.entries(byMember).forEach(([member, shinies]) => {
      const row = document.createElement("div");
      row.className = "weekly-member-row";

      /* --- Card shuffle state --- */
      let index = -1; // -1 = member card

      const cards = [];

      // MEMBER CARD (first)
      cards.push(() =>
        renderUnifiedCard({
          name: member,
          img: `img/membersprites/${member.toLowerCase()}sprite.gif`,
          info: `${shinies.length} shinies`,
          cardType: "member",
          memberStatus: null,
          donatorStatus: null
        })
      );

      // POKEMON CARDS
      shinies.forEach(shiny => {
        cards.push(() =>
          renderUnifiedCard({
            name: prettifyPokemonName(shiny.name),
            img: `img/pokemon/${shiny.name.toLowerCase()}.gif`,
            info: member,
            cardType: "pokemon",
            symbols: shiny.symbols || {}
          })
        );
      });

      /* --- Render container --- */
      const cardContainer = document.createElement("div");
      cardContainer.className = "weekly-card-slot";

      // Hunter of the Week highlight
      if (member === hunterOfTheWeek) {
        cardContainer.classList.add("hunter-of-the-week");
      }

      function renderNext() {
        index = (index + 1) % cards.length;
        cardContainer.innerHTML = cards[index]();
      }

      renderNext();
      cardContainer.onclick = renderNext;

      row.appendChild(cardContainer);
      body.appendChild(row);
    });

    /* ===== TOGGLE WEEK ===== */
    header.onclick = () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    };

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
