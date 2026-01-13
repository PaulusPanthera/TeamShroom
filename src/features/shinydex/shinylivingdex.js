// v2.0.0-alpha.1
// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — UI only

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getPokemonGif(key) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

export function renderLivingDexFromPresenterModel(model, countLabel) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  if (!model) return;

  countLabel.textContent = model.countLabelText || '';

  model.sections.forEach(sectionModel => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const header = document.createElement('h2');
    header.textContent = sectionModel.title || '';

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    sectionModel.entries.forEach(entry => {
      const c = Number(entry.count) || 0;

      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: c === 0 ? '0 Shinies' : (c === 1 ? '1 Shiny' : `${c} Shinies`),
          unclaimed: c === 0,
          highlighted: c > 0,
          owners: Array.isArray(entry.owners) ? entry.owners : [],
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
