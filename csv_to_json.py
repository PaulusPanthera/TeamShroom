import csv
import json
from collections import defaultdict

# Change this to your CSV file path
csv_file = 'teamshowcase_for_sheets.csv'
json_file = 'teamshowcase.json'

members = defaultdict(lambda: {"status": "", "donator": "", "shinies": []})

with open(csv_file, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        mname = row['name']
        if row.get('status'): members[mname]["status"] = row['status']
        if row.get('donator'): members[mname]["donator"] = row['donator']
        shiny = {"name": row['shiny_name']}
        if row.get('egg'): shiny["egg"] = True
        if row.get('lost'): shiny["lost"] = True
        if row.get('safari'): shiny["safari"] = True
        if row.get('secret'): shiny["secret"] = True
        if row.get('event'): shiny["event"] = True
        if row.get('clip_url'): shiny["clip"] = row['clip_url']
        members[mname]["shinies"].append(shiny)

# Convert defaultdict to list of dicts
result = []
for name, data in members.items():
    d = {"name": name, "status": data["status"], "donator": data["donator"], "shinies": data["shinies"]}
    result.append(d)

with open(json_file, 'w', encoding='utf-8') as out:
    json.dump(result, out, indent=2)
