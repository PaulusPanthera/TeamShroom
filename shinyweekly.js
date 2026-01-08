// shinyweekly.js
import { renderUnifiedCard } from './unifiedcard.js';
import { prettifyPokemonName } from './utils.js';

// Helper: Get shiny gif url (copy from showcase.js)
function getPokemonGif(name) {
  const n = name.replace(/[\s.'’\-]/g, "").toLowerCase();
  if (n === "mrmime") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif";
  if (n === "mimejr") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif";
  if (n === "nidoranf") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif";
  if (n === "nidoranm") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif";
  if (n === "typenull") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/type-null.gif";
  if (n === "porygonz") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/porygon-z.gif";
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${n}.gif`;
}

export function renderShinyWeekly(weeklyData, container) {
  if (!container) return;

  // Debug helper to see what we received
  // console.log('renderShinyWeekly input:', weeklyData);

  // Normalize input:
  // - If weeklyData is an object with a .data array, use that.
  // - If weeklyData is already an array, use it directly.
  // - Allow the top-level object to signal maintenance via .maintenance flag.
  const isObject = weeklyData && typeof weeklyData === "object" && !Array.isArray(weeklyData);
  const dataArray = Array.isArray(weeklyData)
    ? weeklyData
    : isObject && Array.isArray(weeklyData.data)
    ? weeklyData.data
    : [];

  // --- MAINTENANCE SUPPORT ---
  // If top-level object has a .maintenance flag, show only message
  if (isObject && weeklyData.maintenance) {
    container.innerHTML = `
      <div style="font-size:1.6em;color:var(--accent);margin:3em 0;text-align:center;">
        ${weeklyData.message || "Shiny Weekly is soon to be. Stay tuned!"}
      </div>
    `;
    return;
  }

  // If array with first element as { maintenance: true }, also show maintenance message
  if (
    Array.isArray(dataArray) &&
    dataArray.length &&
    dataArray[0] &&
    typeof dataArray[0] === "object" &&
    dataArray[0].maintenance
  ) {
    const msg = dataArray[0].message || "Shiny Weekly is soon to be. Stay tuned!";
    container.innerHTML = `
      <div style="font-size:1.6em;color:var(--accent);margin:3em 0;text-align:center;">
        ${msg}
      </div>
    `;
    return;
  }

  // --- NORMAL RENDER ---
  container.innerHTML = `
    <h2>Shiny Weekly Overview</h2>
    <div class="weekly-calendar"></div>
    <div class="weekly-cards"></div>
  `;
  const calDiv = container.querySelector('.weekly-calendar');
  const cardsDiv = container.querySelector('.weekly-cards');

  // Show weeks in reverse order (newest first)
  [...dataArray].reverse().forEach((week, idx) => {
    const btn = document.createElement('button');
    btn.className = 'week-btn';
    btn.textContent = week.label || week.week;
    btn.onclick = () => renderWeekDetails(week);
    calDiv.appendChild(btn);
    // Default: show the most recent week
    if (idx === 0) renderWeekDetails(week);
  });

  function renderWeekDetails(week) {
    cardsDiv.innerHTML = `
      <h3>${week.label || week.week}</h3>
      <div class="dex-grid"></div>
      <button class="back-btn">← Back to weeks</button>
    `;
    const grid = cardsDiv.querySelector('.dex-grid');
    (week.shinies || []).forEach(mon => {
      grid.innerHTML += renderUnifiedCard({
        name: prettifyPokemonName(mon.name),
        img: getPokemonGif(mon.name),
        info: mon.member,
        symbols: {
          secret: !!mon.secret,
          egg: !!mon.egg,
          alpha: !!mon.alpha,
          safari: !!mon.safari,
          event: !!mon.event,
          clip: !!mon.clip
        },
        clip: mon.clip,
        cardType: "pokemon"
      });
    });
    cardsDiv.querySelector('.back-btn').onclick = () => {
      cardsDiv.innerHTML = '';
    };
  }
}
