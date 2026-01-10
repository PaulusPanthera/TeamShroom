import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';

const CSV_URL = process.env.SHINYSHOWCASE_CSV;

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

const normalized = rows.map(row => ({
  member: row.member,
  pokemon: row.pokemon,
  caught_at: row.caught_at,
}));

await writeJson('data/shinyshowcase.json', normalized);
