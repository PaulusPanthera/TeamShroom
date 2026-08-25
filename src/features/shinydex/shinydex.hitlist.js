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
import { prettifyPokemonName, getPokemonDbShinyGifSrc } from '../../utils/utils.js';

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

function claimWhenParts(claim) {
  const raw = claimWhenText(claim).trim();

  // Weekly labels are intentionally split into a compact range + year so the
  // first column stays readable instead of wrapping at arbitrary characters.
  const weekly = raw.match(/^([A-Za-z]+)\s+(\d+(?:st|nd|rd|th))\s*[-–]\s*([A-Za-z]+)\s+(\d+(?:st|nd|rd|th))\s+(\d{4})$/);
  if (weekly) {
    const [, monthA, dayA, monthB, dayB, year] = weekly;
    return {
      main: monthA === monthB ? `${monthA} ${dayA} – ${dayB}` : `${monthA} ${dayA} – ${monthB} ${dayB}`,
      sub: year
    };
  }

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[Math.max(0, Math.min(11, Number(iso[2]) - 1))];
    return { main: `${month} ${Number(iso[3])}`, sub: iso[1] };
  }

  return { main: raw || 'Unknown date', sub: '' };
}

function renderClaimWhen(claim) {
  const parts = claimWhenParts(claim);
  const wrap = document.createElement('span');
  wrap.className = 'global-claim-log-date-card';

  const main = document.createElement('strong');
  main.className = 'global-claim-log-date-main';
  main.textContent = parts.main;
  wrap.appendChild(main);

  if (parts.sub) {
    const sub = document.createElement('small');
    sub.className = 'global-claim-log-date-sub';
    sub.textContent = parts.sub;
    wrap.appendChild(sub);
  }

  return wrap;
}

function claimPokemonText(claim) {
  const slot = claim && claim.pokemon ? String(claim.pokemon) : '';
  const caught = claim && claim.caughtPokemon ? String(claim.caughtPokemon) : slot;

  if (String(claim?.kind || '') === 'standard' && caught && slot && caught !== slot) {
    return `${prettifyPokemonName(caught)} → ${prettifyPokemonName(slot)}`;
  }

  return prettifyPokemonName(slot || caught || 'unknown');
}

function claimIconSrc(kind) {
  switch (String(kind || '').toLowerCase()) {
    case 'secret': return 'img/symbols/secretshinysprite.png';
    case 'alpha': return 'img/symbols/alphasprite.png';
    case 'safari': return 'img/symbols/safarisprite.png';
    case 'standard':
    default: return 'img/symbols/singlesprite.png';
  }
}

function createClaimSprite(pokemonKey, label) {
  const frame = document.createElement('span');
  frame.className = 'global-claim-log-sprite-frame';

  const img = document.createElement('img');
  img.className = 'global-claim-log-sprite';
  img.src = getPokemonDbShinyGifSrc(pokemonKey);
  img.alt = label || prettifyPokemonName(pokemonKey);
  img.loading = 'lazy';
  img.decoding = 'async';

  frame.appendChild(img);
  return frame;
}

function renderClaimPokemonMiniCard(claim) {
  const slot = claim && claim.pokemon ? String(claim.pokemon) : '';
  const caught = claim && claim.caughtPokemon ? String(claim.caughtPokemon) : slot;
  const isFamilyFallback = String(claim?.kind || '') === 'standard' && caught && slot && caught !== slot;

  const wrap = document.createElement('div');
  wrap.className = `global-claim-log-mon-card${isFamilyFallback ? ' is-family-fallback' : ''}`;

  const sprites = document.createElement('div');
  sprites.className = 'global-claim-log-sprites';

  if (isFamilyFallback) {
    sprites.appendChild(createClaimSprite(caught, prettifyPokemonName(caught)));

    const arrow = document.createElement('span');
    arrow.className = 'global-claim-log-sprite-arrow';
    arrow.textContent = '→';
    sprites.appendChild(arrow);

    sprites.appendChild(createClaimSprite(slot, prettifyPokemonName(slot)));
  } else {
    sprites.appendChild(createClaimSprite(slot || caught, prettifyPokemonName(slot || caught)));
  }

  const labels = document.createElement('span');
  labels.className = 'global-claim-log-mon-labels';

  const primary = document.createElement('strong');
  primary.className = 'global-claim-log-mon-name';
  primary.textContent = claimPokemonText(claim);
  labels.appendChild(primary);

  if (isFamilyFallback) {
    const secondary = document.createElement('small');
    secondary.className = 'global-claim-log-mon-note';
    secondary.textContent = 'Family claim';
    labels.appendChild(secondary);
  }

  wrap.append(sprites, labels);
  return wrap;
}

