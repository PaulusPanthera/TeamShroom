// v2.0.0-alpha.1
// src/features/shinydex/shinydex.hitlist.js
// Shiny Dex — HITLIST RENDERER (UI only)

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getPokemonGif(key) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

export function renderHitlistFromPresenterModel(model, countLabel) {
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
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: entry.info != null
            ? entry.info
            : (entry.claimed ? entry.claimedBy : 'Unclaimed'),
          unclaimed: !entry.claimed,
          lost: !!entry.lost,
          highlighted: !!entry.highlighted,
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
