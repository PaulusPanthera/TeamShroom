export const shinyWeeklySchema = [
  { key: 'week', required: true },
  { key: 'week_label', required: true },
  { key: 'date_start', required: true },
  { key: 'date_end', required: true },

  { key: 'ot', required: true },
  { key: 'pokemon', required: true },

  { key: 'method' },
  { key: 'encounter', type: 'number' },

  { key: 'secret', type: 'boolean' },
  { key: 'alpha', type: 'boolean' },
  { key: 'run', type: 'boolean' },
  { key: 'lost', type: 'boolean' },

  { key: 'clip' },
  { key: 'notes' }
];
