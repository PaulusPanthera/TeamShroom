// main.js (ROOT)
// Entrypoint — JSON-only runtime
// All data preprocessed in CI
// Runtime only wires models → UI

import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';
import { buildShinyDexModel } from './src/data/shinydex.model.js';

import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadPokemon } from './src/data/pokemon.loader.js';
import { loadMembers } from './src/data/members.loader.js';
import { loadDonators } from './src/data/donators.loader.js';

import { buildPokemonData, POKEMON_POINTS } from './src/data/pokemondatabuilder.js';
import { buildMembersModel } from './src/data/members.model.js';

import {
  renderShowcaseGallery,
  setupShowcaseSearchAndSort,
  renderMemberShowcase
} from './src/features/showcase/showcase.js';

import { setupShinyDexHitlistSearch } from './src/features/shinydex/shinydex.js';
import { renderDonators } from './src/features/donators/donators.js';
import { renderShinyWeekly } from './src/features/shinyweekly/shinyweekly.ui.js';

// ---------------------------------------------------------
// RUNTIME STATE (SINGLE INITIALIZATION)
// ---------------------------------------------------------

let shinyWeeklyWeeks = null;
let shinyDexData = null;
let donatorsData = null;
let membersData = null;
let shinyShowcaseRows = null;
let teamMembers = null;
let pokemonRows = null;

let initialized = false;

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
// ONE-TIME INITIALIZATION (CRITICAL FIX)
// ---------------------------------------------------------

async function initRuntime() {
  if (initialized) return;

  // Load ALL raw data first
  [
    pokemonRows,
    membersData,
    shinyShowcaseRows,
    donatorsData
  ] = await Promise.all([
    loadPokemon(),
    loadMembers(),
    loadShinyShowcase(),
    loadDonators()
  ]);

  // Build member model
  teamMembers = buildMembersModel(membersData, shinyShowcaseRows);

  // Build Pokémon derived data (AFTER members exist)
  buildPokemonData(pokemonRows, teamMembers);

  // Weekly → Dex pipeline
  const weeklyRows = await loadShinyWeekly();
  shinyWeeklyWeeks = buildShinyWeeklyModel(weeklyRows);
  shinyDexData = buildShinyDexModel(shinyWeeklyWeeks);

  initialized = true;
}

// ---------------------------------------------------------
// PAGE RENDER
// ---------------------------------------------------------

async function renderPage() {
  await initRuntime();

  const { page, member } = getRoute();
  setActiveNav(page);

  const content = document.getElementById('page-content');
  content.innerHTML = '';

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
  // HITLIST / LIVING DEX
  // -------------------------------------------------------

  else if (page === 'hitlist') {
    content.innerHTML = `<div id="shiny-dex-container"></div>`;
    setupShinyDexHitlistSearch(shinyDexData);
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