function renderGlobalClaimLog(model) {
  const claims = Array.isArray(model && model.claims) ? model.claims : [];

  const section = document.createElement('section');
  section.className = 'global-claim-log-section';
  applyFloatingSectionStyle(section);

  const header = document.createElement('h2');
  const awards = Number(model && model.awardCount) || claims.length;
  const totalClaims = Number(model && model.totalClaimValue) || 0;
  const points = Number(model && model.points) || 0;
  header.textContent = `CLAIM LOG — ${awards} Awards · ${totalClaims} Claims · ${points} Points`;
  section.appendChild(header);

  if (!claims.length) {
    const empty = document.createElement('div');
    empty.className = 'global-claim-log-empty';
    empty.textContent = 'No claims match the current search.';
    section.appendChild(empty);
    return section;
  }

  const columns = document.createElement('div');
  columns.className = 'global-claim-log-columns';
  ['Date', 'Player', 'Pokémon claim', 'Award'].forEach(text => {
    const el = document.createElement('span');
    el.textContent = text;
    columns.appendChild(el);
  });
  section.appendChild(columns);

  const list = document.createElement('ol');
  list.className = 'global-claim-log-list';

  claims.forEach(claim => {
    const kind = String(claim.kind || 'standard').toLowerCase();
    const row = document.createElement('li');
    row.className = `global-claim-log-row claim-kind-${kind}`;

    const when = document.createElement('span');
    when.className = 'global-claim-log-when';
    when.appendChild(renderClaimWhen(claim));

    const member = document.createElement('span');
    member.className = 'global-claim-log-member';
    member.textContent = String(claim.member || 'Unknown');

    const pokemon = document.createElement('span');
    pokemon.className = 'global-claim-log-pokemon';
    pokemon.appendChild(renderClaimPokemonMiniCard(claim));

    const award = document.createElement('span');
    award.className = 'global-claim-log-award';

    const icon = document.createElement('img');
    icon.className = 'global-claim-log-award-icon';
    icon.src = claimIconSrc(kind);
    icon.alt = '';

    const awardText = document.createElement('span');
    awardText.className = 'global-claim-log-award-text';

    const pts = Number(claim.points) || 0;
    const prefix = kind === 'standard' ? '' : '+';
    const main = document.createElement('strong');
    main.className = 'global-claim-log-award-main';
    main.textContent = `${claimKindLabel(kind)} ${prefix}${pts}P`;

    const claimValue = Number(claim.claimValue) || 0;
    const claimWord = claimValue === 1 ? 'claim' : 'claims';
    const sub = document.createElement('small');
    sub.className = 'global-claim-log-award-sub';
    sub.textContent = `+${claimValue} ${claimWord}`;

    awardText.append(main, sub);
    award.append(icon, awardText);

    row.append(when, member, pokemon, award);
    list.appendChild(row);
  });

  section.appendChild(list);
  return section;
}

export function renderHitlistFromModel(model, opts) {
  const container = document.getElementById('shiny-dex-container');
  if (!container) return;
  container.replaceChildren();

  const selectedVariantByKey = opts && opts.selectedVariantByKey;

  if (!model) return;

  if (model.mode === 'claimlog') {
    container.appendChild(renderGlobalClaimLog(model));
    return;
  }

  if (!Array.isArray(model.sections)) return;

  if (model.mode === 'scoreboard') {
    model.sections.forEach(sec => {
      const section = document.createElement('section');
      section.className = 'scoreboard-member-section';
      applyFloatingSectionStyle(section);

      const header = document.createElement('h2');
      header.textContent = sec.title || '';

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
