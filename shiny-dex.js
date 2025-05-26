// Example static Shiny Dex data (replace with your team's real data!)
const shinyDex = [
  { name: "Bulbasaur", caught: false },
  { name: "Charmander", caught: true },
  { name: "Squirtle", caught: false },
  // ...add your team's targets!
];

// Render the shiny dex list
function renderShinyDex(dex) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';
  dex.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'dex-entry' + (entry.caught ? ' caught' : '');
    div.innerHTML = `
      <span class="dex-name">${entry.name}</span>
      <span>${entry.caught ? '✅' : '❌'}</span>
    `;
    container.appendChild(div);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => renderShinyDex(shinyDex));
