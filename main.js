// main.js
// Entrypoint for Team Shroom Shiny Pages — ES Modules, centralized helpers, no inline JS in HTML.

import { buildPokemonData, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies } from './pokemondatabuilder.js';
import { renderShowcaseGallery, setupShowcaseSearchAndSort, renderMemberShowcase } from './showcase.js';
import { setupShinyDexHitlistSearch } from './shinydexsearch.js';
import { renderDonators, renderDonatorsWhenReady, assignDonatorTiersToTeam } from './donators.js';
import { renderUnifiedCard } from './unifiedcard.js';
import { normalizePokemonName, prettifyPokemonName, normalizeMemberName, prettifyMemberName } from './utils.js';

// Global data caches
let teamShowcaseData = null;
let pokemonFamiliesData = null;
let donationsData = null;

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
  // Onload: check preference
  const pref = localStorage.getItem('shroom-darkmode');
  if (pref === 'dark' || (pref !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setMode('dark');
  } else {
    setMode('light');
  }
}

// --- Routing ---
function getRoute() {
  // #showcase, #hitlist, #shinyweekly, #donators, #showcase-<member>, etc.
  const hash = location.hash || '#showcase';
  if (hash.startsWith('#showcase-')) {
    return { page: 'member', member: decodeURIComponent(hash.replace('#showcase-', '').split('?')[0]) };
  }
  if (hash.startsWith('#showcase')) return { page: 'showcase', sort: (hash.match(/sort=(\w+)/) || [])[1] };
  if (hash.startsWith('#hitlist')) return { page: 'hitlist' };
  if (hash.startsWith('#shinyweekly')) return { page: 'shinyweekly' };
  if (hash.startsWith('#donators')) return { page: 'donators' };
  return { page: 'showcase' };
}

function setActiveNav(page) {
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
  if (page === 'showcase' || page === 'member') document.getElementById('nav-showcase').classList.add('active');
  else if (page === 'hitlist') document.getElementById('nav-hitlist').classList.add('active');
  else if (page === 'shinyweekly') document.getElementById('nav-shinyweekly').classList.add('active');
  else if (page === 'donators') document.getElementById('nav-donators').classList.add('active');
}

// --- Page rendering ---
async function renderPage() {
  const { page, member, sort } = getRoute();
  setActiveNav(page);

  const content = document.getElementById('page-content');
  content.innerHTML = "<div style='text-align:center;font-size:1.2em;color:var(--accent);margin:2em;'>Loading...</div>";

  // Ensure data is loaded
  if (!teamShowcaseData) teamShowcaseData = await fetchJson('data/teamshowcase.json');
  if (!pokemonFamiliesData) pokemonFamiliesData = await fetchJson('data/pokemonfamilies.json');
  if (!donationsData) donationsData = await fetchJson('data/donations.json');

  // Rebuild points/tier data for use everywhere
  if (pokemonFamiliesData) buildPokemonData(pokemonFamiliesData);

  // Expose POKEMON_POINTS etc globally for modules expecting them
  window.POKEMON_POINTS = POKEMON_POINTS;
  window.TIER_FAMILIES = TIER_FAMILIES;
  window.pokemonFamilies = pokemonFamilies;

  // Assign donator tiers to teamShowcase before rendering
  if (teamShowcaseData && donationsData) assignDonatorTiersToTeam(teamShowcaseData, null, donationsData);

  // Expose data for other modules if needed
  window.teamShowcase = teamShowcaseData;
  window.pokemonFamiliesData = pokemonFamiliesData;
  window.donationsData = donationsData;

  if (page === 'showcase') {
    // Main showcase
    content.innerHTML = `
      <div class="showcase-search-controls"></div>
      <div id="showcase-gallery-container"></div>
    `;
    // Build member summaries
    let teamMembers = teamShowcaseData.map(entry => ({
      name: entry.name,
      shinies: Array.isArray(entry.shinies)
        ? entry.shinies.filter(mon => !mon.lost).length
        : 0,
      status: entry.status,
      donator: entry.donator
    }));
    setupShowcaseSearchAndSort(
      teamMembers,
      renderShowcaseGallery,
      sort,
      teamShowcaseData,
      POKEMON_POINTS,
      TIER_FAMILIES,
      pokemonFamilies
    );
  } else if (page === 'member' && member) {
    // Find the member
    let memData = teamShowcaseData.find(m => m.name.toLowerCase() === member.toLowerCase());
    if (!memData) {
      content.innerHTML = `<div style="font-size:1.3em;color:var(--accent);margin:2em;text-align:center;">Member not found.</div>`;
    } else {
      // Re-render using member showcase (sort by query param if present)
      renderMemberShowcase(memData, sort, teamShowcaseData, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies);
    }
  } else if (page === 'hitlist') {
    content.innerHTML = `<div id="shiny-dex-container"></div>`;
    // Group Pokémon by region for the dex
    const shinyDex = {};
    (pokemonFamiliesData || []).forEach(entry => {
      const region = entry.region || "Other";
      if (!shinyDex[region]) shinyDex[region] = [];
      // Use entry.name or entry.pokemon, but always prettify for display, and always set name property
      const pokeName = prettifyPokemonName(entry.pokemon || entry.name);
      shinyDex[region].push({
        name: pokeName,
        claimed: entry.claimed,
        region: region // Ensure each Pokemon entry has region property for correct region search!
      });
    });
    setupShinyDexHitlistSearch(shinyDex, teamShowcaseData);
  } else if (page === 'donators') {
    renderDonators(donationsData);
  } else if (page === 'shinyweekly') {
    content.innerHTML = `<div style="font-size:1.4em;color:var(--accent);margin:2em;text-align:center;">Shiny Weekly coming soon!</div>`;
  } else {
    content.innerHTML = `<div style="font-size:1.3em;color:var(--accent);margin:2em;text-align:center;">Page not found.</div>`;
  }
}

// --- Listen for hash changes (routing) ---
window.addEventListener('hashchange', renderPage);

// --- On load ---
window.addEventListener('DOMContentLoaded', () => {
  setupDarkModeButton();
  renderPage();
});
