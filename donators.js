// Donators Page Logic

// Utility: parse "1.234.567" or "1000000" to integer
function parseDonationValue(str) {
  return parseInt(str.replace(/\./g, "").replace(/,/g, ""));
}

function renderDonators() {
  const content = document.getElementById('page-content');
  content.innerHTML = "<h1>Donators</h1><div id='donators-list'></div>";

  if (!window.donations) {
    document.getElementById('donators-list').innerHTML = "No donations data loaded.";
    return;
  }

  // Aggregate totals by name
  const totals = {};
  window.donations.forEach(entry => {
    const name = entry.name.trim();
    const value = parseDonationValue(entry.value);
    if (!totals[name]) totals[name] = 0;
    totals[name] += value;
  });

  // Convert to array and sort by value descending
  const donatorArr = Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Render as table
  let html = `
    <table class="donators-table">
      <thead>
        <tr><th>Donator</th><th>Total Donated</th></tr>
      </thead>
      <tbody>
        ${donatorArr.map(d => `
          <tr>
            <td>${d.name}</td>
            <td>${d.value.toLocaleString("en-US")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  document.getElementById('donators-list').innerHTML = html;
}
