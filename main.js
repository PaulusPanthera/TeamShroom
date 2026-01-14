// main.js (ROOT)
// Entrypoint — Shiny Dex + Donators
// Other pages remain disabled until their feature rewires are complete.

import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';

import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadPokemon } from './src/data/pokemon.loader.js';

import { buildPokemonData } from './src/data/pokemondatabuilder.js';
import { setupShinyDexPage } from './src/features/shinydex/shinydex.js';

import { loadDonators } from './src/data/donators.loader.js';
import { setupDonatorsPage } from './src/features/donators/donators.js';

// ---------------------------------------------------------
// DATA CACHES
// ---------------------------------------------------------

let shinyWeeklyWeeks = null;
let shinyShowcaseRows = null;
let pokemonDataLoaded = false;

let donatorsRows = null;

// ---------------------------------------------------------
// ROUTING
// ---------------------------------------------------------

function getRoute() {
  const h = String(location.hash || '').replace('#', '').trim().toLowerCase();
  if (h === 'donators') return { page: 'donators' };
  // Default and fallback.
  return { page: 'hitlist' };
}

function setActiveNav(page) {
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));

  const map = {
    hitlist: 'nav-hitlist',
    donators: 'nav-donators'
  };

  document.getElementById(map[page])?.classList.add('active');
}

// ---------------------------------------------------------
// PAGE RENDER
// ---------------------------------------------------------

async function renderPage() {
  const { page } = getRoute();
  setActiveNav(page);

  const content = document.getElementById('page-content');
  content.innerHTML = '';

  if (page === 'donators') {
    if (!donatorsRows) {
      donatorsRows = await loadDonators();
    }

    setupDonatorsPage({
      donatorsRows
    });

    return;
  }

  // -------------------------------------------------------
  // HITLIST / LIVING DEX (ShinyDex)
  // -------------------------------------------------------

  // Pokémon data (required by Shiny Dex)
  if (!pokemonDataLoaded) {
    const pokemonRows = await loadPokemon();
    buildPokemonData(pokemonRows);
    pokemonDataLoaded = true;
  }

  // Shiny Weekly model (required by Shiny Dex filters/context)
  if (!shinyWeeklyWeeks) {
    const rows = await loadShinyWeekly();
    shinyWeeklyWeeks = buildShinyWeeklyModel(rows);
  }

  // Showcase rows (required to resolve owners/claims in Shiny Dex)
  if (!shinyShowcaseRows) {
    shinyShowcaseRows = await loadShinyShowcase();
  }

  setupShinyDexPage({ weeklyModel: shinyWeeklyWeeks, shinyShowcaseRows });
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
