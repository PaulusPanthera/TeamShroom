// donators.js

// Utility: parse "1.234.567" or "1000000" to integer
function parseDonationValue(str) {
  return parseInt(str.replace(/\./g, "").replace(/,/g, ""));
}

// Format date as YYYY-MM-DD or locale
function formatDonationDate(dt) {
  if (!dt) return "";
  // Try to parse as ISO string
  const d = new Date(dt);
  if (!isNaN(d.getTime())) {
    // Format as YYYY-MM-DD
    return d.toISOString().slice(0, 10);
  }
  return dt;
}

// Donator tier data for icons and tooltips
const donatorTiers = {
  top:      { icon: "symbols/topdonatorsprite.png",      label: "Top Donator",    desc: "Our #1 supporter! Thank you for your incredible generosity!" },
  diamond:  { icon: "symbols/diamonddonatorsprite.png",  label: "Diamond",        desc: "Donated 50,000,000 or more. Legendary support!" },
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

// --- Helper for last N donations (latest are last in array) ---
function getLastDonations(n = 5) {
  if (!window.donations) return [];
  // If your donations have timestamps/dates, sort by them; otherwise, just take last N
  let arr = window.donations.slice();
  if (arr.length && arr[0].date) {
    arr.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  // else: assuming donation order is chronological in the JSON
  return arr.slice(0, n);
}

// --- Fixed info card for the last 5 donations ---
function renderLastDonationsCard() {
  const last = getLastDonations(5);
  return `
    <div class="last-donations-fixed-box">
      <h2>Last 5 Donations</h2>
      <div>
        <table class="last-donations-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Donator</th>
              <th>Donation</th>
            </tr>
          </thead>
          <tbody>
            ${
              last.length
                ? last.map(d => `<tr>
                  <td>${d.date ? formatDonationDate(d.date) : "-"}</td>
                  <td>${d.name}</td>
                  <td>${d.value ? parseDonationValue(d.value).toLocaleString("en-US") : (d.value || "-")}${d.item ? ` <span class="donation-item">${d.item}</span>` : ""}</td>
                </tr>`).join("")
                : `<tr><td colspan="3" style="text-align:center;color:#999;font-style:italic;">No recent donations.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Wait for donations data if not loaded yet
function renderDonatorsWhenReady() {
  const content = document.getElementById('page-content');
  if (window.donations) {
    renderDonators();
  } else {
    content.innerHTML = "<div style='text-align:center;font-size:1.1em;color:var(--accent);'>Loading donations data...</div>";
    setTimeout(renderDonatorsWhenReady, 60);
  }
}

// Donators Page Logic
function renderDonators() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="donators-top-flex">
      ${renderLastDonationsCard()}
      <div class="how-to-donate-box">
        <h2>How to Donate</h2>
        <div>
          Support Team Shroom by sending Pokéyen or items via in-game mail in <b>PokeMMO</b> to:<br>
          <span class="donate-highlight">TeamShroomBank</span>
        </div>
      </div>
    </div>
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

  // Render as table with flair and placement
  let html = `
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
        ${donators.map((d, i) => {
          const tierData = donatorTiers[d.tier];
          const rowClass = d.tier + (d.tier === "top" ? " top" : "");
          let iconHtml = "";
          if (tierData.icon) {
            iconHtml = `<img class="tier-icon" src="${tierData.icon}" alt="${tierData.label}" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span style=&quot;font-size:1.1em;margin-right:0.2em&quot;>💎</span>')">`;
          }
          return `
            <tr class="${rowClass}">
              <td class="placement">#${i + 1}</td>
              <td>${iconHtml}${d.name}</td>
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
