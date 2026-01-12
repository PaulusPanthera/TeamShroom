// src/features/shinydex/shinydex.hitlist.js
// Shiny Dex — HITLIST RENDERER
// Render-only. Stateless. Controller owns UI & state.

import { buildShinyDexModel } from '../../domains/shinydex/hitlist.model.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { POKEMON_SHOW } from '../../data/pokemondatabuilder.js';

function getPokemonGif(key) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

export function renderShinyDexHitlist({
  weeklyModel,
  search,
  unclaimedOnly,
  sort,
  countLabel
}) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  // --------------------------------------------------
  // DATA
  // --------------------------------------------------

  let dex = buildShinyDexModel(weeklyModel).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  if (search) {
    dex = dex.filter(e =>
      prettifyPokemonName(e.pokemon).toLowerCase().includes(search)
    );
  }

  if (unclaimedOnly) {
    dex = dex.filter(e => !e.claimed);
  }

  // --------------------------------------------------
  // SCOREBOARD MODES
  // --------------------------------------------------

  if (sort === 'claims' || sort === 'points') {
    const byMember = {};

    dex.forEach(e => {
      if (!e.claimed) return;
      byMember[e.claimedBy] ??= [];
      byMember[e.claimedBy].push(e);
    });

    const members = Object.entries(byMember)
      .map(([name, entries]) => ({
        name,
        entries,
        claims: entries.length,
        points: entries.reduce((s, e) => s + e.points, 0)
      }))
      .sort((a, b) =>
        sort === 'claims'
          ? b.claims - a.claims
          : b.points - a.points
      );

    countLabel.textContent = `${members.length} Members`;

    members.forEach((m, index) => {
      const section = document.createElement('section');
      section.className = 'scoreboard-member-section';

      const header = document.createElement('h2');
      header.textContent =
        `${index + 1}. ${m.name} — ` +
        `${m.claims} Claims · ${m.points} Points`;

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      m.entries.forEach(entry => {
        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            name: prettifyPokemonName(entry.pokemon),
            img: getPokemonGif(entry.pokemon),
            info: `${entry.points} pts`,
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

  // --------------------------------------------------
  // STANDARD MODE (REGION / DEX)
  // --------------------------------------------------

  const totalSpecies = dex.length;
  const claimedSpecies = dex.filter(e => e.claimed).length;

  countLabel.textContent =
    `${claimedSpecies} / ${totalSpecies} Species`;

  const byRegion = {};
  dex.forEach(e => {
    byRegion[e.region] ??= [];
    byRegion[e.region].push(e);
  });

  Object.entries(byRegion).forEach(([region, entries]) => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const claimed = entries.filter(e => e.claimed).length;

    const header = document.createElement('h2');
    header.textContent =
      `${region.toUpperCase()} (${claimed} / ${entries.length})`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    entries.forEach(entry => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: entry.claimed ? entry.claimedBy : 'Unclaimed',
          unclaimed: !entry.claimed,
          highlighted: entry.claimed && entry.points >= 15,
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
