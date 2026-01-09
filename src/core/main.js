// src/core/main.js
// Entrypoint — HARD CONTRACT VERSION
// Google Sheets is source of truth for Shiny Weekly

import { loadShinyWeeklyFromCSV } from '../data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from '../data/shinyweekly.model.js';

import {
  buildPokemonData,
  POKEMON_POINTS,
  TIER_FAMILIES,
  pokemonFamilies
} from '../data/pokemondatabuilder.js';

import {
  renderShowcaseGallery,
  setupShowcaseSearchAndSort,
  renderMemberShowcase
} from '../features/showcase/showcase.js';

import { setupShinyDexHitlistSearch } from '../features/shinydex/shinydexsearch.js';
import { renderDonators, assignDonatorTiersToTeam } from '../features/donators/donators.js';
import { renderShinyWeekly } from '../features/shinyweekly/shinyweekly.ui.js';

// ---------------------------------------------------------
// CONFIG
// ---------------------------------------------------------

const SHINY_WEEKLY_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB6vHVjwL9_F3DVIVgXxP8rtWEDQyZaDTnG2yAw96j4_1DXU7317lBFaY0N5JnDhdvUnkvgAvb6p8o/pub?gid=0&single=true&output=csv';

// ---------------------------------------------------------
// DATA CACHES
// ---------------------------------------------------------

let teamShowcaseData;
let pokemonFamiliesData;
let donationsData;
let shinyWeeklyWeeks;

// ---------------------------------------------------------
// FETCH HELPERS
// ---------------------------------------------------------

async function fetchJson(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`Failed to fetch ${path}`);
  return r.json();
}

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
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
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

  // ---------- Load static JSON (legacy, for now) ----------
  if (!teamShowcaseData) {
    teamShowcaseData = await fetchJson('/src/data/teamshowcase.json');
  }

  if (!pokemonFamiliesData) {
    pokemonFamiliesData = await fetchJson('/src/data/pokemonfamilies.json');
    buildPokemonData(pokemonFamiliesData);
  }

  if (!donationsData) {
    donationsData = await fetchJson('/src/data/donations.json');
  }

  // ---------- Load Shiny Weekly from Google Sheets ----------
  if (!shinyWeeklyWeeks) {
    const rows = await loadShinyWeeklyFromCSV(SHINY_WEEKLY_CSV);
    shinyWeeklyWeeks = buildShinyWeeklyModel(rows);

    // Debug once (safe to remove later)
    console.log('CLEAN ROW COUNT:', rows.length);
    console.log('WEEK COUNT:', shinyWeeklyWeeks.length);
    console.log('FIRST WEEK:', shinyWeeklyWeeks[0]);
  }

  assignDonatorTiersToTeam(teamShowcaseData, null, donationsData);

  // -------------------------------------------------------
  // SHOWCASE
  // -------------------------------------------------------

  if (page === 'showcase') {
    content.innerHTML = `
      <div class="showcase-search-controls"></div>
      <div id="showcase-gallery-container"></div>
    `;

    const members = teamShowcaseData.map(m => ({
      name: m.name,
      shinies: m.shinies?.filter(s => !s.lost).length || 0,
      status: m.status,
      donator: m.donator
    }));

    setupShowcaseSearchAndSort(
      members,
      renderShowcaseGallery,
      null,
      teamShowcaseData,
      POKEMON_POINTS
    );
  }

  // -------------------------------------------------------
  // MEMBER DETAIL
  // -------------------------------------------------------

  else if (page === 'member') {
    const m = teamShowcaseData.find(
      x => x.name.toLowerCase() === member.toLowerCase()
    );

    if (!m) {
      content.textContent = 'Member not found.';
      return;
    }

    renderMemberShowcase(m, null, teamShowcaseData, POKEMON_POINTS);
  }

  // -------------------------------------------------------
  // HITLIST
  // -------------------------------------------------------

  else if (page === 'hitlist') {
    content.innerHTML = `<div id="shiny-dex-container"></div>`;

    const shinyDex = {};
    pokemonFamiliesData.forEach(entry => {
      const region = entry.region || 'Other';
      shinyDex[region] ??= [];
      shinyDex[region].push({
        name: entry.name,
        claimed: entry.claimed,
        region
      });
    });

    setupShinyDexHitlistSearch(shinyDex, teamShowcaseData);
  }

  // -------------------------------------------------------
  // DONATORS
  // -------------------------------------------------------

  else if (page === 'donators') {
    renderDonators(donationsData);
  }

  // -------------------------------------------------------
  // SHINY WEEKLY
  // -------------------------------------------------------

  else if (page === 'shinyweekly') {
    content.innerHTML = `<div id="shinyweekly-container"></div>`;
    renderShinyWeekly(
      shinyWeeklyWeeks,
      document.getElementById('shinyweekly-container')
    );
  }
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
