// src/features/shinydex/shinylivingdex.js
// v2.0.0-beta
// Shiny Living Dex — RENDERER (DOM-only)
// UnifiedCard v2: ShinyDex-owned adapter builds card props.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { toUnifiedCardPropsForLivingDex } from './shinydex.card.adapter.js';
import { getSelectedVariant } from './shinydex.variants.state.js';

function applyFloatingSectionStyle(sectionEl) {
  if (!sectionEl) return;

  // Cards must render directly on the global background sprite.
  // Remove any panel backing that would cover the sprite.
  sectionEl.style.background = 'transparent';
  sectionEl.style.border = 'none';
  sectionEl.style.boxShadow = 'none';
}

export function renderLivingDexFromModel(model, opts) {
  const container = document.getElementById('shiny-dex-container');
  if (!container) return;
  container.replaceChildren();

  const selectedVariantByKey = opts && opts.selectedVariantByKey;

  if (!model || !Array.isArray(model.sections)) return;

  model.sections.forEach(sec => {
    const section = document.createElement('section');
    section.className = 'region-section';
    applyFloatingSectionStyle(section);

    const header = document.createElement('h2');
    header.textContent = sec.title || '';

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    const frag = document.createDocumentFragment();

    (sec.entries || []).forEach(entry => {
      const key = entry && entry.pokemon ? String(entry.pokemon) : '';
      const wanted = getSelectedVariant(selectedVariantByKey, key);
      const props = toUnifiedCardPropsForLivingDex(entry, wanted);

      frag.appendChild(renderUnifiedCard(props));
    });

    grid.appendChild(frag);
    section.append(header, grid);
    container.appendChild(section);
  });
}
