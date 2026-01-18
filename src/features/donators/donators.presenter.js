// src/features/donators/donators.presenter.js
// v2.0.0-beta
// Donators presenter (builds deterministic view model for leaderboard + recent)

import {
  buildDonatorsModel,
  getRecentDonations
} from '../../domains/donators/donators.model.js';

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

  // Keep already-normalized dates stable (most common)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // Fallback: parse + emit YYYY-MM-DD when possible
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10);
}

function formatRank(index) {
  return `#${String(index + 1).padStart(2, '0')}`;
}

function buildRecentDonationText(row) {
  return row?.donation ? String(row.donation).trim() : 'Pokéyen';
}

/**
 * Input: Array<{ date: string, name: string, donation: string|null, value: number }>
 * Output: Presenter view model
 */
export function buildDonatorsViewModel(rows) {
  const model = buildDonatorsModel(rows);

  const ranked = Array.isArray(model.ranked) ? model.ranked : [];
  const donations = Array.isArray(model.donations) ? model.donations : [];

  const donorCount = ranked.length;
  const totalDonated = Number(model.totalDonated) || 0;

  // Deterministic sorting is delegated to the domain helper
  const recentRows = getRecentDonations(donations, 20);

  return {
    summary: {
      totalDonorsText: formatNumber(donorCount),
      totalDonatedText: formatNumber(totalDonated)
    },

    // UI naming: leaderboard + recent
    leaderboard: ranked.map((d, index) => {
      const tierKey = d?.tier || 'none';
      const meta = DONATOR_TIERS[tierKey] || DONATOR_TIERS.none;

      return {
        placementText: formatRank(index),
        nameText: d?.name ? String(d.name) : '',
        totalText: formatNumber(d?.total || 0),
        tierKey,
        tierLabel: meta.label,
        tierIcon: meta.icon,
        tierDesc: meta.desc
      };
    }),

    recent: recentRows.map(r => ({
      dateText: formatDonationDate(r.date),
      nameText: r?.name ? String(r.name) : '',
      typeLabel: r?.donation ? 'Item' : 'Pokéyen',
      donationText: buildRecentDonationText(r),
      valueText: formatNumber(r?.value || 0),
      isItem: Boolean(r?.donation)
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

    hasData: donations.length > 0
  };
}
