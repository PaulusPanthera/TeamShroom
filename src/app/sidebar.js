// src/app/sidebar.js
// v2.0.0-beta
// Sidebar base contract (shell-owned slots) and section rendering helpers

/* ---------------------------------------------------------
   SIDEBAR SLOTS
--------------------------------------------------------- */

const TS_SIDEBAR_TITLE_ID = 'ts-sidebar-title';
const TS_SIDEBAR_HINT_ID = 'ts-sidebar-hint';
const TS_SIDEBAR_CONTROLS_ID = 'ts-sidebar-controls';

function getSidebarSlots() {
  const titleEl = document.getElementById(TS_SIDEBAR_TITLE_ID);
  const hintEl = document.getElementById(TS_SIDEBAR_HINT_ID);
  const controlsEl = document.getElementById(TS_SIDEBAR_CONTROLS_ID);
  return { titleEl, hintEl, controlsEl };
}

function defaultTitleForPage(page) {
  if (page === 'home') return 'HOME';
  if (page === 'showcase') return 'MEMBER';
  if (page === 'shinyweekly') return 'WEEKLY';
  if (page === 'donators') return 'DONATORS';
  return 'POKÉDEX';
}

function defaultHintForPage(page) {
  if (page === 'home') return 'Coming soon.';
  if (page === 'shinyweekly') return 'Open a week to view details.';
  return '';
}

/* ---------------------------------------------------------
   SECTION RENDERING
--------------------------------------------------------- */

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

function appendSectionInto(controlsEl, label, node) {
  if (!controlsEl || !node) return;

  const section = makeSidebarSection(label);
  section.appendChild(node);
  controlsEl.appendChild(section);
}

/* ---------------------------------------------------------
   SIDEBAR CONTROLLER (feature-facing)
--------------------------------------------------------- */

export function createSidebarController(page) {
  const { titleEl, hintEl, controlsEl } = getSidebarSlots();

  if (controlsEl) controlsEl.replaceChildren();
  if (titleEl) titleEl.textContent = defaultTitleForPage(page);
  if (hintEl) hintEl.textContent = defaultHintForPage(page);

  return {
    titleEl,
    hintEl,
    controlsEl,

    clear() {
      if (controlsEl) controlsEl.replaceChildren();
    },

    setTitle(text) {
      if (!titleEl) return;
      titleEl.textContent = String(text || '');
    },

    setHint(text) {
      if (!hintEl) return;
      hintEl.textContent = String(text || '');
    },

    setSections(sections) {
      if (!controlsEl) return;

      controlsEl.replaceChildren();

      const list = Array.isArray(sections) ? sections : [];
      list.forEach((s) => {
        if (!s || !s.node) return;
        appendSectionInto(controlsEl, s.label, s.node);
      });
    },

    appendSection(label, node) {
      appendSectionInto(controlsEl, label, node);
    }
  };
}
