// main.js
// v2.0.0-beta
// App entry routing + global header + page bootstrapping

import {
  initPokemonDerivedDataOnce,
  getPokemonPointsMap
} from './src/domains/pokemon/pokemon.data.js';

import { loadShinyShowcase } from './src/data/shinyshowcase.loader.js';
import { loadMembers } from './src/data/members.loader.js';
import { loadShinyWeekly } from './src/data/shinyweekly.loader.js';
import { loadDonators } from './src/data/donators.loader.js';

import { renderPokedexPage } from './src/features/pokedex/pokedex.page.js';
import { setupShowcasePage } from './src/features/showcase/showcase.js';
import { setupDonatorsPage } from './src/features/donators/donators.js';
import { setupShinyWeeklyPage } from './src/features/shinyweekly/shinyweekly.page.js';

/* ---------------------------------------------------------
   GLOBAL HEADER + LEFT SIDEBAR SHELL
--------------------------------------------------------- */

const TS_HEADER_ID = 'ts-header';
const TS_SHELL_ID = 'ts-shell';
const TS_SIDEBAR_ID = 'ts-sidebar';
const TS_SIDEBAR_TITLE_ID = 'ts-sidebar-title';
const TS_SIDEBAR_CONTROLS_ID = 'ts-sidebar-controls';

const TS_COLLECTION_TOGGLE_ID = 'ts-collection-toggle';
const TS_COLLECTION_MODE_CLASS = 'ts-collection-mode';
const TS_COLLECTION_STORAGE_KEY = 'ts:collection-mode:v2';

const TS_LOGO_AUDIO_ID = 'ts-logo-audio';

/* ---------------------------------------------------------
   GLOBAL CSS MODULE LOADER
   - Moves shell + card POP styles out of main.js
--------------------------------------------------------- */

const TS_SHELL_CSS_LINK_ID = 'ts-shell-css-v2';
const TS_CARD_POP_CSS_LINK_ID = 'ts-card-pop-css-v2';

function ensureStylesheetLoaded(linkId, href) {
  if (document.getElementById(linkId)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = href;

  document.head.appendChild(link);
}

function ensureGlobalCssModules() {
  ensureStylesheetLoaded(TS_SHELL_CSS_LINK_ID, 'style/ts.shell.css');
  ensureStylesheetLoaded(TS_CARD_POP_CSS_LINK_ID, 'style/cards/cards.pop.css');
}

/* ---------------------------------------------------------
   LOGO SOUND
--------------------------------------------------------- */

function getLogoAudio() {
  let audio = document.getElementById(TS_LOGO_AUDIO_ID);
  if (audio) return audio;

  audio = document.createElement('audio');
  audio.id = TS_LOGO_AUDIO_ID;
  audio.src = 'sounds/spore.mp3';
  audio.preload = 'auto';
  audio.volume = 0.1;
  audio.style.display = 'none';

  document.body.appendChild(audio);
  return audio;
}

function playLogoSound() {
  const audio = getLogoAudio();

  // Allow rapid re-trigger.
  audio.currentTime = 0;

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      // Ignore autoplay errors. Playback is user-gesture triggered, so this is rare.
    });
  }
}

function updateHeaderHeightVar() {
  const header = document.getElementById(TS_HEADER_ID);
  if (!header) return;

  const h = Math.max(0, Math.round(header.getBoundingClientRect().height));
  document.documentElement.style.setProperty('--ts-header-h', `${h}px`);
}

/* ---------------------------------------------------------
   COLLECTION MODE
--------------------------------------------------------- */

let tsCollectionShortcutsInstalled = false;

function setCollectionMode(enabled, opts = {}) {
  const { persist = true } = opts;

  const body = document.body;
  if (!body) return;

  body.classList.toggle(TS_COLLECTION_MODE_CLASS, !!enabled);

  const btn = document.getElementById(TS_COLLECTION_TOGGLE_ID);
  if (btn) {
    btn.textContent = enabled ? 'MENU' : 'COLLECT';
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.setAttribute('aria-label', enabled ? 'Show UI' : 'Hide UI');
  }

  if (persist) {
    try {
      localStorage.setItem(TS_COLLECTION_STORAGE_KEY, enabled ? '1' : '0');
    } catch {
      // ignore
    }
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => updateHeaderHeightVar());
  });
}

