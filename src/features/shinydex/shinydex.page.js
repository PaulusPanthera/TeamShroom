// src/features/shinydex/shinydex.page.js
// Shiny Pokédex — PAGE WIRING
// Hitlist <-> Living Dex switch

import { renderShinyDexHitlist } from './shinydex.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

/**
 * Initialize Shiny Pokédex page
 *
 * @param {Array} shinyWeeklyModel
 * @param {Array} shinyShowcaseRows
 */
export function setupShinyPokedexPage(
  shinyWeeklyModel,
  shinyShowcaseRows
) {
  const hitlistTab = document.getElementById('tab-hitlist');
  const livingDexTab = document.getElementById('tab-livingdex');

  if (!hitlistTab || !livingDexTab) {
    throw new Error('[ShinyDex] Tabs not found');
  }

  function activate(tab) {
    hitlistTab.classList.remove('active');
    livingDexTab.classList.remove('active');
    tab.classList.add('active');
  }

  function showHitlist() {
    activate(hitlistTab);
    renderShinyDexHitlist(shinyWeeklyModel);
  }

  function showLivingDex() {
    activate(livingDexTab);
    renderShinyLivingDex(shinyShowcaseRows);
  }

  hitlistTab.addEventListener('click', e => {
    e.preventDefault();
    showHitlist();
  });

  livingDexTab.addEventListener('click', e => {
    e.preventDefault();
    showLivingDex();
  });

  // default
  showHitlist();
}
