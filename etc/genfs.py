import json
import os
from pathlib import Path
from datetime import datetime
from xml.etree.ElementTree import Element, SubElement, ElementTree

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
MD_DIR = ROOT / "md"

INDEX_FILE = BASE / "index.json"
RSS_FILE = ROOT / "rss.xml"

posts = []

for file in MD_DIR.iterdir():

    if file.suffix != ".md":
        continue

    text = file.read_text(encoding="utf-8").splitlines()

    title = file.stem
    tags = []

    for line in text:

        if line.startswith("# "):
            title = line.replace("# ", "").strip()
            break

    for line in text:

        if line.lower().startswith("tags:"):
            tags = [t.strip() for t in line.split(":")[1].split(",")]
            break

    stat = file.stat()
    created = datetime.fromtimestamp(stat.st_ctime)

    posts.append({
        "file": file.name,
        "title": title,
        "tags": tags,
        "date": created.isoformat()
    })

posts.sort(key=lambda x: x["date"], reverse=True)

with open(INDEX_FILE, "w") as f:
    json.dump(posts, f, indent=2)

rss = Element("rss")
rss.set("version","2.0")

channel = SubElement(rss,"channel")

SubElement(channel,"title").text = "pxwo blog"
SubElement(channel,"link").text = "https://pxvault.site"
SubElement(channel,"description").text = "markdown blog"

for p in posts:

    item = SubElement(channel,"item")

    SubElement(item,"title").text = p["title"]
    SubElement(item,"link").text = f"?post={p['file']}"
    SubElement(item,"pubDate").text = p["date"]

ElementTree(rss).write(RSS_FILE,encoding="utf-8",xml_declaration=True)

print("generated index.json and rss.xml")
