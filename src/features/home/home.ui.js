// src/features/home/home.ui.js
// v2.0.0-beta
// Home UI renderer: HQ widgets (Next Event / Bounty / HotW / Random Shiny)

import { renderUnifiedCard } from '../../ui/unifiedcard.js';

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function safeText(value) {
  if (value == null) return '';
  const s = String(value).trim();
  return s;
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
  const panel = el('div', 'ts-panel ts-home-panel');
  panel.appendChild(renderPanelTitle('NEXT EVENT'));

  const body = el('div', 'ts-home-panel-body');

  const gif = renderGifLink({
    href: safeText(vm?.url),
    gifSrc: safeText(vm?.gifSrc),
    altText: safeText(vm?.titleText)
  });

  if (gif) body.appendChild(gif);

  const title = safeText(vm?.titleText);
  const time = safeText(vm?.timeText);
  const sub = safeText(vm?.subtitleText);

  const lines = renderKeyValueLines([
    title && title !== 'Next Event' ? title : '',
    time,
    sub
  ]);

  if (lines.childNodes.length) body.appendChild(lines);

  // Fallback if no gif and no text
  if (!gif && !lines.childNodes.length) {
    const empty = el('div', 'ts-home-empty');
    empty.textContent = 'No event scheduled.';
    body.appendChild(empty);
  }

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

function renderHotwPanel(vm) {
  const panel = el('div', 'ts-panel ts-home-panel');
  panel.appendChild(renderPanelTitle('HUNTER OF THE WEEK'));

  const body = el('div', 'ts-home-panel-body');

  const sprites = Array.isArray(vm?.sprites) ? vm.sprites : [];
  const fallbackSprite = safeText(vm?.gifSrc) || safeText(vm?.spriteSrc);

  if (sprites.length || fallbackSprite) {
    const spriteWrap = el('div', 'ts-home-hotw-sprite');

    const renderSpriteImg = (src, altText) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = safeText(altText) || '';
      img.loading = 'lazy';
      spriteWrap.appendChild(img);
    };

    if (sprites.length) {
      sprites
        .map(safeText)
        .filter(Boolean)
        .slice(0, 4)
        .forEach(src => renderSpriteImg(src, safeText(vm?.nameText)));
    } else {
      renderSpriteImg(fallbackSprite, safeText(vm?.nameText));
    }

    body.appendChild(spriteWrap);
  }

  const statsText = safeText(vm?.statsText) || safeText(vm?.reasonText);

  const lines = renderKeyValueLines([
    safeText(vm?.nameText),
    safeText(vm?.weekText),
    statsText
  ]);

  if (lines.childNodes.length) body.appendChild(lines);

  if (!(sprites.length || fallbackSprite) && !lines.childNodes.length) {
    const empty = el('div', 'ts-home-empty');
    empty.textContent = 'No selection yet.';
    body.appendChild(empty);
  }

  panel.appendChild(body);
  return panel;
}

function renderRandomShinyRow(item) {
  const row = el('div', 'ts-home-random-row');

  const cardProps = item && item.cardProps ? item.cardProps : null;
  if (!cardProps) return row;

  const card = renderUnifiedCard(cardProps);
  card.classList.add('ts-home-random-card');

  const side = el('div', 'ts-home-random-owner');

  const ownerSprite = safeText(item && item.ownerSpriteSrc);
  if (ownerSprite) {
    const img = document.createElement('img');
    img.className = 'ts-home-random-owner-sprite';
    img.src = ownerSprite;
    img.alt = safeText(item && item.ownerNameText) || '';
    img.loading = 'lazy';
    side.appendChild(img);
  }

  const ownerName = safeText(item && item.ownerNameText);
  if (ownerName) {
    const name = el('div', 'ts-home-random-owner-name');
    name.textContent = ownerName;
    side.appendChild(name);
  }

  row.append(card, side);
  return row;
}

function renderRandomShinyPanel(vm) {
  const panel = el('div', 'ts-panel ts-home-panel');
  panel.appendChild(renderPanelTitle('RANDOM OWNED SHINIES'));

  const body = el('div', 'ts-home-panel-body ts-home-panel-body--random');

  const items = Array.isArray(vm?.items) ? vm.items : [];

  if (items.length) {
    const stack = el('div', 'ts-home-random-stack');
    items.forEach(item => {
      stack.appendChild(renderRandomShinyRow(item));
    });
    body.appendChild(stack);
  } else {
    const empty = el('div', 'ts-home-empty');
    empty.textContent = 'No owned shinies available.';
    body.appendChild(empty);
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

export function renderContent(root, viewModel) {
  if (!root) return;

  const grid = el('div', 'ts-home-grid');

  grid.appendChild(renderNextEventPanel(viewModel?.nextEvent));
  grid.appendChild(renderBountyPanel(viewModel?.bounty));
  grid.appendChild(renderHotwPanel(viewModel?.hotw));
  grid.appendChild(renderRandomShinyPanel(viewModel?.randomShiny));

  root.replaceChildren(grid);
}
