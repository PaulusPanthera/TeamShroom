// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — RENDERER ONLY
// No state. No aggregation. No sorting. No counting.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getPokemonGif(key) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

/*
INPUT SHAPE (FROM CONTROLLER):

{
  sections: Array<{
    key: string
    title: string
    entries: Array<{
      pokemon: string
      count: number
      highlighted: boolean
    }>
  }>,
  countLabelText: string
}
*/

export function renderShinyLivingDex({
  sections,
  countLabelText
}) {
  const container = document.getElementById('shiny-dex-container');
  const countLabel = document.getElementById('dex-count');

  container.innerHTML = '';
  countLabel.textContent = countLabelText;

  sections.forEach(sectionData => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const header = document.createElement('h2');
    header.textContent = sectionData.title;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    sectionData.entries.forEach(entry => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info:
            entry.count === 0
              ? 'Unowned'
              : entry.count === 1
                ? '1 Shiny'
                : `${entry.count} Shinies`,
          unclaimed: entry.count === 0,
          highlighted: !!entry.highlighted,
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
