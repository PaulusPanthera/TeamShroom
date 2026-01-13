// v2.0.0-alpha.1
// src/features/shinydex/shinydex.hitlist.js
// Shiny Dex — HITLIST RENDERER (DOM only)

import { prepareHitlistRenderModel } from './shinydex.hitlist.presenter.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getPokemonGif(key) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

export function renderShinyDexHitlist({
  weeklyModel,
  viewState,
  searchCtx,
  countLabel
}) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  const model = prepareHitlistRenderModel({
    weeklyModel,
    viewState,
    searchCtx
  });

  countLabel.textContent = model.countLabelText || '';

  if (model.mode === 'scoreboard') {
    model.sections.forEach(sectionModel => {
      const section = document.createElement('section');
      section.className = 'scoreboard-member-section';

      const header = document.createElement('h2');
      header.textContent = sectionModel.title;

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      sectionModel.entries.forEach(entry => {
        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            name: prettifyPokemonName(entry.pokemon),
            img: getPokemonGif(entry.pokemon),
            info: entry.info || `${entry.points} pts`,
            highlighted: true,
            cardType: 'pokemon'
          })
        );
      });

      section.append(header, grid);
      container.appendChild(section);
    });

    return;
  }

  model.sections.forEach(sectionModel => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const header = document.createElement('h2');
    header.textContent = sectionModel.title;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    sectionModel.entries.forEach(entry => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: entry.claimed ? entry.claimedBy : 'Unclaimed',
          unclaimed: !entry.claimed,
          highlighted: !!entry.highlighted,
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
