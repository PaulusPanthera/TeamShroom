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
import { getMemberRoleEmblemSrc, getMemberSpriteSrc } from '../../domains/members/member.assets.js';

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

function prettifyMethod(method) {
  const m = normalize(method);
  if (!m) return '';
  if (m === 'single') return 'Single';
  if (m === 'horde') return 'Horde';
  if (m === 'egg') return 'Egg';
  if (m === 'surf') return 'Surf';
  return String(method).trim();
}

function parseEncounter(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;

  const s = String(raw).trim();
  if (!s) return null;

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function buildShinyInfoText(s) {
  // Default info plate for spotlight cards should be the encounter value.
  // Fallback: prettified method label.
  const encounter = parseEncounter(s && s.encounter);
  if (encounter != null) return `Enc: ${encounter}`;

  const methodRaw = s && s.method ? String(s.method) : '';
  const method = prettifyMethod(methodRaw);
  if (method) return `Enc: ${method}`;

  return 'Enc: —';
}

function primaryVariantKeyForShiny(s) {
  if (s && s.alpha) return 'alpha';
  if (s && s.secret) return 'secret';
  if (isSafariMethod(s && s.method)) return 'safari';
  return 'standard';
}

function buildVariantsForShiny(shiny, infoText) {
  const s = shiny || {};
  const safari = isSafariMethod(s && s.method);
  const primary = primaryVariantKeyForShiny(s);

  return [
    { key: 'standard', enabled: true, infoText, active: primary === 'standard' },
    { key: 'secret', enabled: Boolean(s && s.secret), infoText, active: primary === 'secret' },
    { key: 'alpha', enabled: Boolean(s && s.alpha), infoText, active: primary === 'alpha' },
    { key: 'safari', enabled: safari, infoText, active: primary === 'safari' }
  ];
}

function isInactiveShiny(s) {
  return Boolean(s && (s.run || s.lost || s.sold));
}

function buildOwnedShinyCandidatePool({ members, pokemonPointsMap } = {}) {
  const list = Array.isArray(members) ? members : [];
  const pointsMap = pokemonPointsMap && typeof pokemonPointsMap === 'object' ? pokemonPointsMap : {};

  const candidates = [];

  list.forEach(member => {
    const owned = Array.isArray(member && member.ownedShinies) ? member.ownedShinies : [];
    if (!owned.length) return;

    owned.forEach(shiny => {
      if (!shiny || isInactiveShiny(shiny)) return;

      const pokemonKey = shiny && shiny.pokemon ? String(shiny.pokemon).trim().toLowerCase() : '';
      if (!pokemonKey) return;

      const points = Number(pointsMap[pokemonKey]) || 0;
      const tierToken = String(tierFromPoints(points) || '6');

      candidates.push({
        pokemonKey,
        points,
        tierToken,
        memberKey: String(member && member.key || '').trim().toLowerCase(),
        shiny
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
  const rarePool = list.filter(c => rareTokens.has(String(c.tierToken)));
  const commonPool = list.filter(c => !rareTokens.has(String(c.tierToken)));

  const useRare = Math.random() < 0.80;
  let pool = useRare ? rarePool : commonPool;
  if (!pool.length) pool = rarePool.length ? rarePool : commonPool;

  return pickRandom(pool);
}

function buildSpotlightSamples({ members, membersByKey, pokemonPointsMap, sampleCount } = {}) {
  const count = Number(sampleCount) || 24;

  const candidates = buildOwnedShinyCandidatePool({
    members,
    pokemonPointsMap
  });

  if (!candidates.length) return [];

  const samples = [];
  const byKey = membersByKey && typeof membersByKey === 'object' ? membersByKey : {};

  for (let i = 0; i < count; i += 1) {
    if (!candidates.length) break;

    const pick = pickWeightedRandomOwnedShiny(candidates);
    if (!pick) break;

    const idx = candidates.indexOf(pick);
    if (idx >= 0) candidates.splice(idx, 1);

    const member = pick.memberKey && Object.prototype.hasOwnProperty.call(byKey, pick.memberKey)
      ? byKey[pick.memberKey]
      : null;

    if (!member) continue;

    const memberPoints = Number(member && member.points) || 0;
    const memberName = String(member && member.name || '').trim();

    const memberCardProps = {
      cardType: 'member',
      pokemonKey: String(member && member.key || '').trim().toLowerCase(),
      pokemonName: memberName,
      artSrc: getMemberSpriteSrc(member && member.key, member && member.sprite),
      points: memberPoints,
      headerLeftIconSrc: getMemberRoleEmblemSrc(member && member.role),
      headerRightText: `${memberPoints}P`,
      infoText: '',
      isUnclaimed: false,
      showVariants: false
    };

    const infoText = buildShinyInfoText(pick.shiny);

    const pokemonCardProps = {
      pokemonKey: pick.pokemonKey,
      pokemonName: prettifyPokemonName(pick.pokemonKey),
      artSrc: getPokemonDbShinyGifSrc(pick.pokemonKey),
      points: pick.points,
      infoText,
      isUnclaimed: false,
      variants: buildVariantsForShiny(pick.shiny, infoText)
    };

    samples.push({ memberCardProps, pokemonCardProps });
  }

  return samples;
}

function buildSpotlightVm({ members, membersByKey, pokemonPointsMap } = {}) {
  const samples = buildSpotlightSamples({
    members,
    membersByKey,
    pokemonPointsMap,
    sampleCount: 30
  });

  if (!samples.length) return null;

  return {
    samples,
    memberCardProps: samples[0].memberCardProps,
    pokemonCardProps: samples[0].pokemonCardProps
  };
}

function pad2(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return '';
  return String(v).padStart(2, '0');
}

function buildHotwVmFromResult(result, { weeks, pokemonPointsMap, membersByKey } = {}) {
  if (!result) return null;

  const winners = Array.isArray(result.winners) ? result.winners : [];
  if (!winners.length) return null;

  const weekText = result.weekNumber ? `WEEK ${pad2(result.weekNumber)}` : '';

  const primary = winners[0];
  const winnerKey = String(primary && primary.memberKey || '').trim().toLowerCase();
  if (!winnerKey) return null;

  const member = membersByKey && Object.prototype.hasOwnProperty.call(membersByKey, winnerKey)
    ? membersByKey[winnerKey]
    : null;

  const winnerName = String((member && member.name) || (primary && primary.memberName) || '').trim();
  const winnerSpriteExt = (member && member.sprite) ? String(member.sprite) : String(primary && primary.sprite || '');
  const winnerSpriteSrc = getMemberSpriteSrc(winnerKey, winnerSpriteExt);
  const roleEmblemSrc = getMemberRoleEmblemSrc(member && member.role);

  const weekPoints = Number(primary && primary.totalPoints) || 0;
  const shinyCount = Number(primary && primary.shinyCount) || 0;
  const statsText = `TOTAL: ${weekPoints}P / ${shinyCount} SHINIES`;

  const memberCardProps = {
    cardType: 'member',
    pokemonKey: winnerKey,
    pokemonName: winnerName,
    artSrc: winnerSpriteSrc,
    points: weekPoints,
    headerLeftIconSrc: roleEmblemSrc,
    headerRightText: `${weekPoints}P`,
    infoText: weekText,
    isUnclaimed: false,
    showVariants: false
  };

  const weekModel = Array.isArray(weeks)
    ? weeks.find(w => String(w && w.week || '').trim() === String(result.weekKey || '').trim())
    : null;

  const memberGroup = weekModel && weekModel.membersByOt && weekModel.membersByOt[winnerKey]
    ? weekModel.membersByOt[winnerKey]
    : null;

  const allShinies = Array.isArray(memberGroup && memberGroup.shinies) ? memberGroup.shinies : [];

  const entries = allShinies
    .map((s, idx) => ({ s, idx }))
    .filter(x => x.s);

  const obtained = entries.filter(x => !(x.s.run || x.s.lost));
  const missed = entries.filter(x => (x.s.run || x.s.lost));

  const pointsMap = pokemonPointsMap && typeof pokemonPointsMap === 'object' ? pokemonPointsMap : {};

  obtained.sort((a, b) => {
    const ak = String(a.s.pokemon || '').trim().toLowerCase();
    const bk = String(b.s.pokemon || '').trim().toLowerCase();
    const ap = Number(pointsMap[ak]) || 0;
    const bp = Number(pointsMap[bk]) || 0;
    if (bp != ap) return bp - ap;
    return a.idx - b.idx;
  });

  missed.sort((a, b) => a.idx - b.idx);

  const deckEntries = obtained.slice(0, 3);
  if (deckEntries.length < 3 && missed.length) {
    deckEntries.push(...missed.slice(0, 3 - deckEntries.length));
  }

  const deckMons = deckEntries.map(x => x.s);

  return {
    titleText: 'Hunter of the Week',
    nameText: winnerName,
    statsText,
    weekText,
    memberCardProps,
    deckMons,
    pokemonPointsMap
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

    // Sidebar status stats (team totals).
    try {
      const list = (showcase && Array.isArray(showcase.members)) ? showcase.members : [];
      const memberCount = list.length;
      const totalShinies = list.reduce((sum, m) => sum + (Number(m && m.shinyCount) || 0), 0);
      const totalPoints = list.reduce((sum, m) => sum + (Number(m && m.points) || 0), 0);

      vm.stats = { memberCount, totalShinies, totalPoints };
    } catch {
      vm.stats = null;
    }

    // Spotlight (member + owned shiny card) samples.
    vm.spotlight = buildSpotlightVm({
      members: showcase && showcase.members,
      membersByKey: showcase && showcase.byKey,
      pokemonPointsMap
    });

    // Hunter of the Week (auto-derived).
    const weeks = buildShinyWeeklyModel(weeklyRows);
    const hotw = computeHotwFromWeeks({
      weeks,
      pokemonPointsMap,
      membersByKey: showcase && showcase.byKey
    });

    vm.hotw = buildHotwVmFromResult(hotw, {
      weeks,
      pokemonPointsMap,
      membersByKey: showcase && showcase.byKey
    });
  } catch {
    vm.spotlight = null;
    vm.hotw = null;
  }

  return vm;
}
