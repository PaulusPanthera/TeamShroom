// shinyweekly.js
import { renderUnifiedCard } from './unifiedcard.js';
import { prettifyPokemonName } from './utils.js';

// Helper: robustly build a shiny GIF url (based on img.pokemondb naming)
function getPokemonGif(rawName) {
  if (!rawName) return '';

  // Lowercase, trim
  let n = String(rawName).toLowerCase().trim();

  // Normalize common unicode male/female signs to text
  n = n.replace(/\u2640/g, ' f').replace(/\u2642/g, ' m');

  // Remove common trailing notes that were sometimes put into the name field
  // (safari, event, secret notes, "egg", "ss", "run", stray asterisks, etc.)
  n = n.replace(/\(.*?\)/g, '') // remove parenthetical content
       .replace(/\b(safari|event|secret|egg|ss|run|lost|mgb)\b/g, '')
       .replace(/[*]/g, '')
       .trim();

  // If there are multiple words (like "spinda paras" or "shroomish paras"),
  // prefer the first token as the species name (most entries that had extra
  // words were annotations).
  if (n.includes(' ')) {
    n = n.split(' ')[0];
  }

  // Map some obvious typos / alternate tokens found in the dataset
  const map = {
    'magikar': 'magikarp',
    'magikar)': 'magikarp',
    'magicar p': 'magikarp',
    'magikar(': 'magikarp',
    'cryognal': 'cryogonal',
    'cryognal)': 'cryogonal',
    'wurmpel': 'wurmple',
    'wurmpel)': 'wurmple',
    'maril': 'marill',
    'rpanidash': 'rapidash',
    'remoraid': 'remoraid',
    'nidoran f': 'nidoran-f',
    'nidoran m': 'nidoran-m',
    'nidoran-female': 'nidoran-f',
    'nidoran-male': 'nidoran-m',
    "nidoran♀": 'nidoran-f',
    "nidoran♂": 'nidoran-m',
    "mr mime": 'mr-mime',
    "mr. mime": 'mr-mime',
    "mr-mime": 'mr-mime',
    "mime jr": 'mime-jr',
    "mimejr": 'mime-jr',
    "type null": 'type-null',
    "type-null": 'type-null',
    "porygon z": 'porygon-z',
    "porygonz": 'porygon-z',
    "farfetch'd": 'farfetchd',
    "farfetchd": 'farfetchd',
    'ivysaur ss': 'ivysaur',
    'ss loudred': 'loudred',
    'litwikc': 'litwick',
    'magikar': 'magikarp',
    'magikar': 'magikarp'
  };

  if (map[n]) n = map[n];

  // Remove non-alphanumeric except hyphen (filenames commonly have hyphens)
  n = n.replace(/[^a-z0-9\-]/g, '');

  // Handle a few special filenames that don't match the basic normalization
  if (n === 'mrmime') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif';
  if (n === 'mime-jr' || n === 'mimejr') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif';
  if (n === 'nidoranf' || n === 'nidoran-f') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif';
  if (n === 'nidoranm' || n === 'nidoran-m') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif';
  if (n === 'type-null' || n === 'typenull') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/type-null.gif';
  if (n === 'porygon-z' || n === 'porygonz') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/porygon-z.gif';

  // Final URL
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${n}.gif`;
}

export function renderShinyWeekly(weeklyData, container) {
  // weeklyData must be an array of week objects (no maintenance handling here).
  if (!container) return;
  if (!Array.isArray(weeklyData)) {
    // If someone passes the object that contains { data: [...] }, accept that for convenience.
    if (weeklyData && typeof weeklyData === 'object' && Array.isArray(weeklyData.data)) {
      weeklyData = weeklyData.data;
    } else {
      container.innerHTML = '<div style="padding:1em;color:var(--accent);">No weekly data available.</div>';
      return;
    }
  }

  container.innerHTML = `
    <h2>Shiny Weekly Overview</h2>
    <div class="weekly-calendar"></div>
    <div class="weekly-cards"></div>
  `;
  const calDiv = container.querySelector('.weekly-calendar');
  const cardsDiv = container.querySelector('.weekly-cards');

  // clear possible previous content
  calDiv.innerHTML = '';
  cardsDiv.innerHTML = '';

  // Show weeks in reverse order (newest first)
  [...weeklyData].reverse().forEach((week, idx) => {
    const btn = document.createElement('button');
    btn.className = 'week-btn';
    btn.textContent = week.label || week.week || `Week ${idx + 1}`;
    btn.onclick = () => renderWeekDetails(week);
    calDiv.appendChild(btn);
    // Default: show the most recent week (first iteration after reverse)
    if (idx === 0) renderWeekDetails(week);
  });

  function renderWeekDetails(week) {
    cardsDiv.innerHTML = `
      <h3>${week.label || week.week || ''}</h3>
      <div class="dex-grid"></div>
      <button class="back-btn">← Back to weeks</button>
    `;
    const grid = cardsDiv.querySelector('.dex-grid');

    // Defensive: some entries may not have a shinies array
    (week.shinies || []).forEach(mon => {
      const canonicalName = (mon && mon.name) ? prettifyPokemonName(mon.name) : '';
      // For image lookup, use the raw data name (so we sanitize inside getPokemonGif)
      const img = getPokemonGif(mon.name || canonicalName);
      grid.innerHTML += renderUnifiedCard({
        name: canonicalName,
        img,
        info: mon.member || '',
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

    const backBtn = cardsDiv.querySelector('.back-btn');
    if (backBtn) backBtn.onclick = () => {
      cardsDiv.innerHTML = '';
    };
  }
}
