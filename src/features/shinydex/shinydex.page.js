// src/features/shinydex/shinydex.page.js
// Shiny Pokédex — PAGE CONTROLLER

import { renderShinyDexHitlist } from './shinydex.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

export function setupShinyPokedexPage(
  shinyWeeklyModel,
  shinyShowcaseRows
) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  const toggle = document.createElement('div');
  toggle.className = 'dex-view-toggle';

  const hitlistBtn = document.createElement('button');
  hitlistBtn.className = 'dex-tab active';
  hitlistBtn.textContent = 'Hitlist';

  const livingDexBtn = document.createElement('button');
  livingDexBtn.className = 'dex-tab';
  livingDexBtn.textContent = 'Living Dex';

  toggle.append(hitlistBtn, livingDexBtn);
  container.appendChild(toggle);

  const viewRoot = document.createElement('div');
  container.appendChild(viewRoot);

  function activate(btn) {
    hitlistBtn.classList.remove('active');
    livingDexBtn.classList.remove('active');
    btn.classList.add('active');
  }

  function showHitlist() {
    activate(hitlistBtn);
    viewRoot.innerHTML = '';
    renderShinyDexHitlist(shinyWeeklyModel);
  }

  function showLivingDex() {
    activate(livingDexBtn);
    viewRoot.innerHTML = '';
    renderShinyLivingDex(shinyShowcaseRows);
  }

  hitlistBtn.addEventListener('click', showHitlist);
  livingDexBtn.addEventListener('click', showLivingDex);

  showHitlist();
}
