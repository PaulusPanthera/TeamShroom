export function validateRows({
  rows,
  schema,
  sheetName
}) {
  const errors = [];

  rows.forEach((row, rowIndex) => {
    schema.forEach(rule => {
      const value = row[rule.key];

      // Required
      if (rule.required && (value === undefined || value === '')) {
        errors.push(error(sheetName, rowIndex, rule.key, 'required'));
        return;
      }

      if (value === undefined || value === '') return;

      // Type
      if (rule.type === 'number' && isNaN(Number(value))) {
        errors.push(error(sheetName, rowIndex, rule.key, 'number'));
      }

      if (rule.type === 'boolean' &&
          !['TRUE','FALSE',true,false].includes(value)) {
        errors.push(error(sheetName, rowIndex, rule.key, 'boolean'));
      }

      // Enum
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(error(
          sheetName,
          rowIndex,
          rule.key,
          `enum (${rule.enum.join(', ')})`
        ));
      }

      // Custom
      if (rule.validate && !rule.validate(value, row)) {
        errors.push(error(
          sheetName,
          rowIndex,
          rule.key,
          rule.message || 'custom rule failed'
        ));
      }
    });
  });

  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
}

function error(sheet, row, col, msg) {
  return `[${sheet}] Row ${row + 2}, Column "${col}": ${msg}`;
}
