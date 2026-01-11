// main.js (ROOT)
// Entrypoint — JSON-only runtime
// All data preprocessed in CI

import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';
import { buildShinyDexModel } from './src/data/shinydex.model.js';

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

import { setupShinyDexHitlistSearch } from './src/features/shinydex/shinydex.js';
import { renderDonators } from './src/features/donators/donators.js';
import { renderShinyWeekly } from './src/features/shinyweekly/shinyweekly.ui.js';

// ---------------------------------------------------------
// DATA CACHES
// ---------------------------------------------------------

let pokemonRows = null;
let membersRows = null;
let shinyShowcaseRows = null;
let shinyWeeklyRows = null;
let donatorsData = null;

let teamMembers = null;
let shinyWeeklyWeeks = null;
let shinyDexData = null;

let runtimeBuilt = false;

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
// BOOTSTRAP (STRICT ORDER)
// ---------------------------------------------------------

async function ensureRuntimeBuilt() {
  if (runtimeBuilt) return;

  // 1. Load primary datasets
  pokemonRows = await loadPokemon();
  membersRows = await loadMembers();
  shinyShowcaseRows = await loadShinyShowcase();
  shinyWeeklyRows = await loadShinyWeekly();
  donatorsData = await loadDonators();

  // 2. Build members model (required by multiple systems)
  teamMembers = buildMembersModel(membersRows, shinyShowcaseRows);

  // 3. Build Pokémon-derived runtime state (needs teamMembers)
  buildPokemonData(pokemonRows, teamMembers);

  // 4. Build Shiny Weekly aggregation
  shinyWeeklyWeeks = buildShinyWeeklyModel(shinyWeeklyRows);

  // 5. Build Shiny Dex model (depends on Pokémon + Weekly)
  shinyDexData = buildShinyDexModel(shinyWeeklyWeeks);

  runtimeBuilt = true;
}

// ---------------------------------------------------------
// PAGE RENDER
// ---------------------------------------------------------

async function renderPage() {
  const { page, member } = getRoute();
  setActiveNav(page);

  const content = document.getElementById('page-content');
  content.innerHTML = '';

  await ensureRuntimeBuilt();

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
      membersRows
    );
  }
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
