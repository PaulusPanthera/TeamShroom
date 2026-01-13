// main.js (ROOT)
// Entrypoint — Shiny Dex only (stabilization mode)
// All other pages disabled until Shiny Dex is locked.

import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';

import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadPokemon } from './src/data/pokemon.loader.js';

import { buildPokemonData } from './src/data/pokemondatabuilder.js';
import { setupShinyDexPage } from './src/features/shinydex/shinydex.js';

// ---------------------------------------------------------
// DATA CACHES
// ---------------------------------------------------------

let shinyWeeklyWeeks = null;
let shinyShowcaseRows = null;
let pokemonDataLoaded = false;

// ---------------------------------------------------------
// ROUTING (LOCKED TO HITLIST)
// ---------------------------------------------------------

function getRoute() {
  return { page: 'hitlist' };
}

function setActiveNav(page) {
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));

  const map = {
    hitlist: 'nav-hitlist'
  };

  document.getElementById(map[page])?.classList.add('active');
}

// ---------------------------------------------------------
// PAGE RENDER
// ---------------------------------------------------------

async function renderPage() {
  // Force URL hash to hitlist to prevent broken pages from executing.
  if (!location.hash || !location.hash.startsWith('#hitlist')) {
    if (location.hash !== '#hitlist') {
      location.hash = '#hitlist';
      return;
    }
  }

  const { page } = getRoute();
  setActiveNav(page);

  const content = document.getElementById('page-content');
  content.innerHTML = '';

  // -------------------------------------------------------
  // POKÉMON DATA (required by Shiny Dex)
  // -------------------------------------------------------

  if (!pokemonDataLoaded) {
    const pokemonRows = await loadPokemon();
    buildPokemonData(pokemonRows);
    pokemonDataLoaded = true;
  }

  // -------------------------------------------------------
  // SHINY WEEKLY MODEL (required by Shiny Dex filters/context)
  // -------------------------------------------------------

  if (!shinyWeeklyWeeks) {
    const rows = await loadShinyWeekly();
    shinyWeeklyWeeks = buildShinyWeeklyModel(rows);
  }

  // -------------------------------------------------------
  // SHOWCASE ROWS (required to resolve owners/claims in Shiny Dex)
  // -------------------------------------------------------

  if (!shinyShowcaseRows) {
    shinyShowcaseRows = await loadShinyShowcase();
  }

  // -------------------------------------------------------
  // HITLIST + LIVING DEX (PAGE CONTROLLER)
  // -------------------------------------------------------

  setupShinyDexPage({
    weeklyModel: shinyWeeklyWeeks,
    shinyShowcaseRows
  });
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
