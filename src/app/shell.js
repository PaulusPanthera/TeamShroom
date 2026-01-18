// src/app/shell.js
// v2.0.0-beta
// App shell + header + global COLLECT button (shell-owned)

/* ---------------------------------------------------------
   GLOBAL HEADER + LEFT SIDEBAR SHELL
--------------------------------------------------------- */

const TS_HEADER_ID = 'ts-header';
const TS_SHELL_ID = 'ts-shell';
const TS_SIDEBAR_ID = 'ts-sidebar';
const TS_SIDEBAR_TITLE_ID = 'ts-sidebar-title';
const TS_SIDEBAR_CONTROLS_ID = 'ts-sidebar-controls';

const TS_COLLECTION_TOGGLE_ID = 'ts-collection-toggle';
const TS_SHELL_ACTIONS_ID = 'ts-shell-actions';
const TS_MAIN_ID = 'ts-main';

const TS_COLLECTION_MODE_CLASS = 'ts-collection-mode';
const TS_COLLECTION_STORAGE_KEY = 'ts:collection-mode:v2';

const TS_LOGO_AUDIO_ID = 'ts-logo-audio';

// NOTE: Header plaque is intentionally sprite + guild only.
// Per-route page title/description is NOT rendered in the header plaque.

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
      // Ignore autoplay errors. Playback is user-gesture triggered.
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
   HEADER PLAQUE META (TITLE + 1-LINE DESCRIPTION)
--------------------------------------------------------- */

export function setHeaderPlaque() {
  // No-op.
}

export function resetHeaderPlaque() {
  // No-op.
}

/* ---------------------------------------------------------
   COLLECTION MODE
--------------------------------------------------------- */

let tsCollectionShortcutsInstalled = false;

// Shell-owned COLLECT button configuration.
// Features may update this through the exported API below, but must never create their own button.
let tsCollectButtonConfig = {
  visible: true,
  mode: 'toggle-collection', // 'toggle-collection' | 'custom'
  label: 'COLLECT',
  ariaLabel: 'Hide UI',
  onClick: null
};

function applyCollectButtonConfig() {
  const btn = document.getElementById(TS_COLLECTION_TOGGLE_ID);
  if (!btn) return;

  const cfg = tsCollectButtonConfig || {};

  btn.hidden = cfg.visible === false;

  if (cfg.mode === 'toggle-collection') {
    const enabled = document.body.classList.contains(TS_COLLECTION_MODE_CLASS);
    btn.textContent = enabled ? 'MENU' : 'COLLECT';
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.setAttribute('aria-label', enabled ? 'Show UI' : 'Hide UI');
  } else {
    btn.textContent = String(cfg.label || 'COLLECT');
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', String(cfg.ariaLabel || 'Collect'));
  }
}

function setCollectionMode(enabled, opts = {}) {
  const { persist = true } = opts;

  const body = document.body;
  if (!body) return;

  body.classList.toggle(TS_COLLECTION_MODE_CLASS, !!enabled);

  applyCollectButtonConfig();

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

function handleCollectButtonClick() {
  const cfg = tsCollectButtonConfig || {};

  if (cfg.mode !== 'toggle-collection' && typeof cfg.onClick === 'function') {
    cfg.onClick();
    return;
  }

  const enabled = !document.body.classList.contains(TS_COLLECTION_MODE_CLASS);
  setCollectionMode(enabled, { persist: true });
}

function ensureCollectButton() {
  // Kill any duplicates (even if someone injected invalid markup).
  const all = Array.from(document.querySelectorAll(`[id="${TS_COLLECTION_TOGGLE_ID}"]`));
  let shellBtn = all.find((el) => el?.dataset?.tsShellOwned === '1') || null;

  // Remove non-shell-owned duplicates.
  for (const el of all) {
    if (el === shellBtn) continue;
    try {
      el.remove();
    } catch {
      // ignore
    }
  }

  // If the button exists but isn't shell-owned, rebuild deterministically.
  if (shellBtn && shellBtn.dataset?.tsShellOwned !== '1') {
    try {
      shellBtn.remove();
    } catch {
      // ignore
    }
    shellBtn = null;
  }

  if (!shellBtn) {
    shellBtn = document.createElement('button');
    shellBtn.id = TS_COLLECTION_TOGGLE_ID;
    shellBtn.type = 'button';
    shellBtn.textContent = 'COLLECT';
    shellBtn.dataset.tsShellOwned = '1';

    shellBtn.addEventListener('click', handleCollectButtonClick);
    document.body.appendChild(shellBtn);
  } else {
    // Ensure it is body-mounted (free hovering button).
    if (shellBtn.parentNode !== document.body) {
      document.body.appendChild(shellBtn);
    }
  }

  applyCollectButtonConfig();

  if (!tsCollectionShortcutsInstalled) {
    tsCollectionShortcutsInstalled = true;

    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!document.body.classList.contains(TS_COLLECTION_MODE_CLASS)) return;
      setCollectionMode(false, { persist: true });
    });
  }

  // Apply persisted collection state.
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
  // Recover gracefully if a feature accidentally removed the page root.
  // This must run even if the shell already exists.
  let content = document.getElementById('page-content');

  if (!content) {
    const body = document.body;
    if (!body) return;

    content = document.createElement('main');
    content.id = 'page-content';

    // If the shell is already mounted, reattach the content inside it.
    const shellMain = document.getElementById(TS_MAIN_ID);
    (shellMain || body).appendChild(content);
  }

  if (document.getElementById(TS_SHELL_ID)) return;

  // Mark shell-active early for layout (browser-safe, no :has()).
  if (document.body) {
    document.body.classList.add('ts-shell-active');
  }

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

  // Main column wrapper.
  const main = document.createElement('main');
  main.id = TS_MAIN_ID;
  main.setAttribute('role', 'main');

  // Keep this slot for future shell actions. Hide it when empty via CSS.
  const actions = document.createElement('div');
  actions.id = TS_SHELL_ACTIONS_ID;
  actions.className = 'ts-shell-actions';

  main.appendChild(actions);
  main.appendChild(content);

  shell.appendChild(sidebar);
  shell.appendChild(main);
}

