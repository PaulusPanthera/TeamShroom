// src/features/home/home.presenter.js
// v2.0.0-beta
// Home presenter: normalize raw JSON row into a stable view-model

function asText(value) {
  if (value == null) return '';
  const s = String(value).trim();
  return s;
}

function asObj(value) {
  return value && typeof value === 'object' ? value : {};
}

function normalizeEvent(raw) {
  const e = asObj(raw);
  return {
    titleText: asText(e.title) || 'Next Event',
    subtitleText: asText(e.subtitle) || '',
    timeText: asText(e.timeText) || '',
    url: asText(e.url) || '',
    gifSrc: asText(e.gifSrc) || ''
  };
}

function normalizeBounty(raw) {
  const b = asObj(raw);
  return {
    titleText: asText(b.title) || 'Bounty',
    targetText: asText(b.targetText) || '',
    rewardText: asText(b.rewardText) || '',
    rulesText: asText(b.rulesText) || '',
    deadlineText: asText(b.deadlineText) || '',
    url: asText(b.url) || '',
    gifSrc: asText(b.gifSrc) || ''
  };
}

function normalizeHotw(raw) {
  const h = asObj(raw);
  return {
    titleText: asText(h.titleText) || 'Hunter of the Week',
    nameText: asText(h.name) || '',
    reasonText: asText(h.reasonText) || '',
    weekText: asText(h.weekText) || '',
    spriteSrc: asText(h.spriteSrc) || '',
    gifSrc: asText(h.gifSrc) || ''
  };
}

export function presentHomeViewModel(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const row0 = list.length ? asObj(list[0]) : {};

  const nextEvent = normalizeEvent(row0.nextEvent);
  const bounty = normalizeBounty(row0.bounty);
  const hotw = normalizeHotw(row0.hotw);

  return {
    nextEvent,
    bounty,
    hotw
  };
}
