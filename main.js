// main.js
// Entrypoint — HARD CONTRACT VERSION
// No prettified names in data. Ever.

import { loadShinyWeeklyFromCSV } from './shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './shinyweekly.model.js';

const SHINY_WEEKLY_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB6vHVjwL9_F3DVIVgXxP8rtWEDQyZaDTnG2yAw96j4_1DXU7317lBFaY0N5JnDhdvUnkvgAvb6p8o/pub?gid=0&single=true&output=csv';

loadShinyWeeklyFromCSV(SHINY_WEEKLY_CSV).then(rows => {
  console.log('CLEAN ROW COUNT:', rows.length);
  console.log('FIRST ROW:', rows[0]);
  console.log('LAST ROW:', rows.at(-1));

  const weeks = buildShinyWeeklyModel(rows);
  console.log('WEEK COUNT:', weeks.length);
  console.log('FIRST WEEK:', weeks[0]);
});



import {
  buildPokemonData,
  POKEMON_POINTS,
  TIER_FAMILIES,
  pokemonFamilies
} from './pokemondatabuilder.js';

import {
  renderShowcaseGallery,
  setupShowcaseSearchAndSort,
  renderMemberShowcase
} from './showcase.js';

import { setupShinyDexHitlistSearch } from './shinydexsearch.js';
import { renderDonators, assignDonatorTiersToTeam } from './donators.js';
import { renderShinyWeekly } from './shinyweekly.ui.js';

// ---------------------------------------------------------
// DATA CACHES
// ---------------------------------------------------------

let teamShowcaseData;
let pokemonFamiliesData;
let donationsData;
let shinyWeeklyData;

// ---------------------------------------------------------
// FETCH
// ---------------------------------------------------------

async function fetchJson(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`Failed to fetch ${path}`);
  return r.json();
}

// ---------------------------------------------------------
// ROUTING
// ---------------------------------------------------------

function getRoute() {
  const h = location.hash || '#showcase';

  if (h.startsWith('#showcase-')) {
    return {
      page: 'member',
      member: decodeURIComponent(h.replace('#showcase-', '').split('?')[0])
    };
  }

  if (h.startsWith('#hitlist')) return { page: 'hitlist' };
  if (h.startsWith('#shinyweekly')) return { page: 'shinyweekly' };
  if (h.startsWith('#donators')) return { page: 'donators' };
  return { page: 'showcase' };
}

function setActiveNav(page) {
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
  const map = {
    showcase: 'nav-showcase',
    member: 'nav-showcase',
    hitlist: 'nav-hitlist',
    shinyweekly: 'nav-shinyweekly',
    donators: 'nav-donators'
  };
  document.getElementById(map[page])?.classList.add('active');
}

// ---------------------------------------------------------
// RENDER
// ---------------------------------------------------------

async function renderPage() {
  const { page, member } = getRoute();
  setActiveNav(page);

  const content = document.getElementById('page-content');
  content.innerHTML = '';

  if (!teamShowcaseData) teamShowcaseData = await fetchJson('data/teamshowcase.json');
  if (!pokemonFamiliesData) pokemonFamiliesData = await fetchJson('data/pokemonfamilies.json');
  if (!donationsData) donationsData = await fetchJson('data/donations.json');
  if (page === 'shinyweekly' && !shinyWeeklyData) {
    shinyWeeklyData = await fetchJson('data/shinyweekly.json');
  }

  buildPokemonData(pokemonFamiliesData);

  window.POKEMON_POINTS = POKEMON_POINTS;
  window.TIER_FAMILIES = TIER_FAMILIES;
  window.pokemonFamilies = pokemonFamilies;

  assignDonatorTiersToTeam(teamShowcaseData, null, donationsData);

  // -------------------------------------------------------
  // SHOWCASE
  // -------------------------------------------------------

  if (page === 'showcase') {
    content.innerHTML = `
      <div class="showcase-search-controls"></div>
      <div id="showcase-gallery-container"></div>
    `;

    const members = teamShowcaseData.map(m => ({
      name: m.name,
      shinies: m.shinies?.filter(s => !s.lost).length || 0,
      status: m.status,
      donator: m.donator
    }));

    setupShowcaseSearchAndSort(
      members,
      renderShowcaseGallery,
      null,
      teamShowcaseData,
      POKEMON_POINTS
    );
  }

  // -------------------------------------------------------
  // MEMBER
  // -------------------------------------------------------

  else if (page === 'member') {
    const m = teamShowcaseData.find(
      x => x.name.toLowerCase() === member.toLowerCase()
    );
    if (!m) {
      content.textContent = 'Member not found.';
      return;
    }
    renderMemberShowcase(m, null, teamShowcaseData, POKEMON_POINTS);
  }

  // -------------------------------------------------------
  // HITLIST / LIVING DEX
  // -------------------------------------------------------

  else if (page === 'hitlist') {
    content.innerHTML = `<div id="shiny-dex-container"></div>`;

    const shinyDex = {};
    pokemonFamiliesData.forEach(entry => {
      const region = entry.region || 'Other';
      shinyDex[region] ??= [];
      shinyDex[region].push({
        name: entry.name,       // RAW NAME ONLY
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
    renderShinyWeekly(
      Array.isArray(shinyWeeklyData?.data)
        ? shinyWeeklyData.data
        : shinyWeeklyData,
      document.getElementById('shinyweekly-container')
    );
  }
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
