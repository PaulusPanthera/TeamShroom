import { parse } from 'csv-parse/sync';

export function parseCsv(csvText) {
  return parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}
