export const shinyShowcaseSchema = [
  { key: 'date_catch', required: true },
  { key: 'ot', required: true },
  { key: 'pokemon', required: true },
  { key: 'method' },
  { key: 'encounter', type: 'number' },

  { key: 'secret', type: 'boolean' },
  { key: 'alpha', type: 'boolean' },
  { key: 'run', type: 'boolean' },
  { key: 'lost', type: 'boolean' },
  { key: 'sold', type: 'boolean' },
  { key: 'favorite', type: 'boolean' },

  { key: 'clip' },
  { key: 'notes' }
];
