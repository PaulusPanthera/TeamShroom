import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';

const CSV_URL = process.env.SHINY_WEEKLY_CSV;

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

/*
  Temporary normalization:
  - Pass data through mostly unchanged
  - Explicit mapping prevents accidental column drift
  - Real validation comes later
*/

const normalized = rows.map(row => ({
  week: row.week,
  member: row.member,
  pokemon: row.pokemon,
  date: row.date,
}));

await writeJson('data/shinyweekly.json', normalized);
