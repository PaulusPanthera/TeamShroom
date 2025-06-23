// donators.js

// Utility: parse "1.234.567" or "1000000" to integer
function parseDonationValue(str) {
  return parseInt(str.replace(/\./g, "").replace(/,/g, ""));
}

// Donator tier data for icons and tooltips
const donatorTiers = {
  top:      { icon: "symbols/topdonatorsprite.png",      label: "Top Donator",    desc: "Our #1 supporter! Thank you for your incredible generosity!" },
  diamond:  { icon: "symbols/diamondshroomsprite.png",   label: "Diamond",        desc: "Donated 50,000,000 or more. Legendary support!" },
  platinum: { icon: "symbols/platinumdonatorsprite.png", label: "Platinum",       desc: "Donated 25,000,000 or more. Thank you for your amazing support!" },
  gold:     { icon: "symbols/golddonatorsprite.png",     label: "Gold",           desc: "Donated 10,000,000 or more. Your generosity shines bright!" },
  silver:   { icon: "symbols/silverdonatorsprite.png",   label: "Silver",         desc: "Donated 5,000,000 or more. Much appreciated!" },
  bronze:   { icon: "symbols/bronzedonatorsprite.png",   label: "Bronze",         desc: "Donated 1,000,000 or more. Thank you for being awesome!" },
  "":       { icon: "",                                  label: "",               desc: "" }
};

// Determine donator tier
function getDonatorTier(value, isTop) {
  if (isTop) return "top";
  if (value >= 50_000_000) return "diamond";
  if (value >= 25_000_000) return "platinum";
  if (value >= 10_000_000) return "gold";
  if (value >= 5_000_000)  return "silver";
  if (value >= 1_000_000)  return "bronze";
  return "";
}

// Donators Page Logic
function renderDonators() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <a class="how-to-donate-btn" href="mailto:TeamShroomBank?subject=Donation%20to%20Team%20Shroom%20Bank">
      💸 How to Donate
    </a>
    <div id='donators-list'></div>
  `;

  if (!window.donations) {
    document.getElementById('donators-list').innerHTML = "Donations data not loaded.";
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

  // Prepare donator list (all, not just teamshowcase)
  let donators = Object.entries(totals)
    .map(([name, value]) => ({
      name,
      value,
      tier: getDonatorTier(value, name === maxName && value > 0)
    }))
    .sort((a, b) => b.value - a.value);

  // Render as table with flair
  let html = `
    <table class="donators-table">
      <thead>
        <tr><th>Donator</th><th>Total Donated</th><th>Tier</th></tr>
      </thead>
      <tbody>
        ${donators.map((d, i) => {
          const tierData = donatorTiers[d.tier];
          const rowClass = d.tier + (d.tier === "top" ? " top" : "");
          return `
            <tr class="${rowClass}">
              <td>${tierData.icon ? `<img class="tier-icon" src="${tierData.icon}" alt="${tierData.label}">` : ""}${d.name}</td>
              <td>${d.value.toLocaleString("en-US")}</td>
              <td class="donator-tier donator-tier-tooltip">
                ${tierData.label}
                ${tierData.desc ? `<span class="tooltip-text">${tierData.desc}</span>` : ""}
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  document.getElementById('donators-list').innerHTML = html;
}

// Optional: assignDonatorTiersToTeam remains unchanged for other uses
