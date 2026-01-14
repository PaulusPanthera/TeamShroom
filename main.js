// main.js
// v2.0.0-beta
// Entrypoint — ShinyDex + Showcase + Donators + Shiny Weekly

import { loadPokemon } from './src/data/pokemon.loader.js';
import { buildPokemonData, POKEMON_POINTS } from './src/data/pokemondatabuilder.js';

import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadMembers } from './src/data/members.loader.js';

import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from './src/data/shinyweekly.model.js';

import { renderPokedexPage } from './src/features/pokedex/pokedex.page.js';
import { setupShowcasePage } from './src/features/showcase/showcase.js';
import { setupShinyWeeklyPage } from './src/features/shinyweekly/shinyweekly.page.js';

import { loadDonators } from './src/data/donators.loader.js';
import { setupDonatorsPage } from './src/features/donators/donators.js';

// ---------------------------------------------------------
// DATA CACHES
// ---------------------------------------------------------

let pokemonDataLoaded = false;
let shinyShowcaseRows = null;
let membersRows = null;
let donatorsRows = null;
let weeklyModel = null;

// ---------------------------------------------------------
// ROUTING
// ---------------------------------------------------------

function getRoute() {
  const raw = String(location.hash || '').trim();

  if (!raw || raw === '#') return { page: 'hitlist' };

  const lower = raw.toLowerCase();

  // Shiny Pokédex
  if (lower.startsWith('#hitlist') || lower.startsWith('#pokedex')) {
    // View is resolved inside the Pokédex shell.
    return { page: 'hitlist' };
  }

  if (lower.startsWith('#showcase')) return { page: 'showcase' };
  if (lower === '#donators') return { page: 'donators' };

  if (lower === '#shinyweekly') return { page: 'shinyweekly' };

  // Default
  return { page: 'hitlist' };
}

function setActiveNav(page) {
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));

  const map = {
    hitlist: 'nav-hitlist',
    showcase: 'nav-showcase',
    shinyweekly: 'nav-shinyweekly',
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

async function ensureMembersRows() {
  if (membersRows) return;
  membersRows = await loadMembers();
}

async function ensureDonatorsRows() {
  if (donatorsRows) return;
  donatorsRows = await loadDonators();
}

async function ensureWeeklyModel() {
  if (weeklyModel) return;
  const weeklyRows = await loadShinyWeekly();
  weeklyModel = buildShinyWeeklyModel(weeklyRows);
}

async function renderPage() {
  const route = getRoute();

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

  if (route.page === 'shinyweekly') {
    await ensureWeeklyModel();
    await ensureMembersRows();

    setupShinyWeeklyPage({
      weeklyModel,
      membersRows
    });

    return;
  }

  // ShinyDex (Hitlist/Living)
  await renderPokedexPage();
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
