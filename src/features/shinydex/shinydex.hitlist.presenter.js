// v2.0.0-alpha.1
// src/features/shinydex/shinydex.hitlist.presenter.js
// Hitlist Presenter — view-specific data prep (no DOM)

import { buildShinyDexModel } from '../../domains/shinydex/hitlist.model.js';
import {
  POKEMON_REGION,
  POKEMON_SHOW
} from '../../data/pokemondatabuilder.js';

import {
  parseSearch,
  resolveFamilyRootsByQuery,
  speciesMatches,
  memberMatches
} from './shinydex.search.js';

export function prepareHitlistRenderModel({
  weeklyModel,
  viewState,
  searchCtx
}) {
  const mode = viewState.sort; // 'standard' | 'claims' | 'points'
  const parsed = parseSearch(viewState.search);

  const snapshot = buildShinyDexModel(weeklyModel).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  const totalSpecies = snapshot.length;
  const claimedSpecies = snapshot.filter(e => e.claimed).length;
  const unclaimedSpecies = totalSpecies - claimedSpecies;

  const regionStats = {};
  snapshot.forEach(e => {
    const region = POKEMON_REGION[e.pokemon] || 'unknown';
    regionStats[region] ??= { total: 0, claimed: 0 };
    regionStats[region].total += 1;
    if (e.claimed) regionStats[region].claimed += 1;
  });

  if (mode === 'claims' || mode === 'points') {
    const claimed = snapshot.filter(e => e.claimed);

    const byMember = {};
    claimed.forEach(e => {
      byMember[e.claimedBy] ??= [];
      byMember[e.claimedBy].push(e);
    });

    const fullLeaderboard = Object.entries(byMember)
      .map(([name, entries]) => ({
        name,
        entries,
        claims: entries.length,
        points: entries.reduce((s, e) => s + e.points, 0)
      }))
      .sort((a, b) =>
        mode === 'claims'
          ? b.claims - a.claims
          : b.points - a.points
      );

    const rankByName = {};
    fullLeaderboard.forEach((m, idx) => {
      rankByName[m.name] = idx + 1;
    });

    let visibleLeaderboard = fullLeaderboard;
    if (parsed.kind === 'member' && parsed.q) {
      visibleLeaderboard = fullLeaderboard.filter(m =>
        memberMatches(m.name, parsed.q)
      );
    }

    return {
      mode: 'scoreboard',
      sections: visibleLeaderboard.map(m => ({
        key: m.name,
        title: `${rankByName[m.name]}. ${m.name} — ${m.claims} Claims · ${m.points} Points`,
        entries: m.entries.map(e => ({
          ...e,
          highlighted: true,
          info: `${e.points} pts`
        }))
      })),
      countLabelText: `${fullLeaderboard.length} Members`
    };
  }

  let modeSet = snapshot;

  if (viewState.showUnclaimed) {
    modeSet = modeSet.filter(e => !e.claimed);
  }

  let visible = modeSet;

  if (parsed.kind === 'member' && parsed.q) {
    visible = visible.filter(
      e => e.claimed && memberMatches(e.claimedBy || '', parsed.q)
    );
  } else if (parsed.kind === 'family' && parsed.q) {
    const roots = resolveFamilyRootsByQuery(searchCtx, parsed.q);
    visible = visible.filter(e =>
      roots.has(searchCtx.rootByPokemon[e.pokemon] || e.pokemon)
    );
  } else if (parsed.kind === 'species' && parsed.q) {
    visible = visible.filter(e => speciesMatches(e.pokemon, parsed.q));
  }

  const byRegion = {};
  visible.forEach(e => {
    const region = POKEMON_REGION[e.pokemon] || 'unknown';
    byRegion[region] ??= [];
    byRegion[region].push(e);
  });

  const countLabelText = viewState.showUnclaimed
    ? `${unclaimedSpecies} Unclaimed`
    : `${claimedSpecies} / ${totalSpecies} Claimed`;

  return {
    mode: 'standard',
    sections: Object.entries(byRegion).map(([region, entries]) => {
      const stats = regionStats[region] || { claimed: 0, total: 0 };
      const regionUnclaimed = stats.total - stats.claimed;

      const title = viewState.showUnclaimed
        ? `${region.toUpperCase()} (${regionUnclaimed} Unclaimed)`
        : `${region.toUpperCase()} (${stats.claimed} / ${stats.total})`;

      return {
        key: region,
        title,
        entries: entries.map(e => ({
          ...e,
          highlighted: e.claimed && e.points >= 15
        }))
      };
    }),
    countLabelText
  };
}