/* ---------------------------------------------------------
   TOP HEADER (PLAQUE + NAV)
--------------------------------------------------------- */

function ensureHeaderShell() {
  if (document.getElementById(TS_HEADER_ID)) return;

  const nav = document.querySelector('nav.nav');
  if (!nav) return;

  // Ensure required nav order + labels.
  let aHome = nav.querySelector('#nav-home');
  if (!aHome) {
    aHome = document.createElement('a');
    aHome.href = '#home';
    aHome.id = 'nav-home';
    aHome.textContent = 'Home';
    nav.insertBefore(aHome, nav.firstChild);
  }

  const aShowcase = nav.querySelector('#nav-showcase');
  const aPokedex = nav.querySelector('#nav-hitlist');
  const aWeekly = nav.querySelector('#nav-shinyweekly');
  const aDonators = nav.querySelector('#nav-donators');

  if (aShowcase) aShowcase.textContent = 'Members';
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

  // One single left plaque: logo + guild name.
  const plaque = document.createElement('div');
  plaque.className = 'ts-header-plaque';

  const icon = document.createElement('img');
  icon.className = 'ts-header-plaque-icon';
  icon.src = 'img/symbols/shinyshroomsprite.png';
  icon.alt = '';

  const text = document.createElement('div');
  text.className = 'ts-header-plaque-text';

  const guild = document.createElement('div');
  guild.className = 'ts-header-guild';
  guild.textContent = '[MÜSH] TEAM SHROOM';

  text.appendChild(guild);

  plaque.appendChild(icon);
  plaque.appendChild(text);

  // Click sound on plaque.
  plaque.setAttribute('role', 'button');
  plaque.setAttribute('tabindex', '0');
  plaque.setAttribute('aria-label', 'Play logo sound');

  plaque.addEventListener('click', (e) => {
    e.preventDefault();
    playLogoSound();
  });

  plaque.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      playLogoSound();
    }
  });

  banner.appendChild(plaque);
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
   PUBLIC EXPORTS
--------------------------------------------------------- */

let tsShellResizeInstalled = false;

export function ensureShell() {
  ensureAppShell();
  ensureCollectButton();

  if (!tsShellResizeInstalled) {
    tsShellResizeInstalled = true;
    window.addEventListener('resize', updateHeaderHeightVar);
  }
}

export function ensureHeader() {
  ensureHeaderShell();
}

export function setHeaderMeta() {
  // No-op: header plaque is sprite + guild name only.
}

export function resetHeaderMeta() {
  // No-op.
}

/**
 * Shell API: allow features to configure the shell-owned COLLECT button.
 * Features MUST NOT create their own button.
 */
export function configureCollectButton(config = {}) {
  tsCollectButtonConfig = {
    ...tsCollectButtonConfig,
    ...config
  };

  applyCollectButtonConfig();
}

export function resetCollectButton() {
  tsCollectButtonConfig = {
    visible: true,
    mode: 'toggle-collection',
    label: 'COLLECT',
    ariaLabel: 'Hide UI',
    onClick: null
  };

  applyCollectButtonConfig();
}

/**
 * Backwards-compatible alias.
 */
export function ensureCollectionToggle() {
  ensureCollectButton();
}

export { updateHeaderHeightVar, setCollectionMode };
