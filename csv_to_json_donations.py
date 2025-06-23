import csv
import json
import re

# Set your input and output file names
csv_file = 'donations.csv'
json_file = 'donations.json'

def is_data_row(row):
    # Checks if the row looks like a proper data row (starts with a date in yyyy-mm-dd format)
    return re.match(r'^\d{4}-\d{2}-\d{2}$', row[0].strip())

donations = []

with open(csv_file, encoding="utf-8") as f:
    reader = csv.reader(f, delimiter='\t')
    for row in reader:
        if len(row) < 4:
            # If tabs missing, try splitting by spaces
            row = re.split(r'\s+', '\t'.join(row))
        row = [x.strip() for x in row]
        if len(row) < 4:  # Not enough columns
            continue
        if not is_data_row(row):
            continue
        date, name, donation, value = row[0], row[1], row[2], row[3]
        # Remove commas and spaces from value, but preserve dots as thousand separators
        # If you want to normalize numbers to int, use: int(value.replace('.', '').replace(',', ''))
        donations.append({
            "date": date,
            "name": name,
            "donation": donation,
            "value": value
        })

with open(json_file, "w", encoding="utf-8") as f:
    json.dump(donations, f, indent=2, ensure_ascii=False)

print(f"Done! Wrote {len(donations)} entries to {json_file}")
