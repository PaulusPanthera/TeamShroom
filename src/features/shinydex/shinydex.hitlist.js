// src/features/shinydex/shinydex.hitlist.js
// v2.0.0-beta
// Shiny Dex — HITLIST RENDERER (DOM-only)
// UnifiedCard v2: ShinyDex-owned adapter builds card props.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import {
  toUnifiedCardPropsForHitlist,
  toUnifiedCardPropsForHitlistClaim
} from './shinydex.card.adapter.js';
import { getSelectedVariant } from './shinydex.variants.state.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function applyFloatingSectionStyle(sectionEl) {
  if (!sectionEl) return;

  // Cards must render directly on the global background sprite.
  // Remove any panel backing that would cover the sprite.
  sectionEl.style.background = 'transparent';
  sectionEl.style.border = 'none';
  sectionEl.style.boxShadow = 'none';
}

function lockClaimCardVariant(card, claimKind) {
  if (!card) return card;

  const kind = String(claimKind || 'standard').toLowerCase();
  card.classList.add('scoreboard-claim-card', `claim-kind-${kind}`);
  card.dataset.claimKind = kind;
  card.dataset.selectedVariant = kind;

  card.querySelectorAll('.variant-btn').forEach(btn => {
    const key = String(btn.getAttribute('data-variant') || 'standard').toLowerCase();
    const active = key === kind;

    btn.classList.toggle('is-active', active);
    btn.classList.toggle('is-disabled', !active);
    btn.classList.add('is-static');
    btn.setAttribute('aria-disabled', 'true');
    btn.setAttribute('tabindex', '-1');
  });

  return card;
}

function claimKindLabel(kind) {
  switch (String(kind || '').toLowerCase()) {
    case 'secret': return 'Secret';
    case 'alpha': return 'Alpha';
    case 'safari': return 'Safari';
    case 'standard':
    default: return 'Base';
  }
}

function claimWhenText(claim) {
  if (!claim) return 'Unknown date';
  if (claim.dateCatch) return String(claim.dateCatch);
  if (claim.weekLabel) return String(claim.weekLabel);
  if (claim.dateStart) return String(claim.dateStart);
  if (claim.week) return String(claim.week);
  return 'Unknown date';
}

function claimPokemonText(claim) {
  const slot = claim && claim.pokemon ? String(claim.pokemon) : '';
  const caught = claim && claim.caughtPokemon ? String(claim.caughtPokemon) : slot;

  if (String(claim?.kind || '') === 'standard' && caught && slot && caught !== slot) {
    return `${prettifyPokemonName(caught)} → ${prettifyPokemonName(slot)}`;
  }

  return prettifyPokemonName(slot || caught || 'unknown');
}

function renderClaimLog(sectionModel) {
  const claims = Array.isArray(sectionModel && sectionModel.claimLog) ? sectionModel.claimLog : [];
  if (!claims.length) return null;

  const details = document.createElement('details');
  details.className = 'scoreboard-claim-log';

  const summary = document.createElement('summary');
  const totalClaimValue = Number(sectionModel && sectionModel.totalClaimValue) || 0;
  summary.textContent = `Claim log · ${claims.length} award${claims.length === 1 ? '' : 's'} · ${totalClaimValue} Total Claims`;
  details.appendChild(summary);

  const list = document.createElement('ol');
  list.className = 'scoreboard-claim-log-list';

  claims.forEach(claim => {
    const row = document.createElement('li');
    row.className = `scoreboard-claim-log-row claim-kind-${String(claim.kind || 'standard').toLowerCase()}`;

    const when = document.createElement('span');
    when.className = 'scoreboard-claim-log-when';
    when.textContent = claimWhenText(claim);

    const pokemon = document.createElement('span');
    pokemon.className = 'scoreboard-claim-log-pokemon';
    pokemon.textContent = claimPokemonText(claim);

    const award = document.createElement('span');
    award.className = 'scoreboard-claim-log-award';
    const pts = Number(claim.points) || 0;
    const prefix = String(claim.kind || 'standard') === 'standard' ? '' : '+';
    const claimValue = Number(claim.claimValue) || 0;
    const claimWord = claimValue === 1 ? 'claim' : 'claims';
    award.textContent = `${claimKindLabel(claim.kind)} ${prefix}${pts}P · +${claimValue} ${claimWord}`;

    row.append(when, pokemon, award);
    list.appendChild(row);
  });

  details.appendChild(list);
  return details;
}

export function renderHitlistFromModel(model, opts) {
  const container = document.getElementById('shiny-dex-container');
  if (!container) return;
  container.replaceChildren();

  const selectedVariantByKey = opts && opts.selectedVariantByKey;

  if (!model || !Array.isArray(model.sections)) return;

  if (model.mode === 'scoreboard') {
    model.sections.forEach(sec => {
      const section = document.createElement('section');
      section.className = 'scoreboard-member-section';
      applyFloatingSectionStyle(section);

      const header = document.createElement('h2');
      header.textContent = sec.title || '';

      const log = renderClaimLog(sec);

      const grid = document.createElement('div');
      grid.className = 'dex-grid scoreboard-claim-grid';

      const frag = document.createDocumentFragment();

      (sec.entries || []).forEach(entry => {
        // Scoreboard/player mode intentionally renders one immutable card per
        // awarded claim. It must never inherit global species variant owners.
        const props = toUnifiedCardPropsForHitlistClaim(entry);
        const card = renderUnifiedCard(props);
        frag.appendChild(lockClaimCardVariant(card, entry.claimKind));
      });

      grid.appendChild(frag);
      section.appendChild(header);
      if (log) section.appendChild(log);
      section.appendChild(grid);
      container.appendChild(section);
    });

    return;
  }

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
      const props = toUnifiedCardPropsForHitlist(entry, wanted, { mode: 'regions' });

      frag.appendChild(renderUnifiedCard(props));
    });

    grid.appendChild(frag);
    section.append(header, grid);
    container.appendChild(section);
  });
}
