// src/features/shinydex/shinydex.living.presenter.js
// Living Dex Presenter — view-specific data prep (no DOM)

import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';

import {
  parseSearch,
  resolveFamilyRootsByQuery,
  speciesMatches,
  memberMatches
} from './shinydex.search.js';

export function prepareLivingDexRenderModel({
  showcaseRows,
  viewState,
  searchCtx
}) {
  const mode = viewState.sort; // 'standard' | 'total'
  const parsed = parseSearch(viewState.search);

  const snapshot = buildShinyLivingDexModel(showcaseRows);

  const totalSpecies = snapshot.length;
  const ownedSpecies = snapshot.filter(e => e.count > 0).length;
  const unownedSpecies = totalSpecies - ownedSpecies;

  const regionStats = {};
  snapshot.forEach(e => {
    const region = e.region || 'unknown';
    regionStats[region] ??= { total: 0, owned: 0 };
    regionStats[region].total += 1;
    if (e.count > 0) regionStats[region].owned += 1;
  });

  // --------------------------------------------------
  // MODE DATASET (PRE-SEARCH)
  // --------------------------------------------------

  let modeSet = snapshot;

  if (mode === 'total') {
    modeSet = [...modeSet].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (searchCtx.dexIndex[a.pokemon] ?? 999999) - (searchCtx.dexIndex[b.pokemon] ?? 999999);
    });
  }

  if (viewState.showUnclaimed) {
    modeSet = modeSet.filter(e => e.count === 0);
  }

  // --------------------------------------------------
  // SEARCH LAST (VISIBILITY ONLY)
  // --------------------------------------------------

  let visible = modeSet;

  if (parsed.kind === 'member' && parsed.q) {
    visible = visible.filter(e =>
      Array.isArray(e.owners) && e.owners.some(o => memberMatches(o, parsed.q))
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
    const region = e.region || 'unknown';
    byRegion[region] ??= [];
    byRegion[region].push(e);
  });

  return {
    sections: Object.entries(byRegion).map(([region, entries]) => {
      const stats = regionStats[region] || { owned: 0, total: 0 };
      return {
        key: region,
        title: `${region.toUpperCase()} (${stats.owned} / ${stats.total})`,
        entries: entries.map(e => ({
          ...e,
          highlighted: e.count > 0
        }))
      };
    }),
    countLabelText: viewState.showUnclaimed
      ? `${unownedSpecies} / ${totalSpecies} Species`
      : `${ownedSpecies} / ${totalSpecies} Species`
  };
}
