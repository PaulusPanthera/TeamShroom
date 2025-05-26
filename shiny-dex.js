// Sample Shiny Dex data for the first few Pokémon
const shinyDex = [
  { id: 1, claimedBy: null },
  { id: 4, claimedBy: "Ash" },
  { id: 7, claimedBy: null },
  // Add more from Gen 1 to Gen 5
];

// Helper to get Pokémon name (you can add a lookup table if you want real names)
function getPokemonName(id) {
  return `#${id}`;
}

// Render the shiny dex list
function renderShinyDex(dex) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';
  dex.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'dex-entry' + (entry.claimedBy ? ' claimed' : '');
    const gifUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${entry.id}.gif`;

    div.innerHTML = `
      <img src="${gifUrl}" alt="Pokemon ${entry.id}" class="pokemon-gif">
      <div class="pokemon-name">${getPokemonName(entry.id)}</div>
      <div class="claim-status">${entry.claimedBy ? `Claimed by ${entry.claimedBy}` : 'Unclaimed'}</div>
    `;
    container.appendChild(div);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => renderShinyDex(shinyDex));
