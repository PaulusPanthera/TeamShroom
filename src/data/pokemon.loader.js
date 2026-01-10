// src/data/pokemon.loader.js
// CSV loader — generic, strict, no side effects

export async function loadPokemonFromCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load Pokémon CSV');

  const text = await res.text();
  const lines = text.split('\n').filter(Boolean);

  if (!lines.length) return [];

  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i]?.trim() ?? '';
    });
    return row;
  });
}
