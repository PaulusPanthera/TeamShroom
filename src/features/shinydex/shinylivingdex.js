// v2.0.0-alpha.1
// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — RENDERER (DOM-only)

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getPokemonGif(pokemonKey) {
  const overrides = {
    mrmime: 'mr-mime',
    mimejr: 'mime-jr',
    'nidoran-f': 'nidoran-f',
    'nidoran-m': 'nidoran-m',
    typenull: 'type-null',
    'porygon-z': 'porygon-z'
  };

  const key = overrides[pokemonKey] || pokemonKey;
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

export function renderLivingDexFromModel(model) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  if (!model || !Array.isArray(model.sections)) return;

  model.sections.forEach(sec => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const header = document.createElement('h2');
    header.textContent = sec.title || '';

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    (sec.entries || []).forEach(entry => {
      const count = Number(entry.count) || 0;

      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info:
            count === 0
              ? 'Unowned'
              : count === 1
                ? '1 Shiny'
                : `${count} Shinies`,
          unclaimed: count === 0,
          highlighted: count > 0,
          owners: Array.isArray(entry.owners) ? entry.owners : [],
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
