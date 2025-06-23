import json
import csv

with open('teamshowcase.json', encoding='utf-8') as f:
    data = json.load(f)

header = ["name", "status", "donator", "shiny_name", "egg", "lost", "safari", "secret", "event", "clip_url"]
rows = []

for member in data:
    for shiny in member.get("shinies", []):
        row = [
            member.get("name", ""),
            member.get("status", ""),
            member.get("donator", ""),
            shiny.get("name", ""),
            "1" if shiny.get("egg") else "",
            "1" if shiny.get("lost") else "",
            "1" if shiny.get("safari") else "",
            "1" if shiny.get("secret") else "",
            "1" if shiny.get("event") else "",
            shiny.get("clip", ""),
        ]
        rows.append(row)

with open('teamshowcase_for_sheets.csv', 'w', encoding='utf-8', newline='') as out:
    writer = csv.writer(out)
    writer.writerow(header)
    writer.writerows(rows)
