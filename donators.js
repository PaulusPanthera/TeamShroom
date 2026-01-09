// donators.js
// Donators — data + table rendering (Design System v1 stabilized)

/* ---------------------------------------------------------
   PARSING & FORMATTING
--------------------------------------------------------- */

export function parseDonationValue(str) {
  if (!str) return 0;
  return parseInt(String(str).replace(/[.,]/g, ''), 10) || 0;
}

function formatDonationDate(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  return isNaN(d.getTime()) ? dt : d.toISOString().slice(0, 10);
}

/* ---------------------------------------------------------
   TIERS
--------------------------------------------------------- */

const DONATOR_TIERS = {
  top:      { icon: 'img/symbols/topdonatorsprite.png',      label: 'Top Donator', desc: 'Our #1 supporter.' },
  diamond:  { icon: 'img/symbols/diamonddonatorsprite.png',  label: 'Diamond',     desc: '50,000,000+ donated.' },
  platinum: { icon: 'img/symbols/platinumdonatorsprite.png', label: 'Platinum',    desc: '25,000,000+ donated.' },
  gold:     { icon: 'img/symbols/golddonatorsprite.png',     label: 'Gold',        desc: '10,000,000+ donated.' },
  silver:   { icon: 'img/symbols/silverdonatorsprite.png',   label: 'Silver',      desc: '5,000,000+ donated.' },
  bronze:   { icon: 'img/symbols/bronzedonatorsprite.png',   label: 'Bronze',      desc: '1,000,000+ donated.' },
  none:     { icon: '',                                     label: '',            desc: '' }
};

function resolveTier(total, isTop) {
  if (isTop) return 'top';
  if (total >= 50_000_000) return 'diamond';
  if (total >= 25_000_000) return 'platinum';
  if (total >= 10_000_000) return 'gold';
  if (total >= 5_000_000)  return 'silver';
  if (total >= 1_000_000)  return 'bronze';
  return 'none';
}

/* ---------------------------------------------------------
   AGGREGATION
--------------------------------------------------------- */

function aggregateTotals(donations) {
  const totals = {};
  donations.forEach(d => {
    const name = d.name?.trim();
    if (!name) return;
    totals[name] = (totals[name] || 0) + parseDonationValue(d.value);
  });
  return totals;
}

function getTopDonator(totals) {
  let topName = null;
  let topValue = 0;
  Object.entries(totals).forEach(([name, value]) => {
    if (value > topValue) {
      topName = name;
      topValue = value;
    }
  });
  return topName;
}

function getRecentDonations(donations, limit = 5) {
  return [...donations]
    .filter(d => d.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

/* ---------------------------------------------------------
   RENDERING
--------------------------------------------------------- */

function renderLastDonations(donations) {
  const recent = getRecentDonations(donations);

  const rows = recent.length
    ? recent.map(d => `
        <tr>
          <td>${formatDonationDate(d.date)}</td>
          <td>${d.name || '-'}</td>
          <td>${(d.donation || d.item || 'Pokéyen')}</td>
          <td>${parseDonationValue(d.value).toLocaleString('en-US')}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="4" style="text-align:center;opacity:0.6;">No recent donations.</td></tr>`;

  return `
    <div class="last-donations-fixed-box">
      <h2>Last Donations</h2>
      <table class="last-donations-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Donator</th>
            <th>Donation</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

export function renderDonators(donations) {
  const content = document.getElementById('page-content');
  if (!donations || !donations.length) {
    content.innerHTML = '<div style="text-align:center;">No donation data.</div>';
    return;
  }

  const totals = aggregateTotals(donations);
  const topName = getTopDonator(totals);

  const ranked = Object.entries(totals)
    .map(([name, value]) => ({
      name,
      value,
      tier: resolveTier(value, name === topName && value > 0)
    }))
    .sort((a, b) => b.value - a.value);

  content.innerHTML = `
    <div class="donators-top-flex">
      ${renderLastDonations(donations)}
      <div class="how-to-donate-box">
        <h2>How to Donate</h2>
        <div>
          Send Pokéyen or items via in-game mail in <b>PokeMMO</b> to:
          <div class="donate-highlight">TeamShroomBank</div>
        </div>
      </div>
    </div>

    <table class="donators-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Donator</th>
          <th>Total Donated</th>
          <th>Tier</th>
        </tr>
      </thead>
      <tbody>
        ${ranked.map((d, i) => {
          const tier = DONATOR_TIERS[d.tier];
          return `
            <tr class="${d.tier}">
              <td class="placement">#${i + 1}</td>
              <td>
                ${tier.icon ? `<img class="tier-icon" src="${tier.icon}" alt="">` : ''}
                ${d.name}
              </td>
              <td>${d.value.toLocaleString('en-US')}</td>
              <td class="donator-tier donator-tier-tooltip">
                ${tier.label}
                ${tier.desc ? `<span class="tooltip-text">${tier.desc}</span>` : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

/* ---------------------------------------------------------
   MUTATION HELPERS
--------------------------------------------------------- */

// Assigns donator tier onto existing member objects (explicit mutation)
export function assignDonatorTiersToTeam(teamShowcase, teamMembers, donations) {
  if (!donations) return;

  const totals = aggregateTotals(donations);
  const topName = getTopDonator(totals);

  function assign(member) {
    const total = totals[member.name] || 0;
    member.donator = resolveTier(total, member.name === topName && total > 0);
  }

  teamShowcase?.forEach(assign);
  teamMembers?.forEach(assign);
}
