// main.js
// Entrypoint — JSON-only runtime
// All data preprocessed in CI

import { loadPokemon } from './src/data/pokemon.loader.js';
import { loadMembers } from './src/data/members.loader.js';
import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadDonators } from './src/data/donators.loader.js';

import { buildMembersModel } from './src/data/members.model.js';
import { buildPokemonData } from './src/data/pokemondatabuilder.js';

import { renderShinyWeekly } from './src/features/shinyweekly/shinyweekly.ui.js';
import { setupShinyDexHitlistSearch } from './src/features/shinydex/shinydex.js';
import { renderDonators } from './src/features/donators/donators.js';

// ---------------------------------------------------------
// CACHES
// ---------------------------------------------------------

let pokemonRows;
let membersRows;
let shinyWeeklyRows;
let shinyShowcaseRows;
let membersModel;

// ---------------------------------------------------------
// ROUTING
// ---------------------------------------------------------

function getRoute() {
  const h = location.hash || '#showcase';
  if (h.startsWith('#hitlist')) return 'hitlist';
  if (h.startsWith('#shinyweekly')) return 'shinyweekly';
  if (h.startsWith('#donators')) return 'donators';
  return 'showcase';
}

// ---------------------------------------------------------
// RENDER
// ---------------------------------------------------------

async function renderPage() {
  const page = getRoute();
  const content = document.getElementById('page-content');
  content.innerHTML = '';

  if (!pokemonRows) pokemonRows = await loadPokemon();
  if (!membersRows) membersRows = await loadMembers();
  if (!shinyWeeklyRows) shinyWeeklyRows = await loadShinyWeekly();
  if (!shinyShowcaseRows) shinyShowcaseRows = await loadShinyShowcase();

  if (!membersModel) {
    membersModel = buildMembersModel(membersRows, shinyShowcaseRows);
  }

  buildPokemonData(pokemonRows, membersModel, shinyWeeklyRows);

  if (page === 'hitlist') {
    content.innerHTML = `<div id="shiny-dex-container"></div>`;
    setupShinyDexHitlistSearch();
  }

  if (page === 'shinyweekly') {
    content.innerHTML = `<div id="shinyweekly-container"></div>`;
    renderShinyWeekly(
      shinyWeeklyRows,
      document.getElementById('shinyweekly-container'),
      membersModel
    );
  }

  if (page === 'donators') {
    const donators = await loadDonators();
    renderDonators(donators);
  }
}

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
