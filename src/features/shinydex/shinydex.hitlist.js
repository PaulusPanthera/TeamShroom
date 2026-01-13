// v2.0.0-alpha.2
// src/features/shinydex/shinydex.hitlist.js
// Shiny Dex — HITLIST RENDERER (DOM-only)

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

function tierFromPoints(points) {
  const p = Number(points) || 0;
  if (p >= 100) return 'lm';
  if (p >= 30) return '0';
  if (p >= 25) return '1';
  if (p >= 15) return '2';
  if (p >= 10) return '3';
  if (p >= 6) return '4';
  if (p >= 3) return '5';
  if (p >= 2) return '6';
  return null;
}

export function renderHitlistFromModel(model) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  if (!model || !Array.isArray(model.sections)) return;

  if (model.mode === 'scoreboard') {
    model.sections.forEach(sec => {
      const section = document.createElement('section');
      section.className = 'scoreboard-member-section';

      const header = document.createElement('h2');
      header.textContent = sec.title || '';

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      (sec.entries || []).forEach(entry => {
        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            name: prettifyPokemonName(entry.pokemon),
            img: getPokemonGif(entry.pokemon),
            info: entry.info || `${entry.points} pts`,
            highlighted: true,
            tier: tierFromPoints(entry.points),
            cardType: 'pokemon'
          })
        );
      });

      section.append(header, grid);
      container.appendChild(section);
    });

    return;
  }

  model.sections.forEach(sec => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const header = document.createElement('h2');
    header.textContent = sec.title || '';

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    (sec.entries || []).forEach(entry => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: entry.claimed ? (entry.claimedBy || '') : 'Unclaimed',
          unclaimed: !entry.claimed,
          highlighted: !!entry.highlighted,
          tier: tierFromPoints(entry.points),
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
