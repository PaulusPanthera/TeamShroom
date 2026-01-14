// src/features/donators/donators.ui.js
// Donators — UI renderer (DOM-only)

function renderLastDonations(recent) {
  const rows = (recent && recent.length)
    ? recent.map(d => `
        <tr>
          <td>${d.dateText}</td>
          <td>${d.name}</td>
          <td>${d.donation}</td>
          <td>${d.valueText}</td>
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

export function renderDonatorsPage(viewModel) {
  const content = document.getElementById('page-content');

  if (!viewModel || !viewModel.hasData) {
    content.innerHTML = '<div style="text-align:center;">No donation data.</div>';
    return;
  }

  content.innerHTML = `
    <div class="donators-top-flex">
      ${renderLastDonations(viewModel.recent)}
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
        ${viewModel.ranked.map(d => {
          const tier = d.tierMeta;
          return `
            <tr class="${d.tierKey}">
              <td class="placement">${d.placementText}</td>
              <td>
                ${tier.icon ? `<img class="tier-icon" src="${tier.icon}" alt="">` : ''}
                ${d.name}
              </td>
              <td>${d.totalText}</td>
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