function ensureCollectionToggle() {
  if (document.getElementById(TS_COLLECTION_TOGGLE_ID)) return;

  const btn = document.createElement('button');
  btn.id = TS_COLLECTION_TOGGLE_ID;
  btn.type = 'button';
  btn.textContent = 'COLLECT';
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', 'Hide UI');

  btn.addEventListener('click', () => {
    const enabled = !document.body.classList.contains(TS_COLLECTION_MODE_CLASS);
    setCollectionMode(enabled, { persist: true });
  });

  document.body.appendChild(btn);

  if (!tsCollectionShortcutsInstalled) {
    tsCollectionShortcutsInstalled = true;
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!document.body.classList.contains(TS_COLLECTION_MODE_CLASS)) return;
      setCollectionMode(false, { persist: true });
    });
  }

  let initial = false;
  try {
    initial = localStorage.getItem(TS_COLLECTION_STORAGE_KEY) === '1';
  } catch {
    initial = false;
  }

  if (initial) setCollectionMode(true, { persist: false });
}

/* ---------------------------------------------------------
   APP SHELL (SIDEBAR + MAIN CONTENT)
--------------------------------------------------------- */

function ensureAppShell() {
  if (document.getElementById(TS_SHELL_ID)) return;

  const content = document.getElementById('page-content');
  if (!content) return;

  const shell = document.createElement('div');
  shell.id = TS_SHELL_ID;

  const sidebar = document.createElement('aside');
  sidebar.id = TS_SIDEBAR_ID;
  sidebar.setAttribute('role', 'complementary');

  const sidebarInner = document.createElement('div');
  sidebarInner.className = 'ts-sidebar-inner';

  const titlePanel = document.createElement('div');
  titlePanel.className = 'ts-panel ts-sidebar-panel';

  const title = document.createElement('div');
  title.id = TS_SIDEBAR_TITLE_ID;
  title.className = 'ts-sidebar-title';
  title.textContent = '';

  const hint = document.createElement('div');
  hint.className = 'ts-sidebar-hint';
  hint.id = 'ts-sidebar-hint';
  hint.textContent = '';

  titlePanel.appendChild(title);
  titlePanel.appendChild(hint);

  const controlsPanel = document.createElement('div');
  controlsPanel.className = 'ts-panel ts-sidebar-panel';

  const controls = document.createElement('div');
  controls.id = TS_SIDEBAR_CONTROLS_ID;
  controls.className = 'ts-sidebar-controls';

  controlsPanel.appendChild(controls);

  sidebarInner.appendChild(titlePanel);
  sidebarInner.appendChild(controlsPanel);
  sidebar.appendChild(sidebarInner);

  const parent = content.parentNode;
  if (!parent) return;

  parent.insertBefore(shell, content);

  shell.appendChild(sidebar);
  shell.appendChild(content);
}

/* ---------------------------------------------------------
   TOP HEADER (BRAND + NAV)
--------------------------------------------------------- */

