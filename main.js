// main.js (ROOT)
// Entrypoint — JSON-only runtime
// All data preprocessed in CI

import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';

import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadPokemon } from './src/data/pokemon.loader.js';
import { loadMembers } from './src/data/members.loader.js';
import { loadDonators } from './src/data/donators.loader.js';

import {
  buildPokemonData,
  POKEMON_POINTS
} from './src/data/pokemondatabuilder.js';

import { buildMembersModel } from './src/data/members.model.js';

import {
  renderShowcaseGallery,
  setupShowcaseSearchAndSort,
  renderMemberShowcase
} from './src/features/showcase/showcase.js';

import { setupShinyDexPage } from './src/features/shinydex/shinydex.js';
import { renderDonators } from './src/features/donators/donators.js';
import { renderShinyWeekly } from './src/features/shinyweekly/shinyweekly.ui.js';

// ---------------------------------------------------------
// DATA CACHES
// ---------------------------------------------------------

let shinyWeeklyWeeks = null;
let donatorsData = null;
let membersData = null;
let shinyShowcaseRows = null;
let teamMembers = null;
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
  // POKÉMON DATA
  // -------------------------------------------------------

  if (!pokemonDataLoaded) {
    const pokemonRows = await loadPokemon();
    buildPokemonData(pokemonRows);
    pokemonDataLoaded = true;
  }

  // -------------------------------------------------------
  // SHINY WEEKLY
  // -------------------------------------------------------

  if (!shinyWeeklyWeeks) {
    const rows = await loadShinyWeekly();
    shinyWeeklyWeeks = buildShinyWeeklyModel(rows);
  }

  // -------------------------------------------------------
  // DONATORS
  // -------------------------------------------------------

  if (!donatorsData) {
    donatorsData = await loadDonators();
  }

  // -------------------------------------------------------
  // MEMBERS + SHOWCASE → TEAM MODEL
  // -------------------------------------------------------

  if (!membersData) {
    membersData = await loadMembers();
  }

  if (!shinyShowcaseRows) {
    shinyShowcaseRows = await loadShinyShowcase();
  }

  if (!teamMembers) {
    teamMembers = buildMembersModel(membersData, shinyShowcaseRows);
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
      teamMembers.filter(m => m.active),
      renderShowcaseGallery,
      null,
      teamMembers,
      POKEMON_POINTS
    );
  }

  // -------------------------------------------------------
  // MEMBER DETAIL
  // -------------------------------------------------------

  else if (page === 'member') {
    const m = teamMembers.find(
      x => x.name.toLowerCase() === member.toLowerCase()
    );

    if (!m) {
      content.textContent = 'Member not found.';
      return;
    }

    renderMemberShowcase(m, null, teamMembers, POKEMON_POINTS);
  }

  // -------------------------------------------------------
  // HITLIST + LIVING DEX (PAGE CONTROLLER)
  // -------------------------------------------------------

  else if (page === 'hitlist') {
    setupShinyDexPage({
      weeklyModel: shinyWeeklyWeeks,
      shinyShowcaseRows
    });
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
      document.getElementById('shinyweekly-container'),
      membersData
    );
  }
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
