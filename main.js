// main.js (ROOT)
// Entrypoint — ShinyDex + Showcase + Donators
// ShinyWeekly remains disabled until rewired to the unified card contract.

import { loadPokemon } from './src/data/pokemon.loader.js';
import { buildPokemonData, POKEMON_POINTS } from './src/data/pokemondatabuilder.js';

import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';

import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadMembers } from './src/data/members.loader.js';

import { setupShinyDexPage } from './src/features/shinydex/shinydex.js';
import { setupShowcasePage } from './src/features/showcase/showcase.js';

import { loadDonators } from './src/data/donators.loader.js';
import { setupDonatorsPage } from './src/features/donators/donators.js';

// ---------------------------------------------------------
// DATA CACHES
// ---------------------------------------------------------

let pokemonDataLoaded = false;
let shinyWeeklyWeeks = null;
let shinyShowcaseRows = null;
let membersRows = null;
let donatorsRows = null;

// ---------------------------------------------------------
// ROUTING
// ---------------------------------------------------------

function getRoute() {
  const raw = String(location.hash || '').trim();

  if (!raw || raw === '#') return { page: 'hitlist' };

  const lower = raw.toLowerCase();

  if (lower.startsWith('#showcase')) return { page: 'showcase' };
  if (lower === '#donators') return { page: 'donators' };

  // ShinyWeekly disabled for now (avoid broken UI).
  if (lower === '#shinyweekly') return { page: 'hitlist', redirectedFrom: 'shinyweekly' };

  // Default
  return { page: 'hitlist' };
}

function setActiveNav(page) {
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));

  const map = {
    hitlist: 'nav-hitlist',
    showcase: 'nav-showcase',
    donators: 'nav-donators'
  };

  document.getElementById(map[page])?.classList.add('active');
}

// ---------------------------------------------------------
// PAGE RENDER
// ---------------------------------------------------------

async function ensurePokemonData() {
  if (pokemonDataLoaded) return;
  const pokemonRows = await loadPokemon();
  buildPokemonData(pokemonRows);
  pokemonDataLoaded = true;
}

async function ensureShowcaseRows() {
  if (shinyShowcaseRows) return;
  shinyShowcaseRows = await loadShinyShowcase();
}

async function ensureWeeklyModel() {
  if (shinyWeeklyWeeks) return;
  const rows = await loadShinyWeekly();
  shinyWeeklyWeeks = buildShinyWeeklyModel(rows);
}

async function ensureMembersRows() {
  if (membersRows) return;
  membersRows = await loadMembers();
}

async function ensureDonatorsRows() {
  if (donatorsRows) return;
  donatorsRows = await loadDonators();
}

async function renderPage() {
  const route = getRoute();

  if (route.redirectedFrom === 'shinyweekly') {
    if (location.hash !== '#hitlist') {
      location.hash = '#hitlist';
      return;
    }
  }

  setActiveNav(route.page);

  const content = document.getElementById('page-content');
  content.innerHTML = '';

  if (route.page === 'donators') {
    await ensureDonatorsRows();
    setupDonatorsPage({ donatorsRows });
    return;
  }

  if (route.page === 'showcase') {
    await ensurePokemonData();
    await ensureShowcaseRows();
    await ensureMembersRows();

    setupShowcasePage({
      membersRows,
      showcaseRows: shinyShowcaseRows,
      pokemonPoints: POKEMON_POINTS
    });

    return;
  }

  // ShinyDex (Hitlist/Living)
  await ensurePokemonData();
  await ensureWeeklyModel();
  await ensureShowcaseRows();

  setupShinyDexPage({ weeklyModel: shinyWeeklyWeeks, shinyShowcaseRows });
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
