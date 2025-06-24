// donators.js (ES module)

export function parseDonationValue(str) {
  return parseInt(str.replace(/\./g, "").replace(/,/g, ""));
}

function formatDonationDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return dt;
}

const donatorTiers = {
  top:      { icon: "img/symbols/topdonatorsprite.png",      label: "Top Donator",    desc: "Our #1 supporter! Thank you for your incredible generosity!" },
  diamond:  { icon: "img/symbols/diamonddonatorsprite.png",  label: "Diamond",        desc: "Donated 50,000,000 or more. Legendary support!" },
  platinum: { icon: "img/symbols/platinumdonatorsprite.png", label: "Platinum",       desc: "Donated 25,000,000 or more. Thank you for your amazing support!" },
  gold:     { icon: "img/symbols/golddonatorsprite.png",     label: "Gold",           desc: "Donated 10,000,000 or more. Your generosity shines bright!" },
  silver:   { icon: "img/symbols/silverdonatorsprite.png",   label: "Silver",         desc: "Donated 5,000,000 or more. Much appreciated!" },
  bronze:   { icon: "img/symbols/bronzedonatorsprite.png",   label: "Bronze",         desc: "Donated 1,000,000 or more. Thank you for being awesome!" },
  "":       { icon: "",                                      label: "",               desc: "" }
};

function getDonatorTier(value, isTop) {
  if (isTop) return "top";
  if (value >= 50_000_000) return "diamond";
  if (value >= 25_000_000) return "platinum";
  if (value >= 10_000_000) return "gold";
  if (value >= 5_000_000)  return "silver";
  if (value >= 1_000_000)  return "bronze";
  return "";
}

function getLastDonations(donations, n = 5) {
  if (!donations) return [];
  let arr = donations.slice();
  if (arr.length && arr[0].date) {
    arr.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  return arr.slice(0, n);
}

function renderLastDonationsCard(donations) {
  const last = getLastDonations(donations, 5);
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
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${
              last.length
                ? last.map(d => `<tr>
                  <td>${d.date ? formatDonationDate(d.date) : "-"}</td>
                  <td>${d.name || "-"}</td>
                  <td>${(d.donation || d.item || "").trim() ? (d.donation || d.item) : "Pokéyen"}</td>
                  <td>${d.value ? parseDonationValue(d.value).toLocaleString("en-US") : (d.value || "-")}</td>
                </tr>`).join("")
                : `<tr><td colspan="4" style="text-align:center;color:#999;font-style:italic;">No recent donations.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderDonatorsWhenReady(donations) {
  const content = document.getElementById('page-content');
  if (donations) {
    renderDonators(donations);
  } else {
    content.innerHTML = "<div style='text-align:center;font-size:1.1em;color:var(--accent);'>Loading donations data...</div>";
    setTimeout(() => renderDonatorsWhenReady(donations), 60);
  }
}

export function renderDonators(donations) {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="donators-top-flex">
      ${renderLastDonationsCard(donations)}
      <div class="how-to-donate-box" id="how-to-donate-box">
        <h2>How to Donate</h2>
        <div>
          Support Team Shroom by sending Pokéyen or items via in-game mail in <b>PokeMMO</b> to:<br>
          <span class="donate-highlight">TeamShroomBank</span>
        </div>
      </div>
    </div>
    <div id='donators-list'></div>
  `;

  // Make both boxes the same height
  setTimeout(() => {
    const donateBox = document.getElementById("how-to-donate-box");
    const lastBox = document.querySelector(".last-donations-fixed-box");
    if (donateBox && lastBox) {
      const targetHeight = Math.max(donateBox.offsetHeight, lastBox.offsetHeight);
      donateBox.style.minHeight = targetHeight + "px";
      lastBox.style.minHeight = targetHeight + "px";
    }
  }, 30);

  if (!donations) {
    document.getElementById('donators-list').innerHTML = "Donations data not loaded.";
    return;
  }

  const totals = {};
  donations.forEach(entry => {
    const name = entry.name.trim();
    const value = parseDonationValue(entry.value);
    totals[name] = (totals[name] || 0) + value;
  });

  let maxName = null, maxValue = 0;
  Object.entries(totals).forEach(([name, value]) => {
    if (value > maxValue) {
      maxName = name;
      maxValue = value;
    }
  });

  let donators = Object.entries(totals)
    .map(([name, value]) => ({
      name,
      value,
      tier: getDonatorTier(value, name === maxName && value > 0)
    }))
    .sort((a, b) => b.value - a.value);

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
          // CHANGE: Remove inline style for background/color, use a class for bold only
          return `
            <tr class="${rowClass}">
              <td class="placement">#${i + 1}</td>
              <td>${iconHtml}${d.name}</td>
              <td class="total-donated">${d.value.toLocaleString("en-US")}</td>
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

// Returns donator tier for a given name (or "" if not a donator)
export function getDonatorTierByName(name, donations) {
  if (!donations) return "";
  let total = 0;
  donations.forEach(entry => {
    if (entry.name.trim().toLowerCase() === name.trim().toLowerCase()) {
      total += parseDonationValue(entry.value);
    }
  });
  // Is this the top donator?
  let maxValue = 0, maxName = "";
  let totals = {};
  donations.forEach(entry => {
    let n = entry.name.trim();
    let v = parseDonationValue(entry.value);
    totals[n] = (totals[n] || 0) + v;
    if (totals[n] > maxValue) {
      maxValue = totals[n];
      maxName = n;
    }
  });
  const isTop = maxName.trim().toLowerCase() === name.trim().toLowerCase() && total > 0;
  return getDonatorTier(total, isTop);
}

// Assign donator tier to each member in teamShowcase/teamMembers (for card rendering)
export function assignDonatorTiersToTeam(teamShowcase, teamMembers, donations) {
  if (!teamShowcase || !donations || !getDonatorTierByName) return;
  for (const member of teamShowcase) {
    member.donator = getDonatorTierByName(member.name, donations);
  }
  if (teamMembers) {
    for (const member of teamMembers) {
      member.donator = getDonatorTierByName(member.name, donations);
    }
  }
}
