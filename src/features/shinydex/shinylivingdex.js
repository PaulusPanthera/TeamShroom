// v2.0.0-alpha
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

function variantsForLiving(infoText, selectedKey) {
  // Living Dex uses the same card component but keeps variants visually present.
  // Non-standard variants are disabled until Living-specific meaning is defined.
  const key = selectedKey || 'standard';
  return [
    { key: 'standard', title: 'Standard', enabled: true, infoText: infoText, active: key === 'standard' },
    { key: 'secret', title: 'Secret', enabled: false, infoText: infoText, active: key === 'secret' },
    { key: 'alpha', title: 'Alpha', enabled: false, infoText: infoText, active: key === 'alpha' },
    { key: 'safari', title: 'Safari', enabled: false, infoText: infoText, active: key === 'safari' }
  ];
}

export function renderLivingDexFromModel(model, opts) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  const selectedVariantByKey = opts && opts.selectedVariantByKey;

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

      const wanted = selectedVariantByKey && typeof selectedVariantByKey.get === 'function' ? selectedVariantByKey.get(key) : null;

      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          pokemonKey: key,
          pokemonName: prettifyPokemonName(key),
          artSrc: getPokemonGif(key),
          points: points,
          infoText: infoText,
          isUnclaimed: count === 0,
          owners: Array.isArray(entry.owners) ? entry.owners : [],
          variants: variantsForLiving(infoText, wanted)
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
