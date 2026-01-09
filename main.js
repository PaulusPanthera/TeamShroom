// main.js
// Entrypoint for Team Shroom Shiny Pages — ES Modules, centralized helpers.
// Design System v1: Dark mode only. No theme toggling.

import { buildPokemonData, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies } from './pokemondatabuilder.js';
import { renderShowcaseGallery, setupShowcaseSearchAndSort, renderMemberShowcase } from './showcase.js';
import { setupShinyDexHitlistSearch } from './shinydexsearch.js';
import { renderDonators, assignDonatorTiersToTeam } from './donators.js';
import { prettifyPokemonName } from './utils.js';

// Shiny Weekly
import { renderShinyWeekly } from './shinyweekly.ui.js';

// ---------------------------------------------------------
// GLOBAL DATA CACHES
// ---------------------------------------------------------

let teamShowcaseData = null;
let pokemonFamiliesData = null;
let donationsData = null;
let shinyWeeklyData = null;

// ---------------------------------------------------------
// DATA LOADING
// ---------------------------------------------------------

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

// ---------------------------------------------------------
// ROUTING
// ---------------------------------------------------------

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

  if (page === 'showcase' || page === 'member') {
    document.getElementById('nav-showcase')?.classList.add('active');
  }
  if (page === 'hitlist') {
    document.getElementById('nav-hitlist')?.classList.add('active');
  }
  if (page === 'shinyweekly') {
    document.getElementById('nav-shinyweekly')?.classList.add('active');
  }
  if (page === 'donators') {
    document.getElementById('nav-donators')?.classList.add('active');
  }
}

// ---------------------------------------------------------
// PAGE RENDERING
// ---------------------------------------------------------

async function renderPage() {
  const { page, member } = getRoute();
  setActiveNav(page);

  const content = document.getElementById('page-content');
  content.innerHTML = `<div style="text-align:center;margin:2em;">Loading…</div>`;

  if (!teamShowcaseData) {
    teamShowcaseData = await fetchJson('data/teamshowcase.json');
  }
  if (!pokemonFamiliesData) {
    pokemonFamiliesData = await fetchJson('data/pokemonfamilies.json');
  }
  if (!donationsData) {
    donationsData = await fetchJson('data/donations.json');
  }
  if (page === 'shinyweekly' && !shinyWeeklyData) {
    shinyWeeklyData = await fetchJson('data/shinyweekly.json');
  }

  if (pokemonFamiliesData) {
    buildPokemonData(pokemonFamiliesData);
  }

  // Expose for legacy modules
  window.POKEMON_POINTS = POKEMON_POINTS;
  window.TIER_FAMILIES = TIER_FAMILIES;
  window.pokemonFamilies = pokemonFamilies;

  if (teamShowcaseData && donationsData) {
    assignDonatorTiersToTeam(teamShowcaseData, null, donationsData);
  }

  // -------------------------------------------------------
  // SHOWCASE
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // MEMBER DETAIL
  // -------------------------------------------------------

  else if (page === 'member' && member) {
    const memData = teamShowcaseData.find(
      m => m.name.toLowerCase() === member.toLowerCase()
    );

    if (!memData) {
      content.innerHTML = `<div style="text-align:center;margin:2em;">Member not found.</div>`;
    } else {
      renderMemberShowcase(
        memData,
        null,
        teamShowcaseData,
        POKEMON_POINTS,
        TIER_FAMILIES,
        pokemonFamilies
      );
    }
  }

  // -------------------------------------------------------
  // HITLIST
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // DONATORS
  // -------------------------------------------------------

  else if (page === 'donators') {
    renderDonators(donationsData);
  }

  // -------------------------------------------------------
  // SHINY WEEKLY
  // -------------------------------------------------------

  else if (page === 'shinyweekly') {
    content.innerHTML = `<div id="shinyweekly-container"></div>`;

    const weeks = Array.isArray(shinyWeeklyData)
      ? shinyWeeklyData
      : Array.isArray(shinyWeeklyData?.data)
        ? shinyWeeklyData.data
        : null;

    if (weeks) {
      renderShinyWeekly(
        weeks,
        document.getElementById('shinyweekly-container')
      );
    } else {
      content.innerHTML = `<div style="text-align:center;margin:2em;">Could not load shiny weekly data.</div>`;
    }
  }
}

// ---------------------------------------------------------
// EVENT BINDINGS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);

window.addEventListener('DOMContentLoaded', () => {
  renderPage();
});
