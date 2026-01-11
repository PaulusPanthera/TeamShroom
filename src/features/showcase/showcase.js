// showcase.js
// Team Shroom — Showcase & Member Views
// Rendering only. No aggregation. No ranking.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { getMemberSprite } from '../../utils/membersprite.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

export function renderShowcaseGallery(
  members,
  container,
  mode
) {
  container.innerHTML = '';

  const sorted =
    mode === 'scoreboard'
      ? [...members].sort((a, b) => b.points - a.points)
      : mode === 'shinies'
      ? [...members].sort((a, b) => b.shinyCount - a.shinyCount)
      : [...members].sort((a, b) => a.name.localeCompare(b.name));

  const grid = document.createElement('div');
  grid.className = 'showcase-gallery';

  sorted.forEach(member => {
    grid.insertAdjacentHTML(
      'beforeend',
      renderUnifiedCard({
        name: member.name,
        img: getMemberSprite(member.name, members),
        info:
          mode === 'scoreboard'
            ? `Points: ${member.points}`
            : `Shinies: ${member.shinyCount}`,
        cardType: 'member'
      })
    );
  });

  container.appendChild(grid);
  bindShowcaseInteractions(container);
}

export function renderMemberShowcase(member) {
  const content = document.getElementById('page-content');
  const shinies = member.shinies;

  content.innerHTML = `
    <button class="back-btn">Back</button>

    <div class="member-nameplate">
      <img class="member-sprite" src="${getMemberSprite(member.name)}">
      <span class="member-name">${member.name}</span>
      <span class="shiny-count">Shinies: ${member.shinyCount}</span>
      <span class="point-count">Points: ${member.points}</span>
    </div>

    <div class="dex-grid">
      ${shinies.map(mon =>
        renderUnifiedCard({
          name: prettifyPokemonName(mon.pokemon),
          img: getPokemonGif(mon.pokemon),
          info: mon.lost ? 'Lost' : mon.sold ? 'Sold' : '',
          cardType: 'pokemon',
          lost: mon.lost || mon.sold,
          symbols: {
            secret: mon.secret,
            alpha: mon.alpha,
            run: mon.run,
            favorite: mon.favorite
          },
          clip: mon.clip || null
        })
      ).join('')}
    </div>
  `;

  bindMemberInteractions(content);
}

function bindShowcaseInteractions(root) {
  root
    .querySelectorAll('.unified-card[data-card-type="member"]')
    .forEach(card => {
      card.addEventListener('click', () => {
        location.hash = `#showcase-${encodeURIComponent(card.dataset.name)}`;
      });
    });
}

function bindMemberInteractions(root) {
  root.querySelector('.back-btn')?.addEventListener('click', () => {
    location.hash = '#showcase';
  });
}
