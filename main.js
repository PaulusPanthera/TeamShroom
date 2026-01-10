// main.js (ROOT)
// Entrypoint — Google Sheets is source of truth
// HARD CONTRACT VERSION (Showcase + Member wired, Hitlist excluded)

import { loadShinyWeeklyFromCSV } from './src/data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';

import {
  buildPokemonData,
  POKEMON_POINTS
} from './src/data/pokemondatabuilder.js';

import { loadDonatorsFromCSV } from './src/data/donators.loader.js';
import { loadMembersFromCSV } from './src/data/member.loader.js';
import { loadShinyShowcaseFromCSV } from './src/data/shinyshowcase.loader.js';
import { buildMemberModel } from './src/data/member.model.js';

import {
  renderShowcaseGallery,
  setupShowcaseSearchAndSort,
  renderMemberShowcase
} from './src/features/showcase/showcase.js';

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

// ---------------------------------------------------------
// DATA CACHES
// ---------------------------------------------------------

let shinyWeeklyWeeks = null;
let donatorsData = null;
let teamShowcase = null;
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
  // POKÉMON DATA
  // -------------------------------------------------------

  if (!pokemonDataLoaded) {
    await buildPokemonData();
    pokemonDataLoaded = true;
    console.log('✔ Pokémon data loaded');
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
  // TEAM SHOWCASE (MEMBERS + SHINIES)
  // -------------------------------------------------------

  if (!teamShowcase) {
    const [members, shinies] = await Promise.all([
      loadMembersFromCSV(MEMBERS_CSV),
      loadShinyShowcaseFromCSV(SHINYSHOWCASE_CSV)
    ]);

    teamShowcase = buildMemberModel(members, shinies);
    console.log('✔ Team Showcase built:', teamShowcase.length);
  }

  // -------------------------------------------------------
  // SHOWCASE
  // -------------------------------------------------------

  if (page === 'showcase') {
    content.innerHTML = `
      <div class="showcase-search-controls"></div>
      <div id="showcase-gallery-container"></div>
    `;

    const members = teamShowcase
      .filter(m => m.active)
      .map(m => ({
        name: m.name,
        shinies: m.shinies.filter(s => !s.lost && !s.sold).length
      }));

    setupShowcaseSearchAndSort(
      members,
      renderShowcaseGallery,
      null,
      teamShowcase,
      POKEMON_POINTS
    );
  }

  // -------------------------------------------------------
  // MEMBER DETAIL
  // -------------------------------------------------------

  else if (page === 'member') {
    const m = teamShowcase.find(
      x => x.key === member.toLowerCase()
    );

    if (!m) {
      content.textContent = 'Member not found.';
      return;
    }

    renderMemberShowcase(m, null, teamShowcase, POKEMON_POINTS);
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
