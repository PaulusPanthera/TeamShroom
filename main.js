// main.js (ROOT)
// Entrypoint — Google Sheets is source of truth
// HARD CONTRACT VERSION

import { loadShinyWeeklyFromCSV } from './src/data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';

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
// CONFIG — GOOGLE SHEETS (CSV)
// ---------------------------------------------------------

const SHINY_WEEKLY_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB6vHVjwL9_F3DVIVgXxP8rtWEDQyZaDTnG2yAw96j4_1DXU7317lBFaY0N5JnDhdvUnkvgAvb6p8o/pub?gid=0&single=true&output=csv';

const DONATORS_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB6vHVjwL9_F3DVIVgXxP8rtWEDQyZaDTnG2yAw96j4_1DXU7317lBFaY0N5JnDhdvUnkvgAvb6p8o/pub?gid=2068008843&single=true&output=csv';

const MEMBERS_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB6vHVjwL9_F3DVIVgXxP8rtWEDQyZaDTnG2yAw96j4_1DXU7317lBFaY0N5JnDhdvUnkvgAvb6p8o/pub?gid=1649506714&single=true&output=csv';

const SHINYSHOWCASE_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB6vHVjwL9_F3DVIVgXxP8rtWEDQyZaDTnG2yAw96j4_1DXU7317lBFaY0N5JnDhdvUnkvgAvb6p8o/pub?gid=1708435858&single=true&output=csv';

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
  // POKÉMON DATA (CSV → MODEL)
  // -------------------------------------------------------

  if (!pokemonDataLoaded) {
    const pokemonRows = await loadCSV(POKEMON_CSV);
    buildPokemonData(pokemonRows);
    pokemonDataLoaded = true;
    console.log('✔ Pokémon data loaded:', pokemonRows.length);
  }

  // -------------------------------------------------------
  // SHINY WEEKLY
  // -------------------------------------------------------

  if (!shinyWeeklyWeeks) {
    const rows = await loadShinyWeeklyFromCSV(SHINY_WEEKLY_CSV);
    shinyWeeklyWeeks = buildShinyWeeklyModel(rows);
    console.log('✔ Shiny Weekly loaded:', rows.length);
  }

  // -------------------------------------------------------
  // DONATORS
  // -------------------------------------------------------

  if (!donatorsData) {
    donatorsData = await loadDonatorsFromCSV(DONATORS_CSV);
    console.log('✔ Donators loaded:', donatorsData.length);
  }

  // -------------------------------------------------------
  // MEMBERS
  // -------------------------------------------------------

  if (!membersData) {
    membersData = await loadMembersFromCSV(MEMBERS_CSV);
    console.log('✔ Members loaded:', membersData.length);
  }

  // -------------------------------------------------------
  // SHINY SHOWCASE (RAW ROWS)
  // -------------------------------------------------------

  if (!showcaseRows) {
    showcaseRows = await loadCSV(SHINYSHOWCASE_CSV);
    console.log('✔ Shiny Showcase rows loaded:', showcaseRows.length);
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

  // -------------------------------------------------------
  // MEMBER DETAIL
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // HITLIST (PLACEHOLDER — LOGIC COMES LATER)
  // -------------------------------------------------------

  else if (page === 'hitlist') {
    content.innerHTML = `<div id="shiny-dex-container"></div>`;
    setupShinyDexHitlistSearch({}, []);
  }

  // -------------------------------------------------------
  // DONATORS
  // -------------------------------------------------------

  else if (page === 'donators') {
    renderDonators(donatorsData);
  }

  // -------------------------------------------------------
  // SHINY WEEKLY
  // -------------------------------------------------------

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
