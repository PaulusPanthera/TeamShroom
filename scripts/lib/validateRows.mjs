// scripts/lib/validateRows.mjs
// CI-level schema validation engine
// Fails hard with precise sheet / row / column context

export function validateRows({ rows, schema, sheet }) {
  if (!Array.isArray(rows)) {
    throw new Error(`[${sheet}] CSV rows must be an array`);
  }

  rows.forEach((row, index) => {
    const rowNum = index + 2; // CSV header offset

    // -----------------------------------------------------
    // REQUIRED FIELDS
    // -----------------------------------------------------

    schema.required.forEach(field => {
      const value = row[field];

      if (value === undefined || String(value).trim() === '') {
        throw new Error(
          `[${sheet}] Row ${rowNum}, Column "${field}": required field missing`
        );
      }
    });

    // -----------------------------------------------------
    // FIELD RULES
    // -----------------------------------------------------

    Object.entries(schema.fields).forEach(([field, rule]) => {
      const value = row[field];

      // Optional / empty handling
      if (value === undefined || value === '') {
        if (rule.optional || rule.allowEmpty) return;
        return;
      }

      // Type: boolean
      if (rule.type === 'boolean') {
        if (value !== 'TRUE' && value !== 'FALSE') {
          throw new Error(
            `[${sheet}] Row ${rowNum}, Column "${field}": expected TRUE or FALSE, got "${value}"`
          );
        }
      }

      // Type: number
      if (rule.type === 'number') {
        const num = Number(value);
        if (!Number.isFinite(num)) {
          throw new Error(
            `[${sheet}] Row ${rowNum}, Column "${field}": expected number, got "${value}"`
          );
        }
      }

      // Type: string
      if (rule.type === 'string') {
        if (typeof value !== 'string') {
          throw new Error(
            `[${sheet}] Row ${rowNum}, Column "${field}": expected string`
          );
        }
      }

      // Enum
      if (rule.type === 'enum') {
        const v = String(value).toLowerCase().trim();
        if (!rule.values.includes(v)) {
          throw new Error(
            `[${sheet}] Row ${rowNum}, Column "${field}": invalid value "${value}", expected one of [${rule.values.join(
              ', '
            )}]`
          );
        }
      }
    });
  });
}
