// donators.js

// Utility: parse "1.234.567" or "1000000" to integer
function parseDonationValue(str) {
  return parseInt(str.replace(/\./g, "").replace(/,/g, ""));
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

// --- New: helper for last N donations (latest are last in array) ---
function getLastDonations(n = 5) {
  if (!window.donations) return [];
  // If your donations have timestamps, sort by it, else just take last N
  return window.donations.slice(-n).reverse();
}

// --- Tooltip generation for last 5 donations ---
function renderLastDonationsTooltip() {
  const last = getLastDonations(5);
  if (!last.length) return "<div class='last-donations-empty'>No recent donations.</div>";
  return `
    <div class="last-donations-tooltip-content">
      <strong>Last 5 Donations</strong>
      <ul>
        ${last.map(d => `<li><span class="donor-name">${d.name}</span> <span class="donor-value">${parseDonationValue(d.value).toLocaleString("en-US")}</span></li>`).join("")}
      </ul>
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
      <div class="last-donations-box">
        <button class="last-donations-btn" tabindex="0" aria-label="Show last 5 donations">
          🪙
        </button>
        <div class="last-donations-tooltip">
          ${renderLastDonationsTooltip()}
        </div>
      </div>
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

  // Tooltip hover/click logic
  const btn = document.querySelector(".last-donations-btn");
  const tip = document.querySelector(".last-donations-tooltip");
  btn.addEventListener("mouseenter", () => tip.classList.add("show"));
  btn.addEventListener("focus", () => tip.classList.add("show"));
  btn.addEventListener("mouseleave", () => tip.classList.remove("show"));
  btn.addEventListener("blur", () => tip.classList.remove("show"));
  btn.addEventListener("click", () => tip.classList.toggle("show"));

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
