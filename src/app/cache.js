// src/app/cache.js
// v2.0.0-beta
// Load-on-demand data caches with in-flight promise reuse

import { loadShinyShowcase } from '../data/shinyshowcase.loader.js';
import { loadMembers } from '../data/members.loader.js';
import { loadShinyWeekly } from '../data/shinyweekly.loader.js';
import { loadDonators } from '../data/donators.loader.js';

/* ---------------------------------------------------------
   DATA CACHES
--------------------------------------------------------- */

let shinyShowcaseRows = null;
let membersRows = null;
let donatorsRows = null;
let shinyWeeklyModel = null;

let shinyShowcaseRowsPromise = null;
let membersRowsPromise = null;
let donatorsRowsPromise = null;
let shinyWeeklyModelPromise = null;

/* ---------------------------------------------------------
   ENSURE (PROMISE CACHED)
--------------------------------------------------------- */

async function ensureShowcaseRows() {
  if (shinyShowcaseRows) return;
  if (shinyShowcaseRowsPromise) {
    await shinyShowcaseRowsPromise;
    return;
  }

  shinyShowcaseRowsPromise = (async () => {
    shinyShowcaseRows = await loadShinyShowcase();
    return shinyShowcaseRows;
  })();

  await shinyShowcaseRowsPromise;
}

async function ensureMembersRows() {
  if (membersRows) return;
  if (membersRowsPromise) {
    await membersRowsPromise;
    return;
  }

  membersRowsPromise = (async () => {
    membersRows = await loadMembers();
    return membersRows;
  })();

  await membersRowsPromise;
}

async function ensureDonatorsRows() {
  if (donatorsRows) return;
  if (donatorsRowsPromise) {
    await donatorsRowsPromise;
    return;
  }

  donatorsRowsPromise = (async () => {
    donatorsRows = await loadDonators();
    return donatorsRows;
  })();

  await donatorsRowsPromise;
}

async function ensureWeeklyModel() {
  if (shinyWeeklyModel) return;
  if (shinyWeeklyModelPromise) {
    await shinyWeeklyModelPromise;
    return;
  }

  shinyWeeklyModelPromise = (async () => {
    shinyWeeklyModel = await loadShinyWeekly();
    return shinyWeeklyModel;
  })();

  await shinyWeeklyModelPromise;
}

/* ---------------------------------------------------------
   ACCESSORS (LOAD-ON-DEMAND)
--------------------------------------------------------- */

export async function getShowcaseRows() {
  await ensureShowcaseRows();
  return shinyShowcaseRows;
}

export async function getMembersRows() {
  await ensureMembersRows();
  return membersRows;
}

export async function getDonatorsRows() {
  await ensureDonatorsRows();
  return donatorsRows;
}

export async function getWeeklyModel() {
  await ensureWeeklyModel();
  return shinyWeeklyModel;
}
