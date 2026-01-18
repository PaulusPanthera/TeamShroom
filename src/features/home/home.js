// src/features/home/home.js
// v2.0.0-beta
// Home feature data wiring (static load -> presenter + derived widgets)

import { loadHome } from '../../data/home.loader.js';
import { loadMembers } from '../../data/members.loader.js';
import { loadShinyShowcase } from '../../data/shinyshowcase.loader.js';
import { loadShinyWeekly } from '../../data/shinyweekly.loader.js';

import { buildShinyWeeklyModel } from '../../domains/shinyweekly/shinyweekly.model.js';
import { computeHotwFromWeeks } from '../../domains/shinyweekly/hotw.ai.js';

import { initPokemonDerivedDataOnce, getPokemonPointsMap } from '../../domains/pokemon/pokemon.data.js';
import { buildShowcaseModel } from '../../domains/showcase/showcase.model.js';

import { tierFromPoints } from '../../ui/tier-map.js';
import { prettifyPokemonName, getPokemonDbShinyGifSrc } from '../../utils/utils.js';

import { presentHomeViewModel } from './home.presenter.js';

function normalize(str) {
  return String(str || '').trim().toLowerCase();
}

function isSafariMethod(method) {
  return normalize(method).includes('safari');
}

function pickRandom(list) {
  const arr = Array.isArray(list) ? list : [];
  if (!arr.length) return null;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx] || null;
}

function spriteSrcForMember(member) {
  const key = member && member.key ? String(member.key) : '';
  const ext = member && member.sprite ? String(member.sprite) : '';
  if (key && ext) return `img/membersprites/${key}sprite.${ext}`;
  return 'img/membersprites/examplesprite.png';
}

function buildVariantsForShiny(shiny, infoText) {
  const s = shiny || {};
  const safari = Boolean(s.safari) || isSafariMethod(s.method);

  // Pick a single highlight as the active tab.
  const primary = s.alpha ? 'alpha' : s.secret ? 'secret' : safari ? 'safari' : 'standard';

  return [
    { key: 'standard', enabled: true, infoText, active: primary === 'standard' },
    { key: 'secret', enabled: Boolean(s.secret), infoText, active: primary === 'secret' },
    { key: 'alpha', enabled: Boolean(s.alpha), infoText, active: primary === 'alpha' },
    { key: 'safari', enabled: safari, infoText, active: primary === 'safari' }
  ];
}

function buildRandomOwnedShinyCandidatePool({ members, pokemonPointsMap } = {}) {
  const list = Array.isArray(members) ? members : [];
  const pointsMap = pokemonPointsMap && typeof pokemonPointsMap === 'object' ? pokemonPointsMap : {};

  const candidates = [];

  list.forEach(m => {
    const owned = Array.isArray(m && m.ownedShinies) ? m.ownedShinies : [];
    if (!owned.length) return;

    owned.forEach(s => {
      const pokemonKey = s && s.pokemon ? String(s.pokemon).trim().toLowerCase() : '';
      if (!pokemonKey) return;

      const points = Number(pointsMap[pokemonKey]) || 0;
      const tierToken = String(tierFromPoints(points) || '6');

      candidates.push({
        pokemonKey,
        points,
        tierToken,
        ownerName: String(m && m.name || ''),
        ownerKey: String(m && m.key || ''),
        ownerSpriteSrc: spriteSrcForMember(m),
        shiny: s
      });
    });
  });

  return candidates;
}

function pickWeightedRandomOwnedShiny(candidates) {
  const list = Array.isArray(candidates) ? candidates : [];
  if (!list.length) return null;

  // 80% -> LM / 0 / 1 / 2 / 3
  // 20% -> 4 / 5 / 6
  const rareTokens = new Set(['lm', '0', '1', '2', '3']);
  const rarePool = list.filter(c => rareTokens.has(c.tierToken));
  const commonPool = list.filter(c => !rareTokens.has(c.tierToken));

  const useRare = Math.random() < 0.80;
  let pool = useRare ? rarePool : commonPool;
  if (!pool.length) pool = rarePool.length ? rarePool : commonPool;

  return pickRandom(pool);
}

