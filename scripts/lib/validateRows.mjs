// scripts/lib/validateRows.mjs
// CI-level schema validation engine
// Throws hard errors with sheet / row / column context

export function validateRows({ rows, schema, sheet }) {
  if (!Array.isArray(rows)) {
    throw new Error(`[${sheet}] CSV rows must be an array`);
  }

  rows.forEach((row, index) => {
    const rowNum = index + 2; // CSV header offset

    // required fields
    schema.required.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        throw new Error(
          `[${sheet}] Row ${rowNum}: missing required field "${field}"`
        );
      }
    });

    // field rules
    Object.entries(schema.fields).forEach(([field, rule]) => {
      const value = row[field];

      if (value === undefined || value === '') {
        if (rule.optional) return;
        if (rule.allowEmpty) return;
      }

      if (rule.type === 'boolean') {
        if (value !== 'TRUE' && value !== 'FALSE') {
          throw new Error(
            `[${sheet}] Row ${rowNum}, column "${field}": expected TRUE/FALSE`
          );
        }
      }

      if (rule.type === 'enum') {
        const v = String(value).toLowerCase().trim();
        if (!rule.values.includes(v)) {
          throw new Error(
            `[${sheet}] Row ${rowNum}, column "${field}": invalid value "${value}"`
          );
        }
      }

      if (rule.type === 'string') {
        if (typeof value !== 'string') {
          throw new Error(
            `[${sheet}] Row ${rowNum}, column "${field}": expected string`
          );
        }
      }
    });
  });
}
