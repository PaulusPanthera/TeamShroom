// shinyweekly.loader.js
// Loads Shiny Weekly data from Google Sheets CSV

export async function loadShinyWeeklyFromCSV(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch Shiny Weekly CSV');
  }

  const text = await res.text();
  return parseCSV(text);
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    const row = {};

    headers.forEach((h, idx) => {
      let v = values[idx] ?? '';

      // normalize booleans
      if (v === 'TRUE') v = true;
      else if (v === 'FALSE') v = false;

      row[h] = v;
    });

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
