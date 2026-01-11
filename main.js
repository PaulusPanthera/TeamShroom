// main.js
// Entrypoint — JSON-only runtime
// All normalization and derivation happens in CI or data builders

import { loadPokemon } from './src/data/pokemon.loader.js';
import { loadMembers } from './src/data/members.loader.js';
import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { loadDonators } from './src/data/donators.loader.js';

import {
  buildPokemonData,
  HITLIST_DEX,
  HITLIST_LEADERBOARD,
  LIVING_DEX
} from './src/data/pokemondatabuilder.js';

import { buildMembersModel } from './src/data/members.model.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';

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
let donatorsRows = null;

let teamMembers = null;
let shinyWeeklyWeeks = null;

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
  // LOAD RAW DATA (ONCE)
  // -------------------------------------------------------

  if (!pokemonRows) pokemonRows = await loadPokemon();
  if (!membersRows) membersRows = await loadMembers();
  if (!shinyShowcaseRows) shinyShowcaseRows = await loadShinyShowcase();
  if (!shinyWeeklyRows) shinyWeeklyRows = await loadShinyWeekly();
  if (!donatorsRows) donatorsRows = await loadDonators();

  // -------------------------------------------------------
  // BUILD MODELS (ORDER IS CRITICAL)
  // -------------------------------------------------------

  if (!teamMembers) {
    teamMembers = buildMembersModel(membersRows, shinyShowcaseRows);
  }

  buildPokemonData(
    pokemonRows,
    teamMembers,
    shinyWeeklyRows
  );

  if (!shinyWeeklyWeeks) {
    shinyWeeklyWeeks = buildShinyWeeklyModel(shinyWeeklyRows);
  }

  // -------------------------------------------------------
  // ROUTES
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
      teamMembers
    );
  }

  else if (page === 'member') {
    const m = teamMembers.find(
      x => x.name.toLowerCase() === member.toLowerCase()
    );

    if (!m) {
      content.textContent = 'Member not found.';
      return;
    }

    renderMemberShowcase(m, null, teamMembers);
  }

  else if (page === 'hitlist') {
    content.innerHTML = `<div id="shiny-dex-container"></div>`;

    setupShinyDexHitlistSearch({
      hitlistDex: HITLIST_DEX,
      hitlistLeaderboard: HITLIST_LEADERBOARD,
      livingDex: LIVING_DEX
    });
  }

  else if (page === 'shinyweekly') {
    content.innerHTML = `<div id="shinyweekly-container"></div>`;

    renderShinyWeekly(
      shinyWeeklyWeeks,
      document.getElementById('shinyweekly-container'),
      teamMembers
    );
  }

  else if (page === 'donators') {
    renderDonators(donatorsRows);
  }
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
