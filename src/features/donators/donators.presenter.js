// src/features/donators/donators.presenter.js
// Donators — presenter (formatting + view model)

import { buildDonatorsModel } from '../../domains/donators/donators.model.js';

export const DONATOR_TIERS = {
  top:      { icon: 'img/symbols/topdonatorsprite.png',      label: 'Top Donator', desc: 'Our #1 supporter.' },
  diamond:  { icon: 'img/symbols/diamonddonatorsprite.png',  label: 'Diamond',     desc: '50,000,000+ donated.' },
  platinum: { icon: 'img/symbols/platinumdonatorsprite.png', label: 'Platinum',    desc: '25,000,000+ donated.' },
  gold:     { icon: 'img/symbols/golddonatorsprite.png',     label: 'Gold',        desc: '10,000,000+ donated.' },
  silver:   { icon: 'img/symbols/silverdonatorsprite.png',   label: 'Silver',      desc: '5,000,000+ donated.' },
  bronze:   { icon: 'img/symbols/bronzedonatorsprite.png',   label: 'Bronze',      desc: '1,000,000+ donated.' },
  none:     { icon: '',                                      label: 'Supporter',   desc: 'Below 1,000,000 donated.' }
};

export const DONATOR_TIER_ORDER = ['top', 'diamond', 'platinum', 'gold', 'silver', 'bronze', 'none'];

export function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '0';
}

export function formatDonationDate(dt) {
  if (!dt) return '-';
  const raw = String(dt).trim();
  // Stable: do not re-interpret already-normalized ISO dates.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10);
}

export function buildDonatorsViewModel(donations) {
  const model = buildDonatorsModel(donations);

  const donorCount = Array.isArray(model.ranked) ? model.ranked.length : 0;

  return {
    summary: {
      totalDonorsText: formatNumber(donorCount),
      totalDonatedText: formatNumber(model.totalDonated || 0)
    },
    ranked: model.ranked.map((d, index) => ({
      placementText: `#${index + 1}`,
      name: String(d.name || '').trim(),
      totalText: formatNumber(d.total || 0),
      tierKey: d.tier,
      tierMeta: DONATOR_TIERS[d.tier] || DONATOR_TIERS.none
    })),
    recent: model.recent.map(r => ({
      dateText: formatDonationDate(r.date),
      name: String(r.name || '-').trim(),
      donation: r.donation ? String(r.donation).trim() : 'Pokéyen',
      isItemDonation: Boolean(r.donation),
      valueText: formatNumber(Number(r.value) || 0)
    })),
    tiers: DONATOR_TIER_ORDER.map(key => {
      const meta = DONATOR_TIERS[key] || DONATOR_TIERS.none;
      const count = model.tierCounts && model.tierCounts[key] ? Number(model.tierCounts[key]) : 0;
      return {
        tierKey: key,
        label: meta.label,
        desc: meta.desc,
        icon: meta.icon,
        countText: formatNumber(count)
      };
    }),
    hasData: Array.isArray(model.donations) && model.donations.length > 0
  };
}
