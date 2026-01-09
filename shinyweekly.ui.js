// shinyweekly.ui.js
// Shiny Weekly UI using unified cards + Hunter of the Week highlight

import { renderUnifiedCard } from './unifiedcard.js';
import { normalizeMemberName } from './utils.js';

export function renderShinyWeekly(weeks, container) {
  if (!container || !Array.isArray(weeks)) return;
  container.innerHTML = "";

  // NEWEST week first
  const sortedWeeks = [...weeks].reverse();

  sortedWeeks.forEach((week, weekIndex) => {
    const weekCard = document.createElement("div");
    weekCard.className = "weekly-card";

    /* ===== WEEK STATS ===== */
    const memberCounts = {};
    week.shinies.forEach(s => {
      memberCounts[s.member] = (memberCounts[s.member] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(memberCounts));
    const huntersOfWeek = Object.entries(memberCounts)
      .filter(([, count]) => count === maxCount)
      .map(([name]) => name);

    /* ===== HEADER ===== */
    const header = document.createElement("div");
    header.className = "weekly-header";
    header.innerHTML = `
      <div class="weekly-title">${week.label || week.week}</div>
      <div class="weekly-meta">
        ⭐ ${week.shinies.length} Shinies · 👥 ${Object.keys(memberCounts).length} Hunters
      </div>
    `;

    /* ===== BODY ===== */
    const body = document.createElement("div");
    body.className = "weekly-body";
    body.style.display = weekIndex === 0 ? "block" : "none";

    /* ===== GROUP BY MEMBER ===== */
    const byMember = {};
    week.shinies.forEach(shiny => {
      if (!byMember[shiny.member]) byMember[shiny.member] = [];
      byMember[shiny.member].push(shiny);
    });

    Object.entries(byMember).forEach(([member, shinies]) => {
      const isHunterOfWeek = huntersOfWeek.includes(member);

      /* MEMBER CARD */
      const memberWrapper = document.createElement("div");
      memberWrapper.className = "weekly-member-wrapper";

      const memberCardHtml = renderUnifiedCard({
        name: member,
        img: "img/membersprites/examplesprite.png",
        info: `Shinies: ${shinies.length}`,
        cardType: "member"
      });

      memberWrapper.innerHTML = memberCardHtml;
      const memberCard = memberWrapper.firstElementChild;

      // Hunter of the Week hook
      if (isHunterOfWeek) {
        memberCard.classList.add("hunter-of-week");
        memberCard.dataset.hunter = "true";
        memberCard.title = "Hunter of the Week";
      }

      /* SHUFFLE STATE */
      let index = -1;
      const cards = [
        memberCard,
        ...shinies.map(shiny => {
          const wrap = document.createElement("div");
          wrap.innerHTML = renderUnifiedCard({
            name: shiny.name,
            img: `https://img.pokemondb.net/sprites/black-white/anim/shiny/${shiny.name
              .toLowerCase()
              .replace(/♀/g, "-f")
              .replace(/♂/g, "-m")
              .replace(/[\s.'’]/g, "")}.gif`,
            info: "",
            cardType: "pokemon",
            symbols: {
              secret: shiny.secret,
              safari: shiny.safari,
              egg: shiny.egg,
              event: shiny.event
            }
          });
          return wrap.firstElementChild;
        })
      ];

      const slot = document.createElement("div");
      slot.className = "weekly-card-slot";
      slot.appendChild(memberCard);

      slot.onclick = () => {
        index = (index + 1) % cards.length;
        slot.replaceChildren(cards[index]);
      };

      memberWrapper.appendChild(slot);
      body.appendChild(memberWrapper);
    });

    /* TOGGLE WEEK */
    header.onclick = () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    };

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
