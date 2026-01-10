import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';

const CSV_URL = process.env.POKEMON_CSV;

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

const normalized = rows.map(row => ({
  id: row.id,
  name: row.name,
  generation: row.generation,
}));

await writeJson('data/pokemon.json', normalized);