function buildRandomOwnedShinyItemsVm({ members, pokemonPointsMap } = {}) {
  const candidates = buildRandomOwnedShinyCandidatePool({ members, pokemonPointsMap });
  if (!candidates.length) return null;

  const items = [];

  for (let i = 0; i < 2; i += 1) {
    if (!candidates.length) break;

    const pick = pickWeightedRandomOwnedShiny(candidates);
    if (!pick) break;

    // Remove exact pick to avoid duplicate render in the same panel.
    const idx = candidates.indexOf(pick);
    if (idx >= 0) candidates.splice(idx, 1);

    const infoText = pick.ownerName || '';

    items.push({
      ownerNameText: pick.ownerName,
      ownerSpriteSrc: pick.ownerSpriteSrc,
      cardProps: {
        pokemonKey: pick.pokemonKey,
        pokemonName: prettifyPokemonName(pick.pokemonKey),
        artSrc: getPokemonDbShinyGifSrc(pick.pokemonKey),
        points: pick.points,
        infoText,
        isCompact: true,
        isUnclaimed: false,
        variants: buildVariantsForShiny(pick.shiny, infoText)
      }
    });
  }

  if (!items.length) return null;
  return { items };
}

function pad2(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return '';
  return String(v).padStart(2, '0');
}

function buildHotwVmFromResult(result) {
  if (!result) return null;

  const winners = Array.isArray(result.winners) ? result.winners : [];
  if (!winners.length) return null;

  const weekText = result.weekNumber ? `WEEK ${pad2(result.weekNumber)}` : '';
  const nameText = (Array.isArray(result.winnerNames) ? result.winnerNames : [])
    .filter(Boolean)
    .join(', ');

  const sprites = winners
    .map(w => ({ key: String(w && w.memberKey || ''), sprite: String(w && w.sprite || '') }))
    .filter(w => w.key && w.sprite)
    .map(w => `img/membersprites/${w.key}sprite.${w.sprite}`);

  const totalPoints = Number(result.totalPoints) || 0;
  const shinyCount = Number(result.shinyCount) || 0;
  const statsText = `TOTAL: ${totalPoints}P / ${shinyCount} SHINIES`;

  return {
    titleText: 'Hunter of the Week',
    nameText,
    weekText,
    statsText,
    sprites
  };
}

/**
 * Fetch Home view-model.
 *
 * Contract:
 * - Home JSON returns an array of rows; first row is used.
 */
export async function fetchHomeViewModel(preloadedRows) {
  const rows = Array.isArray(preloadedRows) ? preloadedRows : await loadHome();
  const vm = presentHomeViewModel(rows);

  // Derived widgets.
  // Home must never fail if extra data is missing.
  try {
    await initPokemonDerivedDataOnce();
    const pokemonPointsMap = getPokemonPointsMap();

    const [membersRows, showcaseRows, weeklyRows] = await Promise.all([
      loadMembers(),
      loadShinyShowcase(),
      loadShinyWeekly()
    ]);

    const showcase = buildShowcaseModel({
      membersRows,
      showcaseRows,
      pokemonPoints: pokemonPointsMap
    });

    // Random owned shiny cards (2 entries).
    vm.randomShiny = buildRandomOwnedShinyItemsVm({
      members: showcase && showcase.members,
      pokemonPointsMap
    });

    // Hunter of the Week (auto-derived).
    const weeks = buildShinyWeeklyModel(weeklyRows);
    const hotw = computeHotwFromWeeks({
      weeks,
      pokemonPointsMap,
      membersByKey: showcase && showcase.byKey
    });

    vm.hotw = buildHotwVmFromResult(hotw);
  } catch {
    vm.randomShiny = null;
    vm.hotw = null;
  }

  return vm;
}
