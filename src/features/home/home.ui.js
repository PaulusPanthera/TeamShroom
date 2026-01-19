// src/features/home/home.ui.js
// v2.0.0-beta
// Home UI renderer: HQ widgets (Next Event / Bounty / HotW / Spotlight)

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { renderWeeklyPokemonCard } from '../../ui/weekly-pokemon-card.js';

const DISCORD_NEXT_EVENT_URL = 'https://discord.com/events/1178448989566283779/1462228724794658917';

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function safeText(value) {
  if (value == null) return '';
  return String(value).trim();
}

function renderPanelTitle(text) {
  const t = el('div', 'ts-panel-title');
  t.textContent = safeText(text);
  return t;
}

function renderGifLink({ href, gifSrc, altText }) {
  const src = safeText(gifSrc);
  if (!src) return null;

  const wrap = el('div', 'ts-home-gif');

  const img = document.createElement('img');
  img.src = src;
  img.alt = safeText(altText) || '';
  img.loading = 'lazy';

  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noreferrer noopener';
    a.appendChild(img);
    wrap.appendChild(a);
  } else {
    wrap.appendChild(img);
  }

  return wrap;
}

function renderKeyValueLines(lines) {
  const wrap = el('div', 'ts-home-lines');
  (lines || [])
    .filter(Boolean)
    .map(safeText)
    .filter(Boolean)
    .forEach(line => {
      const row = el('div', 'ts-home-line');
      row.textContent = line;
      wrap.appendChild(row);
    });

  return wrap;
}

