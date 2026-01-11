// main.js (ROOT)
// Entrypoint — JSON-first migration in progress
// Shiny Weekly + Shiny Showcase migrated to JSON

import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';

import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';

import { buildPokemonData, POKEMON_POINTS } from './src/data/pokemondatabuilder.js';
import { loadDonatorsFromCSV } from './src/data/donators.loader.js';
import { loadMembersFromCSV } from './src/data/member.loader.js';
import { loadCSV } from './src/data/csv.loader.js';

import {
  renderShowcaseGallery,
  setupShowcaseSearchAndSort,
  renderMemberShowcase
} from './src/features/showcase/showcase.js';

import { setupShinyDexHitlistSearch } from './src/features/shinydex/shinydexsearch.js';
import { renderDonators } from './src/features/donators/donators.js';
import { renderShinyWeekly } from './src/features/shinyweekly/shinyweekly.ui.js';

// ---------------------------------------------------------
// CONFIG - GOOGLE SHEETS (CSV)
// Still used by non-migrated features
// ---------------------------------------------------------

const DONATORS_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB6vHVjwL9_F3DVIVgXxP8rtWEDQyZaDTnG2yAw96j4_1DXU7317lBFaY0N5JnDhdvUnkvgAvb6p8o/pub?gid=2068008843&single=true&output=csv';

const MEMBERS_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB6vHVjwL9_F3DVIVgXxP8rtWEDQyZaDTnG2yAw96j4_1DXU7317lBFaY0N5JnDhdvUnkvgAvb6p8o/pub?gid=1649506714&single=true&output=csv';

const POKEMON_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB6vHVjwL9_F3DVIVgXxP8rtWEDQyZaDTnG2yAw96j4_1DXU7317lBFaY0N5JnDhdvUnkvgAvb6p8o/pub?gid=890281184&single=true&output=csv';

// ---------------------------------------------------------
// DATA CACHES
// ---------------------------------------------------------

let shinyWeeklyWeeks = null;
let donatorsData = null;
let membersData = null;
let showcaseRows = null;
let pokemonDataLoaded = false;

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
  document.querySelectorAll('.nav a').forEach(a =>
    a.classList.remove('active')
  );

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
// PAGE RENDER
// ---------------------------------------------------------

async function renderPage() {
  const { page, member } = getRoute();
  setActiveNav(page);

  const content = document.getElementById('page-content');
  content.innerHTML = '';

  // -------------------------------------------------------
  // POKEMON DATA (still CSV)
  // -------------------------------------------------------

  if (!pokemonDataLoaded) {
    const pokemonRows = await loadCSV(POKEMON_CSV);
    buildPokemonData(pokemonRows);
    pokemonDataLoaded = true;
  }

  // -------------------------------------------------------
  // SHINY WEEKLY (JSON)
  // -------------------------------------------------------

  if (!shinyWeeklyWeeks) {
    const rows = await loadShinyWeekly();
    shinyWeeklyWeeks = buildShinyWeeklyModel(rows);
  }

  // -------------------------------------------------------
  // DONATORS (CSV for now)
  // -------------------------------------------------------

  if (!donatorsData) {
    donatorsData = await loadDonatorsFromCSV(DONATORS_CSV);
  }

  // -------------------------------------------------------
  // MEMBERS (CSV for now)
  // -------------------------------------------------------

  if (!membersData) {
    membersData = await loadMembersFromCSV(MEMBERS_CSV);
  }

  // -------------------------------------------------------
  // SHINY SHOWCASE (JSON)
  // -------------------------------------------------------

  if (!showcaseRows) {
    showcaseRows = await loadShinyShowcase();
  }

  // -------------------------------------------------------
  // SHOWCASE
  // -------------------------------------------------------

  if (page === 'showcase') {
    content.innerHTML = `
      <div class="showcase-search-controls"></div>
      <div id="showcase-gallery-container"></div>
    `;

    setupShowcaseSearchAndSort(
      membersData.filter(m => m.active),
      renderShowcaseGallery,
      null,
      showcaseRows,
      POKEMON_POINTS
    );
  }

  else if (page === 'member') {
    const m = membersData.find(
      x => x.name.toLowerCase() === member.toLowerCase()
    );

    if (!m) {
      content.textContent = 'Member not found.';
      return;
    }

    renderMemberShowcase(m, null, showcaseRows, POKEMON_POINTS);
  }

  else if (page === 'hitlist') {
    content.innerHTML = `<div id="shiny-dex-container"></div>`;
    setupShinyDexHitlistSearch({}, []);
  }

  else if (page === 'donators') {
    renderDonators(donatorsData);
  }

  else if (page === 'shinyweekly') {
    content.innerHTML = `<div id="shinyweekly-container"></div>`;
    renderShinyWeekly(
      shinyWeeklyWeeks,
      document.getElementById('shinyweekly-container')
    );
  }
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
