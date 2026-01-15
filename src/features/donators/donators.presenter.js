// src/features/donators/donators.presenter.js
// v2.0.0-beta
// Donators presenter (builds deterministic view model for sidebar, leaderboard, and recent list)

import { buildDonatorsModel } from '../../domains/donators/donators.model.js';

export const DONATOR_TIERS = {
  top: {
    icon: 'img/symbols/topdonatorsprite.png',
    label: 'Top Donator',
    desc: 'Top overall donator.'
  },
  diamond: {
    icon: 'img/symbols/diamonddonatorsprite.png',
    label: 'Diamond',
    desc: '50,000,000+ total donated.'
  },
  platinum: {
    icon: 'img/symbols/platinumdonatorsprite.png',
    label: 'Platinum',
    desc: '25,000,000+ total donated.'
  },
  gold: {
    icon: 'img/symbols/golddonatorsprite.png',
    label: 'Gold',
    desc: '10,000,000+ total donated.'
  },
  silver: {
    icon: 'img/symbols/silverdonatorsprite.png',
    label: 'Silver',
    desc: '5,000,000+ total donated.'
  },
  bronze: {
    icon: 'img/symbols/bronzedonatorsprite.png',
    label: 'Bronze',
    desc: '1,000,000+ total donated.'
  },
  none: {
    icon: '',
    label: 'Supporter',
    desc: 'Below 1,000,000 total donated.'
  }
};

export const DONATOR_TIER_ORDER = ['top', 'diamond', 'platinum', 'gold', 'silver', 'bronze', 'none'];

export const DONATOR_TIER_THRESHOLDS = {
  top: 'Top 1',
  diamond: '50,000,000+',
  platinum: '25,000,000+',
  gold: '10,000,000+',
  silver: '5,000,000+',
  bronze: '1,000,000+'
};

export function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '0';
}

export function formatDonationDate(dt) {
  if (!dt) return '-';
  const raw = String(dt).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10);
}

function safeDateMs(input) {
  const ms = Date.parse(String(input || ''));
  return Number.isFinite(ms) ? ms : 0;
}

function buildRecentList(donations, limit) {
  const list = Array.isArray(donations) ? donations : [];
  return [...list]
    .filter(d => d && d.date)
    .sort((a, b) => safeDateMs(b.date) - safeDateMs(a.date))
    .slice(0, limit);
}

function formatRank(index) {
  return `#${String(index + 1).padStart(2, '0')}`;
}

function buildRecentDonationText(row) {
  return row?.donation ? String(row.donation).trim() : 'Pokéyen';
}

export function buildDonatorsViewModel(donations) {
  const model = buildDonatorsModel(donations);
  const donorCount = Array.isArray(model.ranked) ? model.ranked.length : 0;
  const recent = buildRecentList(model.donations, 20);

  return {
    summary: {
      totalDonorsText: formatNumber(donorCount),
      totalDonatedText: formatNumber(model.totalDonated || 0)
    },

    ranked: (Array.isArray(model.ranked) ? model.ranked : []).map((d, index) => {
      const tierKey = d?.tier || 'none';
      return {
        placementText: formatRank(index),
        name: d?.name || '',
        totalText: formatNumber(d?.total || 0),
        tierKey,
        tierMeta: DONATOR_TIERS[tierKey] || DONATOR_TIERS.none
      };
    }),

    recent: recent.map(r => ({
      dateText: formatDonationDate(r.date),
      name: r.name || '',
      typeLabel: r.donation ? 'Item' : 'Pokéyen',
      donationText: buildRecentDonationText(r),
      valueText: formatNumber(r.value || 0),
      isItem: Boolean(r.donation)
    })),

    tiers: ['top', 'diamond', 'platinum', 'gold', 'silver', 'bronze'].map(key => {
      const meta = DONATOR_TIERS[key];
      const count = model.tierCounts?.[key] || 0;
      return {
        key,
        label: meta.label,
        icon: meta.icon,
        thresholdText: DONATOR_TIER_THRESHOLDS[key],
        countText: formatNumber(count)
      };
    }),

    hasData: Array.isArray(model.donations) && model.donations.length > 0
  };
}