function ensureHeaderShell() {
  if (document.getElementById(TS_HEADER_ID)) return;

  const nav = document.querySelector('nav.nav');
  if (!nav) return;

  // Rename nav labels (keep href/ids stable for routing).
  const aShowcase = nav.querySelector('#nav-showcase');
  const aPokedex = nav.querySelector('#nav-hitlist');
  const aWeekly = nav.querySelector('#nav-shinyweekly');
  const aDonators = nav.querySelector('#nav-donators');

  if (aShowcase) aShowcase.textContent = 'Member';
  if (aPokedex) aPokedex.textContent = 'Pokédex';
  if (aWeekly) aWeekly.textContent = 'Weekly';
  if (aDonators) aDonators.textContent = 'Donators';

  const header = document.createElement('header');
  header.id = TS_HEADER_ID;
  header.setAttribute('role', 'banner');

  const inner = document.createElement('div');
  inner.className = 'ts-header-inner';

  const banner = document.createElement('div');
  banner.className = 'ts-panel ts-banner';

  const top = document.createElement('div');
  top.className = 'ts-banner-top';

  const brand = document.createElement('div');
  brand.className = 'ts-brand';

  const icon = document.createElement('img');
  icon.className = 'ts-brand-icon';
  icon.src = 'img/symbols/shinyshroomsprite.png';
  icon.alt = '';

  const title = document.createElement('div');
  title.className = 'ts-brand-title';
  title.textContent = '[MÜSH] TEAM SHROOM';

  brand.appendChild(icon);
  brand.appendChild(title);

  // Logo click sound
  brand.setAttribute('role', 'button');
  brand.setAttribute('tabindex', '0');
  brand.setAttribute('aria-label', 'Play logo sound');

  brand.addEventListener('click', (e) => {
    e.preventDefault();
    playLogoSound();
  });

  brand.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      playLogoSound();
    }
  });

  top.appendChild(brand);

  banner.appendChild(top);
  banner.appendChild(nav);

  inner.appendChild(banner);
  header.appendChild(inner);

  // Insert header before the shell if it exists, otherwise at top of body.
  const shell = document.getElementById(TS_SHELL_ID);
  if (shell && shell.parentNode) {
    shell.parentNode.insertBefore(header, shell);
  } else {
    document.body.insertBefore(header, document.body.firstChild);
  }

  updateHeaderHeightVar();
}

/* ---------------------------------------------------------
   SIDEBAR CONTENT WIRING
--------------------------------------------------------- */

function setSidebarBase(page) {
  const title = document.getElementById(TS_SIDEBAR_TITLE_ID);
  const hint = document.getElementById('ts-sidebar-hint');
  const controls = document.getElementById(TS_SIDEBAR_CONTROLS_ID);
  if (!title || !controls) return;

  controls.replaceChildren();

  if (page === 'showcase') title.textContent = 'MEMBER';
  else if (page === 'shinyweekly') title.textContent = 'WEEKLY';
  else if (page === 'donators') title.textContent = 'DONATORS';
  else title.textContent = 'POKÉDEX';

  if (hint) {
    if (page === 'shinyweekly') hint.textContent = 'Open a week to view details.';
    else hint.textContent = '';
  }
}

function makeSidebarSection(labelText) {
  const section = document.createElement('div');
  section.className = 'ts-side-section';

  if (labelText) {
    const label = document.createElement('div');
    label.className = 'ts-side-label';
    label.textContent = String(labelText);
    section.appendChild(label);
  }

  return section;
}

function appendIntoSidebar(label, node) {
  const controls = document.getElementById(TS_SIDEBAR_CONTROLS_ID);
  if (!controls || !node) return;

  const section = makeSidebarSection(label);
  section.appendChild(node);
  controls.appendChild(section);
}

