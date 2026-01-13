// v2.0.0-alpha.1
// src/features/shinydex/shinydex.living.presenter.js
// Living Dex Presenter — view-specific data prep (no DOM)

import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';

import {
  parseSearch,
  resolveFamilyRootsByQuery,
  speciesMatches,
  memberMatches
} from './shinydex.search.js';

function normalizeRegion(raw) {
  return String(raw || '').trim().toLowerCase();
}

export function prepareLivingDexRenderModel({
  showcaseRows,
  viewState,
  searchCtx
}) {
  const mode = viewState.sort; // 'standard' | 'total'
  const parsed = parseSearch(viewState.search);

  // truth snapshot
  let snapshot = buildShinyLivingDexModel(showcaseRows);

  // region filter applies to mode dataset + counters (pre-search)
  if (parsed.filters?.region) {
    const r = normalizeRegion(parsed.filters.region);
    snapshot = snapshot.filter(e => normalizeRegion(e.region) === r);
  }

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

  const forceUnowned = !!parsed.flags.unowned;
  const forceOwned = !!parsed.flags.owned;
  const effectiveUnclaimed = forceUnowned ? true : (forceOwned ? false : !!viewState.showUnclaimed);

  let modeSet = snapshot;

  if (mode === 'total') {
    modeSet = [...modeSet].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (searchCtx.dexIndex[a.pokemon] ?? 999999) - (searchCtx.dexIndex[b.pokemon] ?? 999999);
    });
  }

  if (effectiveUnclaimed) modeSet = modeSet.filter(e => e.count === 0);
  if (forceOwned) modeSet = modeSet.filter(e => e.count > 0);

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

  const countLabelText = effectiveUnclaimed
    ? `${unownedSpecies} Unowned`
    : `${ownedSpecies} / ${totalSpecies} Owned`;

  return {
    sections: Object.entries(byRegion).map(([region, entries]) => {
      const stats = regionStats[region] || { owned: 0, total: 0 };
      const regionUnowned = stats.total - stats.owned;

      const title = effectiveUnclaimed
        ? `${region.toUpperCase()} (${regionUnowned} Unowned)`
        : `${region.toUpperCase()} (${stats.owned} / ${stats.total})`;

      return {
        key: region,
        title,
        entries: entries.map(e => ({
          ...e,
          highlighted: e.count > 0
        }))
      };
    }),
    countLabelText
  };
}
