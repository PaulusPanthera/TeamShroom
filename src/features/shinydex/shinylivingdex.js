// v2.0.0-alpha.2
// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — RENDERER (DOM-only)
// UnifiedCard v3: points always shown; tier is frame-only via tier-map in unifiedcard.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { POKEMON_POINTS } from '../../data/pokemondatabuilder.js';

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

function variantsForLiving(infoText) {
  // Living Dex uses the same card component but keeps variants visually present.
  // Non-standard variants are disabled until Living-specific meaning is defined.
  return [
    { key: 'standard', title: 'Standard', enabled: true, infoText: infoText, active: true },
    { key: 'secret', title: 'Secret', enabled: false, infoText: '—', active: false },
    { key: 'alpha', title: 'Alpha', enabled: false, infoText: '—', active: false },
    { key: 'safari', title: 'Safari', enabled: false, infoText: '—', active: false }
  ];
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
      const key = entry.pokemon;
      const count = Number(entry.count) || 0;

      const infoText =
        count === 0 ? 'Unowned' :
        count === 1 ? '1 Shiny' :
        `${count} Shinies`;

      const points = Number(entry.points ?? POKEMON_POINTS?.[key] ?? 0);

      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          pokemonName: prettifyPokemonName(key),
          artSrc: getPokemonGif(key),
          points: points,
          infoText: infoText,
          isUnclaimed: count === 0,
          owners: Array.isArray(entry.owners) ? entry.owners : [],
          variants: variantsForLiving(infoText)
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
