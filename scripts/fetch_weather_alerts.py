#!/usr/bin/env python3
"""Build a country-aware cache of active official European weather warnings.

MeteoAlarm Atom feeds are maintained by EUMETNET. This cache keeps the source
warning geography intact; Swasthya never treats a country/region warning as a
user-selected proximity-radius warning.
"""
from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import feedparser
import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "weather-alerts.json"
BASE = "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-"
TIMEOUT = 12
UA = "Swasthya-weather-warning-cache/1.0 (+https://github.com/Utpal-Mishra/Swasthya)"

COUNTRIES = {
    "AD":"andorra","AT":"austria","BE":"belgium","BA":"bosnia-herzegovina",
    "BG":"bulgaria","HR":"croatia","CY":"cyprus","CZ":"czechia","DK":"denmark",
    "EE":"estonia","FI":"finland","FR":"france","DE":"germany","GR":"greece",
    "HU":"hungary","IS":"iceland","IE":"ireland","IL":"israel","IT":"italy",
    "LV":"latvia","LT":"lithuania","LU":"luxembourg","MT":"malta","MD":"moldova",
    "ME":"montenegro","NL":"netherlands","MK":"republic-of-north-macedonia",
    "NO":"norway","PL":"poland","PT":"portugal","RO":"romania","RS":"serbia",
    "SK":"slovakia","SI":"slovenia","ES":"spain","SE":"sweden","CH":"switzerland",
    "UA":"ukraine","GB":"united-kingdom"
}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def strip(value: object) -> str:
    return " ".join(str(value or "").replace("\n", " ").split())


def stable_id(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


def severity(text: str) -> str:
    value = text.lower()
    if re.search(r"\b(red|extreme|level\s*4)\b", value): return "extreme"
    if re.search(r"\b(orange|severe|level\s*3)\b", value): return "severe"
    if re.search(r"\b(yellow|moderate|level\s*2)\b", value): return "moderate"
    return "unknown"


def hazard(text: str) -> str:
    value = text.lower()
    candidates = [
        ("thunder", "Thunderstorm"),("wind", "Wind"),("snow", "Snow / ice"),("ice", "Snow / ice"),
        ("rain", "Rain"),("flood", "Flood"),("high temperature", "High temperature"),("heat", "High temperature"),
        ("low temperature", "Low temperature"),("cold", "Low temperature"),("fog", "Fog"),
        ("forest fire", "Forest fire"),("avalanche", "Avalanche")
    ]
    for key, label in candidates:
        if key in value: return label
    return "Weather warning"


def parse_feed(country_code: str, slug: str) -> tuple[list[dict], dict]:
    url = BASE + slug
    fetched_at = now_iso()
    try:
        response = requests.get(url, headers={"User-Agent": UA}, timeout=TIMEOUT)
        response.raise_for_status()
        feed = feedparser.loads(response.content)
    except Exception as exc:
        return [], {"ok": False, "fetched_at": fetched_at, "source_url": url, "error": str(exc)[:180]}

    items: list[dict] = []
    for entry in feed.entries:
        title = strip(entry.get("title")); summary = strip(entry.get("summary") or entry.get("description"))
        if not title and not summary: continue
        combined = f"{title} {summary}"; level = severity(combined)
        link = entry.get("link") or "https://www.meteoalarm.org/"; item_key = strip(entry.get("id") or link or title)
        items.append({
            "id": f"meteoalarm-{country_code}-{stable_id(item_key)}", "source": "MeteoAlarm / national meteorological service",
            "source_kind": "official_weather_warning", "country_code": country_code, "title": title or hazard(combined),
            "hazard": hazard(combined), "severity": level, "updated_at": strip(entry.get("updated") or entry.get("published")) or fetched_at,
            "url": link, "summary": summary[:1200] or title,
            "geographic_precision": "Official warning area described by MeteoAlarm / issuing national service; not the Swasthya radius"
        })
    return items, {"ok": True, "fetched_at": fetched_at, "source_url": url, "count": len(items)}


def existing() -> dict:
    try: return json.loads(OUT.read_text(encoding="utf-8"))
    except Exception: return {"generated_at": None, "items": [], "country_status": {}}


def item_signature(items: list[dict]) -> list[tuple]:
    keys = ("id","country_code","url","title","hazard","severity","updated_at","summary","geographic_precision")
    return sorted(tuple(item.get(k) for k in keys) for item in items)


def main() -> None:
    old = existing(); items: list[dict] = []; status: dict[str, dict] = {}
    for code, slug in COUNTRIES.items():
        parsed, meta = parse_feed(code, slug); status[code] = meta
        if meta.get("ok"): items.extend(parsed)
        else: items.extend(x for x in old.get("items", []) if x.get("country_code") == code)

    unique = {item["id"]: item for item in items}
    items = sorted(unique.values(), key=lambda x: (x.get("country_code", ""), x.get("severity", ""), x.get("title", "")))
    if item_signature(items) == item_signature(old.get("items", [])):
        print(f"No material warning change; keeping existing cache with {len(items)} entries.")
        return

    payload = {
        "generated_at": now_iso(), "source": "MeteoAlarm / EUMETNET Atom feeds", "licence": "CC BY 4.0",
        "notice": "Official warnings retain their published warning geography. A matched country warning is not proof that the user's selected radius is affected.",
        "country_status": status, "items": items
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} MeteoAlarm warning entries for {len(COUNTRIES)} countries")


if __name__ == "__main__": main()
