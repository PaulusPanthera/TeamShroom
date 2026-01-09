// shinyweekly.loader.js
// Loads and sanitizes Shiny Weekly data from Google Sheets CSV
// HARD CONTRACT: only real shiny rows survive

export async function loadShinyWeeklyFromCSV(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch Shiny Weekly CSV');
  }

  const text = await res.text();
  return parseCSV(text);
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0]
    .replace(/\r/g, '')
    .split(',')
    .map(h => h.trim());

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = splitCSVLine(line);
    const row = {};

    headers.forEach((h, idx) => {
      let v = values[idx] ?? '';

      if (typeof v === 'string') {
        v = v.replace(/\r/g, '').trim();
      }

      if (v === 'TRUE') v = true;
      else if (v === 'FALSE') v = false;

      row[h] = v;
    });

    // HARD FILTER: real shiny rows only
    if (!row.ot || !row.pokemon) continue;

    rows.push(row);
  }

  return rows;
}

/**
 * Handles commas inside quoted CSV values
 */
function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
