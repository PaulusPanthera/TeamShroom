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
  none:     { icon: '',                                      label: '',            desc: '' }
};

export function formatDonationDate(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  return isNaN(d.getTime()) ? String(dt) : d.toISOString().slice(0, 10);
}

export function buildDonatorsViewModel(donations) {
  const model = buildDonatorsModel(donations);

  return {
    ranked: model.ranked.map((d, index) => ({
      placementText: `#${index + 1}`,
      name: d.name,
      totalText: (d.total || 0).toLocaleString('en-US'),
      tierKey: d.tier,
      tierMeta: DONATOR_TIERS[d.tier] || DONATOR_TIERS.none
    })),
    recent: model.recent.map(r => ({
      dateText: formatDonationDate(r.date),
      name: r.name || '-',
      donation: r.donation || 'Pokéyen',
      valueText: (Number(r.value) || 0).toLocaleString('en-US')
    })),
    hasData: Array.isArray(model.donations) && model.donations.length > 0
  };
}