function renderNextEventPanel(vm) {
  const panel = el('div', 'ts-panel ts-home-panel ts-home-panel--event');
  panel.appendChild(renderPanelTitle('NEXT EVENT'));

  // NEXT EVENT is a single centered preview card.
  const body = el('div', 'ts-home-panel-body ts-home-panel-body--center');

  const rawUrl = safeText(vm?.url);
  const href = rawUrl && !rawUrl.includes('<') ? rawUrl : DISCORD_NEXT_EVENT_URL;

  const title = safeText(vm?.title) || safeText(vm?.titleText) || 'Next Event';
  const time = safeText(vm?.timeText) || 'Open event link';
  // Only render the human subtitle/description. Never display the raw event URL.
  // (Some sync workflows or manual edits may accidentally provide the URL as a subtitle.)
  let sub = safeText(vm?.subtitle) || safeText(vm?.subtitleText) || '';
  if (
    sub &&
    (sub === href ||
      sub === rawUrl ||
      sub.includes('discord.com/events') ||
      /^https?:\/\//i.test(sub))
  ) {
    sub = '';
  }

  const preview = el('div', 'ts-discord-event-preview');

  const link = document.createElement('a');
  link.className = 'ts-discord-event-preview__link';
  link.href = href;
  link.target = '_blank';
  link.rel = 'noreferrer noopener';

  const badge = el('div', 'ts-discord-event-preview__badge');
  badge.textContent = 'DISCORD EVENT';

  const titleEl = el('div', 'ts-discord-event-preview__title');
  titleEl.textContent = title;

  const timeEl = el('div', 'ts-discord-event-preview__time');
  timeEl.textContent = time;

  link.append(badge, titleEl, timeEl);

  if (sub) {
    const subEl = el('div', 'ts-discord-event-preview__sub');
    subEl.textContent = sub;
    link.appendChild(subEl);
  }

  const cta = el('div', 'ts-discord-event-preview__cta');
  cta.textContent = 'OPEN EVENT';
  link.appendChild(cta);

  preview.appendChild(link);
  body.appendChild(preview);

  panel.appendChild(body);
  return panel;
}

function renderBountyPanel(vm) {
  const panel = el('div', 'ts-panel ts-home-panel');
  panel.appendChild(renderPanelTitle('BOUNTY'));

  const body = el('div', 'ts-home-panel-body');

  const gif = renderGifLink({
    href: safeText(vm?.url),
    gifSrc: safeText(vm?.gifSrc),
    altText: safeText(vm?.targetText) || safeText(vm?.titleText)
  });

  if (gif) body.appendChild(gif);

  const lines = renderKeyValueLines([
    safeText(vm?.targetText),
    safeText(vm?.rewardText),
    safeText(vm?.deadlineText),
    safeText(vm?.rulesText)
  ]);

  if (lines.childNodes.length) body.appendChild(lines);

  if (!gif && !lines.childNodes.length) {
    const empty = el('div', 'ts-home-empty');
    empty.textContent = 'No active bounty.';
    body.appendChild(empty);
  }

  panel.appendChild(body);
  return panel;
}

function shuffleDeckInPlace(deckEl) {
  if (!deckEl || deckEl.childElementCount < 2) return;

  const nodes = Array.from(deckEl.children);
  for (let i = nodes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = nodes[i];
    nodes[i] = nodes[j];
    nodes[j] = tmp;
  }

  deckEl.replaceChildren();
  nodes.forEach(n => deckEl.appendChild(n));
}

function renderHotwPanel(vm) {
  const panel = el('div', 'ts-panel ts-home-panel ts-home-panel--hotw');
  panel.appendChild(renderPanelTitle('HUNTER OF THE WEEK'));

  const body = el('div', 'ts-home-panel-body');

  const memberCardProps = vm && vm.memberCardProps ? vm.memberCardProps : null;
  const deckMons = Array.isArray(vm && vm.deckMons) ? vm.deckMons : [];
  const pointsMap = vm && vm.pokemonPointsMap ? vm.pokemonPointsMap : null;

  if (memberCardProps) {
    const layout = el('div', 'ts-home-hotw-layout');

    const memberWrap = el('div', 'ts-home-hotw-member');

    const deckWrap = el('div', 'ts-home-hotw-deck');
    const deck = el('div', 'ts-home-card-deck');

    // Click-to-cycle: rotate the visible deck order (no data reload).
    deck.addEventListener('click', (e) => {
      if (e && e.target && e.target.closest && e.target.closest('.variant-btn')) return;
      if (deck.childElementCount < 2) return;
      const first = deck.firstElementChild;
      if (first) deck.appendChild(first);
    });

    const memberCard = renderUnifiedCard(memberCardProps);
    memberCard.classList.add('ts-home-hotw-membercard');

    // Clicking the member card shuffles the HOTW deck cards.
    memberCard.addEventListener('click', (e) => {
      if (e && e.target && e.target.closest && e.target.closest('.variant-btn')) return;
      shuffleDeckInPlace(deck);
    });

    memberWrap.appendChild(memberCard);

    if (deckMons.length && pointsMap) {
      deckMons.slice(0, 3).forEach(mon => {
        const card = renderWeeklyPokemonCard(mon, pointsMap);
        card.classList.add('ts-home-deck-card');
        deck.appendChild(card);
      });
    } else {
      const emptyDeck = el('div', 'ts-home-empty');
      emptyDeck.textContent = 'No shinies logged.';
      deckWrap.appendChild(emptyDeck);
    }

    if (deck.childNodes.length) deckWrap.appendChild(deck);

    layout.append(memberWrap, deckWrap);
    body.appendChild(layout);
  } else {
    const empty = el('div', 'ts-home-empty');
    empty.textContent = 'No selection yet.';
    body.appendChild(empty);
  }

  panel.appendChild(body);
  return panel;
}

function renderSpotlightPanel(spotlightVm, { signal } = {}) {
  const panel = el('div', 'ts-panel ts-home-panel ts-home-panel--spotlight');
  panel.appendChild(renderPanelTitle('SPOTLIGHT'));

  const body = el('div', 'ts-home-panel-body');

  const samples = Array.isArray(spotlightVm?.samples) ? spotlightVm.samples : [];

  if (!samples.length) {
    const empty = el('div', 'ts-home-empty');
    empty.textContent = 'No owned shinies available.';
    body.appendChild(empty);
    panel.appendChild(body);
    return panel;
  }

  const layout = el('div', 'ts-home-spotlight-layout');
  const memberWrap = el('div', 'ts-home-spotlight-member');
  const pokemonWrap = el('div', 'ts-home-spotlight-pokemon');

  layout.append(memberWrap, pokemonWrap);
  body.appendChild(layout);

  let idx = 0;

  const applySample = (sample) => {
    if (!sample) return;

    memberWrap.replaceChildren();
    pokemonWrap.replaceChildren();

    const memberCardProps = sample.memberCardProps || null;
    const pokemonCardProps = sample.pokemonCardProps || null;

    if (memberCardProps) {
      const card = renderUnifiedCard(memberCardProps);
      card.classList.add('ts-home-spotlight-membercard');
      card.addEventListener('click', (e) => {
        if (e && e.target && e.target.closest && e.target.closest('.variant-btn')) return;
        idx = (idx + 1) % samples.length;
        applySample(samples[idx]);
      });
      memberWrap.appendChild(card);
    }

    if (pokemonCardProps) {
      const card = renderUnifiedCard(pokemonCardProps);
      card.classList.add('ts-home-spotlight-pokemoncard');
      card.addEventListener('click', (e) => {
        if (e && e.target && e.target.closest && e.target.closest('.variant-btn')) return;
        idx = (idx + 1) % samples.length;
        applySample(samples[idx]);
      });
      pokemonWrap.appendChild(card);
    }
  };

  applySample(samples[idx]);

  const intervalId = window.setInterval(() => {
    idx = (idx + 1) % samples.length;
    applySample(samples[idx]);
  }, 5000);

  if (signal && typeof signal.addEventListener === 'function') {
    signal.addEventListener('abort', () => window.clearInterval(intervalId), { once: true });
  }

  panel.appendChild(body);
  return panel;
}

export function renderLoading(root) {
  if (!root) return;
  const panel = el('div', 'ts-panel ts-home-panel');
  const body = el('div', 'ts-home-panel-body');
  body.textContent = 'Loading Home...';
  panel.appendChild(body);
  root.replaceChildren(panel);
}

export function renderError(root) {
  if (!root) return;
  const panel = el('div', 'ts-panel ts-home-panel');
  const body = el('div', 'ts-home-panel-body');
  body.textContent = 'Failed to load Home.';
  panel.appendChild(body);
  root.replaceChildren(panel);
}

export function renderContent(root, viewModel, options = {}) {
  if (!root) return;

  const grid = el('div', 'ts-home-grid');

  // Layout order:
  // Top-left: Spotlight
  // Top-right: Bounty
  // Bottom-left: HOTW
  // Bottom-right: Next Event
  grid.appendChild(renderSpotlightPanel(viewModel?.spotlight, { signal: options?.signal }));
  grid.appendChild(renderBountyPanel(viewModel?.bounty));
  grid.appendChild(renderHotwPanel(viewModel?.hotw));
  grid.appendChild(renderNextEventPanel(viewModel?.nextEvent));

  root.replaceChildren(grid);
}

