// main.js
// Entrypoint for Team Shroom Shiny Pages — ES Modules, centralized helpers, no inline JS in HTML.

import { buildPokemonData, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies } from './pokemondatabuilder.js';
import { renderShowcaseGallery, setupShowcaseSearchAndSort, renderMemberShowcase } from './showcase.js';
import { setupShinyDexHitlistSearch } from './shinydexsearch.js';
import { renderDonators, assignDonatorTiersToTeam } from './donators.js';
import { prettifyPokemonName } from './utils.js';

// Shiny Weekly
import { renderShinyWeekly } from './shinyweekly.ui.js';

// Global data caches
let teamShowcaseData = null;
let pokemonFamiliesData = null;
let donationsData = null;
let shinyWeeklyData = null;

// --- Data loading helpers ---
async function fetchJson(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) throw new Error(`Failed to fetch ${path}`);
    return await resp.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

// --- Dark mode logic ---
function setupDarkModeButton() {
  const button = document.getElementById('darkmode-toggle');
  if (!button) return;

  function setMode(mode) {
    if (mode === 'dark') {
      document.body.classList.add('darkmode');
      button.textContent = "☀️ Light Mode";
      localStorage.setItem('shroom-darkmode', 'dark');
    } else {
      document.body.classList.remove('darkmode');
      button.textContent = "🌙 Dark Mode";
      localStorage.setItem('shroom-darkmode', 'light');
    }
  }

  button.onclick = () => {
    const isDark = document.body.classList.contains('darkmode');
    setMode(isDark ? 'light' : 'dark');
  };

  const pref = localStorage.getItem('shroom-darkmode');
  if (
    pref === 'dark' ||
    (pref !== 'light' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    setMode('dark');
  } else {
    setMode('light');
  }
}

// --- Routing ---
function getRoute() {
  const hash = location.hash || '#showcase';

  if (hash.startsWith('#showcase-')) {
    return {
      page: 'member',
      member: decodeURIComponent(hash.replace('#showcase-', '').split('?')[0])
    };
  }
  if (hash.startsWith('#showcase')) return { page: 'showcase' };
  if (hash.startsWith('#hitlist')) return { page: 'hitlist' };
  if (hash.startsWith('#shinyweekly')) return { page: 'shinyweekly' };
  if (hash.startsWith('#donators')) return { page: 'donators' };

  return { page: 'showcase' };
}

function setActiveNav(page) {
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
  if (page === 'showcase' || page === 'member') document.getElementById('nav-showcase')?.classList.add('active');
  if (page === 'hitlist') document.getElementById('nav-hitlist')?.classList.add('active');
  if (page === 'shinyweekly') document.getElementById('nav-shinyweekly')?.classList.add('active');
  if (page === 'donators') document.getElementById('nav-donators')?.classList.add('active');
}

// --- Page rendering ---
async function renderPage() {
  const { page, member } = getRoute();
  setActiveNav(page);

  const content = document.getElementById('page-content');
  content.innerHTML = `<div style="text-align:center;margin:2em;">Loading…</div>`;

  if (!teamShowcaseData) teamShowcaseData = await fetchJson('data/teamshowcase.json');
  if (!pokemonFamiliesData) pokemonFamiliesData = await fetchJson('data/pokemonfamilies.json');
  if (!donationsData) donationsData = await fetchJson('data/donations.json');
  if (page === 'shinyweekly' && !shinyWeeklyData) {
    shinyWeeklyData = await fetchJson('data/shinyweekly.json');
  }

  if (pokemonFamiliesData) buildPokemonData(pokemonFamiliesData);

  window.POKEMON_POINTS = POKEMON_POINTS;
  window.TIER_FAMILIES = TIER_FAMILIES;
  window.pokemonFamilies = pokemonFamilies;

  if (teamShowcaseData && donationsData) {
    assignDonatorTiersToTeam(teamShowcaseData, null, donationsData);
  }

  if (page === 'showcase') {
    content.innerHTML = `
      <div class="showcase-search-controls"></div>
      <div id="showcase-gallery-container"></div>
    `;
    const teamMembers = teamShowcaseData.map(m => ({
      name: m.name,
      shinies: m.shinies?.filter(s => !s.lost).length || 0,
      status: m.status,
      donator: m.donator
    }));
    setupShowcaseSearchAndSort(
      teamMembers,
      renderShowcaseGallery,
      null,
      teamShowcaseData,
      POKEMON_POINTS,
      TIER_FAMILIES,
      pokemonFamilies
    );
  }

  else if (page === 'member' && member) {
    const memData = teamShowcaseData.find(m => m.name.toLowerCase() === member.toLowerCase());
    if (!memData) {
      content.innerHTML = `<div style="text-align:center;margin:2em;">Member not found.</div>`;
    } else {
      renderMemberShowcase(memData, null, teamShowcaseData, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies);
    }
  }

  else if (page === 'hitlist') {
    content.innerHTML = `<div id="shiny-dex-container"></div>`;
    const shinyDex = {};
    pokemonFamiliesData.forEach(entry => {
      const region = entry.region || 'Other';
      shinyDex[region] ??= [];
      shinyDex[region].push({
        name: prettifyPokemonName(entry.pokemon || entry.name),
        claimed: entry.claimed,
        region
      });
    });
    setupShinyDexHitlistSearch(shinyDex, teamShowcaseData);
  }

  else if (page === 'donators') {
    renderDonators(donationsData);
  }

  else if (page === 'shinyweekly') {
    content.innerHTML = `<div id="shinyweekly-container"></div>`;

    const weeks = Array.isArray(shinyWeeklyData)
      ? shinyWeeklyData
      : Array.isArray(shinyWeeklyData?.data)
        ? shinyWeeklyData.data
        : null;

    if (weeks) {
      renderShinyWeekly(weeks, document.getElementById('shinyweekly-container'));
    } else {
      content.innerHTML = `<div style="text-align:center;margin:2em;">Could not load shiny weekly data.</div>`;
    }
  }
} // ✅ ← THIS was missing before

// --- Listen for hash changes ---
window.addEventListener('hashchange', renderPage);

// --- On load ---
window.addEventListener('DOMContentLoaded', () => {
  setupDarkModeButton();
  renderPage();
});
