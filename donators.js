// Utility: parse "1.234.567" or "1000000" to integer
function parseDonationValue(str) {
  return parseInt(str.replace(/\./g, "").replace(/,/g, ""));
}

// Determine donator tier
function getDonatorTier(value, isTop) {
  if (isTop) return "top";
  if (value > 50_000_000) return "diamond";
  if (value > 25_000_000) return "platinum";
  if (value > 10_000_000) return "gold";
  if (value > 5_000_000)  return "silver";
  if (value > 1_000_000)  return "bronze";
  return "";
}

// This should be called after both donations and teamShowcase are loaded
function assignDonatorTiersToTeam() {
  if (!window.donations || !window.teamShowcase) return;
  // Aggregate totals by name
  const totals = {};
  window.donations.forEach(entry => {
    const name = entry.name.trim();
    const value = parseDonationValue(entry.value);
    totals[name] = (totals[name] || 0) + value;
  });
  // Find the top donator
  let maxName = null, maxValue = 0;
  Object.entries(totals).forEach(([name, value]) => {
    if (value > maxValue) {
      maxName = name;
      maxValue = value;
    }
  });
  // Assign donator status to member objects (in teamShowcase)
  window.teamShowcase.forEach(member => {
    const value = totals[member.name] || 0;
    member.donator = getDonatorTier(value, member.name === maxName && value > 0);
    member.donationValue = value;
  });
  // Also update teamMembers if built
  if (window.teamMembers) {
    window.teamMembers.forEach(member => {
      const value = totals[member.name] || 0;
      member.donator = getDonatorTier(value, member.name === maxName && value > 0);
    });
  }
}

// Donators Page Logic
function renderDonators() {
  const content = document.getElementById('page-content');
  content.innerHTML = "<h1>Donators</h1><div id='donators-list'></div>";

  if (!window.donations || !window.teamShowcase) {
    document.getElementById('donators-list').innerHTML = "Donations or team data not loaded.";
    return;
  }

  // Aggregate totals by name
  const totals = {};
  window.donations.forEach(entry => {
    const name = entry.name.trim();
    const value = parseDonationValue(entry.value);
    totals[name] = (totals[name] || 0) + value;
  });

  // Find the top donator
  let maxName = null, maxValue = 0;
  Object.entries(totals).forEach(([name, value]) => {
    if (value > maxValue) {
      maxName = name;
      maxValue = value;
    }
  });

  // Only show names that are also in teamShowcase
  const showcaseNames = new Set(window.teamShowcase.map(m => m.name));
  let donators = Object.entries(totals)
    .filter(([name]) => showcaseNames.has(name))
    .map(([name, value]) => ({
      name,
      value,
      tier: getDonatorTier(value, name === maxName && value > 0)
    }))
    .sort((a, b) => b.value - a.value);

  // Render as table
  let html = `
    <table class="donators-table">
      <thead>
        <tr><th>Donator</th><th>Total Donated</th><th>Tier</th></tr>
      </thead>
      <tbody>
        ${donators.map(d => `
          <tr>
            <td>${d.name}</td>
            <td>${d.value.toLocaleString("en-US")}</td>
            <td class="donator-tier ${d.tier}">${d.tier ? d.tier.charAt(0).toUpperCase() + d.tier.slice(1) : ""}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  document.getElementById('donators-list').innerHTML = html;
}

// Make sure to run assignDonatorTiersToTeam once both datasets are loaded
if (window.donations && window.teamShowcase) assignDonatorTiersToTeam();
