// src/features/shinydex/shinydex.scoreboard.js
// Grouped views: Total Claims / Total Claim Points

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getGif(key) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

export function renderHitlistScoreboard(
  list,
  mode,
  container,
  totalCounter
) {
  const byMember = {};

  list.forEach(e => {
    if (!e.claimed) return;
    byMember[e.claimedBy] ??= [];
    byMember[e.claimedBy].push(e);
  });

  const members = Object.keys(byMember)
    .map(name => {
      const entries = byMember[name];
      return {
        name,
        entries,
        claims: entries.length,
        points: entries.reduce((s, e) => s + e.points, 0)
      };
    })
    .sort((a, b) =>
      mode === 'claims'
        ? b.claims - a.claims
        : b.points - a.points
    );

  totalCounter.textContent = `${members.length} Members`;

  members.forEach((m, i) => {
    const section = document.createElement('section');
    section.className = 'scoreboard-member-section';

    section.innerHTML =
      mode === 'claims'
        ? `<h2>${i + 1}. ${m.name} — ${m.claims} claims</h2>`
        : `<h2>${i + 1}. ${m.name} — ${m.points} points</h2>`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    m.entries.forEach(e => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(e.pokemon),
          img: getGif(e.pokemon),
          info: `${e.points} pts`,
          highlighted: true,
          cardType: 'pokemon'
        })
      );
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}
