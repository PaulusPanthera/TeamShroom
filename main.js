// main.js
// v2.0.0-beta
// App entry routing + page bootstrapping

import {
  initPokemonDerivedDataOnce,
  getPokemonPointsMap
} from './src/domains/pokemon/pokemon.data.js';

import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadMembers } from './src/data/members.loader.js';

import { renderPokedexPage } from './src/features/pokedex/pokedex.page.js';
import { setupShowcasePage } from './src/features/showcase/showcase.js';

import { loadDonators } from './src/data/donators.loader.js';
import { setupDonatorsPage } from './src/features/donators/donators.js';

// ---------------------------------------------------------
// DATA CACHES
// ---------------------------------------------------------

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

  // Shiny Pokédex
  if (lower.startsWith('#hitlist') || lower.startsWith('#pokedex')) {
    // View is resolved inside the Pokédex shell.
    return { page: 'hitlist' };
  }

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
  await initPokemonDerivedDataOnce();
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
      pokemonPoints: getPokemonPointsMap()
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
