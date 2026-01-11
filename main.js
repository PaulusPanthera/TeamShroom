// main.js (ROOT)
// Entrypoint — JSON-only runtime
// All data preprocessed in CI

import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';

import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadPokemon } from './src/data/pokemon.loader.js';
import { loadMembers } from './src/data/members.loader.js';
import { loadDonators } from './src/data/donators.loader.js';

import { buildPokemonData, POKEMON_POINTS } from './src/data/pokemondatabuilder.js';

import {
  renderShowcaseGallery,
  setupShowcaseSearchAndSort,
  renderMemberShowcase
} from './src/features/showcase/showcase.js';

import { setupShinyDexHitlistSearch } from './src/features/shinydex/shinydexsearch.js';
import { renderDonators } from './src/features/donators/donators.js';
import { renderShinyWeekly } from './src/features/shinyweekly/shinyweekly.ui.js';

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
  // POKEMON DATA (JSON)
  // -------------------------------------------------------

  if (!pokemonDataLoaded) {
    const pokemonRows = await loadPokemon();
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
  // DONATORS (JSON)
  // -------------------------------------------------------

  if (!donatorsData) {
    donatorsData = await loadDonators();
  }

  // -------------------------------------------------------
  // MEMBERS (JSON)
  // -------------------------------------------------------

  if (!membersData) {
    membersData = await loadMembers();
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
