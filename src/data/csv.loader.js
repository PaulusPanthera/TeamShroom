// src/data/csv.loader.js
// Generic CSV Loader — HARD CONTRACT
// Fetches CSV and returns array of row objects

export async function loadCSV(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${url}`);
  }

  const text = await res.text();
  const lines = text.trim().split('\n');
  if (!lines.length) return [];

  const headers = lines[0]
    .split(',')
    .map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i]?.trim() ?? '';
    });
    return row;
  });
}
