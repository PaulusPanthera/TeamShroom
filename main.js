// main.js
// Application entrypoint — orchestration only
// Loads JSON, builds models once, wires correct shapes to UI

import { loadPokemon } from './src/data/pokemon.loader.js';
import { loadMembers } from './src/data/members.loader.js';
import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadDonators } from './src/data/donators.loader.js';

import { buildMembersModel } from './src/data/members.model.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';
import { buildPokemonData } from './src/data/pokemondatabuilder.js';

import { renderShinyWeekly } from './src/features/shinyweekly/shinyweekly.ui.js';
import { setupShinyDexHitlistSearch } from './src/features/shinydex/shinydex.js';
import { renderDonators } from './src/features/donators/donators.js';

// ---------------------------------------------------------
// CACHED DATA (BUILT ONCE)
// ---------------------------------------------------------

let pokemonRows = null;
let membersRows = null;
let shinyWeeklyRows = null;
let shinyShowcaseRows = null;

let membersModel = null;
let shinyWeeklyModel = null;

// ---------------------------------------------------------
// ROUTING
// ---------------------------------------------------------

function getRoute() {
  const hash = location.hash || '#showcase';

  if (hash.startsWith('#hitlist')) return 'hitlist';
  if (hash.startsWith('#shinyweekly')) return 'shinyweekly';
  if (hash.startsWith('#donators')) return 'donators';

  return 'showcase';
}

// ---------------------------------------------------------
// INITIAL LOAD (JSON + MODELS)
// ---------------------------------------------------------

async function ensureDataLoaded() {
  if (!pokemonRows) {
    pokemonRows = await loadPokemon();
  }

  if (!membersRows) {
    membersRows = await loadMembers();
  }

  if (!shinyWeeklyRows) {
    shinyWeeklyRows = await loadShinyWeekly();
  }

  if (!shinyShowcaseRows) {
    shinyShowcaseRows = await loadShinyShowcase();
  }

  if (!membersModel) {
    membersModel = buildMembersModel(membersRows, shinyShowcaseRows);
  }

  if (!shinyWeeklyModel) {
    shinyWeeklyModel = buildShinyWeeklyModel(shinyWeeklyRows);
  }

  // Derived Pokémon state (Hitlist + Living Dex)
  // MUST run after membersModel and shinyWeeklyRows exist
  buildPokemonData(pokemonRows, membersModel, shinyWeeklyRows);
}

// ---------------------------------------------------------
// PAGE RENDER
// ---------------------------------------------------------

async function renderPage() {
  await ensureDataLoaded();

  const page = getRoute();
  const content = document.getElementById('page-content');

  content.innerHTML = '';

  // -------------------------------------------------------
  // HITLIST / LIVING DEX
  // -------------------------------------------------------

  if (page === 'hitlist') {
    content.innerHTML = `<div id="shiny-dex-container"></div>`;
    setupShinyDexHitlistSearch();
    return;
  }

  // -------------------------------------------------------
  // SHINY WEEKLY
  // -------------------------------------------------------

  if (page === 'shinyweekly') {
    content.innerHTML = `<div id="shinyweekly-container"></div>`;

    renderShinyWeekly(
      shinyWeeklyModel,
      document.getElementById('shinyweekly-container'),
      membersRows
    );

    return;
  }

  // -------------------------------------------------------
  // DONATORS
  // -------------------------------------------------------

  if (page === 'donators') {
    const donators = await loadDonators();
    renderDonators(donators);
    return;
  }

  // -------------------------------------------------------
  // DEFAULT / SHOWCASE PLACEHOLDER
  // -------------------------------------------------------

  content.textContent = 'Showcase coming back next.';
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