function attachSidebarControls(page) {
  const controls = document.getElementById(TS_SIDEBAR_CONTROLS_ID);
  if (!controls) return;

  // Pokedex: move tabs + controls into sidebar.
  if (page === 'hitlist') {
    const tabs = document.querySelector('.shinydex-root .shiny-dex-tabs');
    const controlsBlock = document.querySelector('.shinydex-root .shiny-dex-controls');
    const toolbar = document.querySelector('.shinydex-root .shinydex-toolbar');

    if (tabs) appendIntoSidebar('Dex Mode', tabs);
    if (controlsBlock) appendIntoSidebar('Filters', controlsBlock);

    if (toolbar) toolbar.dataset.relocated = '1';
    return;
  }

  // Showcase: gallery controls OR member controls.
  if (page === 'showcase') {
    const backBtn = document.getElementById('showcase-back');
    if (backBtn) appendIntoSidebar('Navigation', backBtn);

    const memberControls = document.getElementById('member-shiny-controls');
    if (memberControls) {
      appendIntoSidebar('Member Filters', memberControls);
      const memberTopbar = document.querySelector('.showcase-member-topbar');
      if (memberTopbar) memberTopbar.dataset.relocated = '1';
      return;
    }

    const galleryControls = document.querySelector('.showcase-root .showcase-search-controls');
    if (galleryControls) appendIntoSidebar('Browse', galleryControls);

    return;
  }

  // Donators: show totals (text-only) when available.
  if (page === 'donators') {
    const statsWrap = document.createElement('div');
    statsWrap.style.display = 'flex';
    statsWrap.style.flexDirection = 'column';
    statsWrap.style.gap = '8px';

    let donators = '';
    let total = '';

    document
      .querySelectorAll('.donators-panel--summary .donators-summary-stat')
      .forEach(stat => {
        const label = stat.querySelector('.donators-summary-label')?.textContent?.trim() || '';
        const value = stat.querySelector('.donators-summary-value')?.textContent?.trim() || '';

        if (label.toLowerCase() === 'donators') donators = value;
        if (label.toLowerCase().includes('total')) total = value;
      });

    if (donators) {
      const row = document.createElement('div');
      row.className = 'ts-subbar-stats';
      row.textContent = `Donators: ${donators}`;
      statsWrap.appendChild(row);
    }

    if (total) {
      const row = document.createElement('div');
      row.className = 'ts-subbar-stats';
      row.textContent = `Total: ${total}`;
      statsWrap.appendChild(row);
    }

    if (statsWrap.childElementCount) appendIntoSidebar('Totals', statsWrap);
    return;
  }

  // Weekly: keep sidebar minimal for now.
  if (page === 'shinyweekly') {
    const msg = document.createElement('div');
    msg.className = 'ts-subbar-stats';
    msg.textContent = 'Select a member inside a week.';
    appendIntoSidebar('Info', msg);
  }
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

/* ---------------------------------------------------------
   BOOTSTRAP
--------------------------------------------------------- */

ensureGlobalCssModules();
ensureAppShell();
ensureHeaderShell();
ensureCollectionToggle();
updateHeaderHeightVar();

window.addEventListener('resize', updateHeaderHeightVar);

/* ---------------------------------------------------------
   DATA CACHES
--------------------------------------------------------- */

let shinyShowcaseRows = null;
let membersRows = null;
let donatorsRows = null;
let shinyWeeklyModel = null;

/* ---------------------------------------------------------
   ROUTING
--------------------------------------------------------- */

function getRoute() {
  const raw = String(location.hash || '').trim();
  if (!raw || raw === '#') return { page: 'hitlist' };

  const lower = raw.toLowerCase();

  if (lower.startsWith('#hitlist') || lower.startsWith('#pokedex')) {
    return { page: 'hitlist' };
  }

  if (lower.startsWith('#showcase')) return { page: 'showcase' };
  if (lower.startsWith('#donators')) return { page: 'donators' };
  if (lower.startsWith('#shinyweekly')) return { page: 'shinyweekly' };

  return { page: 'hitlist' };
}

/* ---------------------------------------------------------
   PAGE RENDER
--------------------------------------------------------- */

async function ensurePokemonData() {
  await initPokemonDerivedDataOnce();
}

async function ensureShowcaseRows() {
  if (!shinyShowcaseRows) {
    shinyShowcaseRows = await loadShinyShowcase();
  }
}

async function ensureMembersRows() {
  if (!membersRows) {
    membersRows = await loadMembers();
  }
}

async function ensureDonatorsRows() {
  if (!donatorsRows) {
    donatorsRows = await loadDonators();
  }
}

async function ensureWeeklyModel() {
  if (!shinyWeeklyModel) {
    shinyWeeklyModel = await loadShinyWeekly();
  }
}

async function renderPage() {
  ensureGlobalCssModules();
  ensureAppShell();
  ensureHeaderShell();
  ensureCollectionToggle();
  updateHeaderHeightVar();

  const route = getRoute();

  setActiveNav(route.page);
  setSidebarBase(route.page);

  const content = document.getElementById('page-content');
  if (content) content.replaceChildren();

  if (route.page === 'donators') {
    await ensureDonatorsRows();
    setupDonatorsPage({ donatorsRows });
    attachSidebarControls(route.page);
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

    attachSidebarControls(route.page);
    return;
  }

  if (route.page === 'shinyweekly') {
    await ensureWeeklyModel();
    await ensureMembersRows();

    setupShinyWeeklyPage({
      weeklyModel: shinyWeeklyModel,
      membersRows
    });

    attachSidebarControls(route.page);
    return;
  }

  // ShinyDex (Hitlist / LivingDex)
  await renderPokedexPage();
  attachSidebarControls(route.page);
}

/* ---------------------------------------------------------
   EVENTS
--------------------------------------------------------- */

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);
