#!/usr/bin/env python3
"""Build the static public-health cache used by Swasthya.

The job intentionally favours authoritative feeds and conservative geography.
It never converts a country/regional publication into street-level disease claims.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import feedparser
import pycountry
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "public-health.json"
UA = "Swasthya-public-health-cache/1.0 (+https://github.com/Utpal-Mishra/Swasthya)"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": UA, "Accept": "application/json,text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.8"})
TIMEOUT = 30

ALIASES = {
    "democratic republic of the congo": "CD",
    "dr congo": "CD",
    "drc": "CD",
    "republic of the congo": "CG",
    "united states of america": "US",
    "united states": "US",
    "usa": "US",
    "united kingdom": "GB",
    "uk": "GB",
    "south korea": "KR",
    "north korea": "KP",
    "russia": "RU",
    "iran": "IR",
    "syria": "SY",
    "laos": "LA",
    "vietnam": "VN",
    "bolivia": "BO",
    "venezuela": "VE",
    "tanzania": "TZ",
    "moldova": "MD",
}

COUNTRY_TERMS: list[tuple[str, str]] = []
for country in pycountry.countries:
    code = country.alpha_2
    names = {country.name}
    for attr in ("official_name", "common_name"):
        value = getattr(country, attr, None)
        if value:
            names.add(value)
    for name in names:
        COUNTRY_TERMS.append((name.lower(), code))
for name, code in ALIASES.items():
    COUNTRY_TERMS.append((name, code))
COUNTRY_TERMS.sort(key=lambda x: len(x[0]), reverse=True)


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def strip_html(value: object) -> str:
    if value is None:
        return ""
    return " ".join(BeautifulSoup(str(value), "html.parser").get_text(" ", strip=True).split())


def parse_date(value: object) -> str:
    if not value:
        return iso_now()
    text = str(value).strip()
    # WHO normally returns ISO datetimes; feeds may use RFC822 dates.
    try:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    except ValueError:
        pass
    for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%d %B %Y", "%d %b %Y", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(text, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        except ValueError:
            continue
    return iso_now()


def extract_countries(text: str) -> list[str]:
    hay = f" {text.lower()} "
    found: set[str] = set()
    for term, code in COUNTRY_TERMS:
        if re.search(rf"(?<![a-z]){re.escape(term)}(?![a-z])", hay):
            found.add(code)
    return sorted(found)


def get_json(url: str):
    r = SESSION.get(url, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def who_items() -> list[dict]:
    payload = None
    for url in (
        "https://www.who.int/api/news/dons",
        "https://www.who.int/api/hubs/diseaseoutbreaknews",
        "https://www.who.int/api/news/outbreaks",
    ):
        try:
            payload = get_json(url)
            if payload:
                break
        except Exception as exc:
            print(f"WHO endpoint failed: {url}: {exc}")
    if not payload:
        return []
    records = payload.get("value", payload if isinstance(payload, list) else [])
    out: list[dict] = []
    for row in records[:80]:
        title = strip_html(row.get("Title") or row.get("title") or row.get("Name"))
        if not title:
            continue
        summary = strip_html(row.get("Summary") or row.get("Text") or row.get("Description") or row.get("Content"))
        url = row.get("ItemDefaultUrl") or row.get("Url") or row.get("url") or ""
        if url and not str(url).startswith("http"):
            url = urljoin("https://www.who.int", str(url))
        url_name = row.get("UrlName") or row.get("EventId") or re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        text = f"{title} {summary}"
        countries = extract_countries(text)
        out.append({
            "id": f"who-{url_name}",
            "source": "WHO",
            "source_kind": "global_outbreak",
            "title": title,
            "published_at": parse_date(row.get("PublicationDate") or row.get("DateCreated") or row.get("LastModified")),
            "url": url or "https://www.who.int/emergencies/disease-outbreak-news",
            "countries": countries,
            "regions": [],
            "geographic_precision": "country/region as described in the WHO report" if countries else "global or multi-location event",
            "importance": "high" if countries else "moderate",
            "summary": summary[:700] or "WHO Disease Outbreak News item. Open the official report for current situation and guidance.",
        })
    return out


def ecdc_items() -> list[dict]:
    feeds = [
        ("https://www.ecdc.europa.eu/en/taxonomy/term/1505/feed", "regional_surveillance"),
        ("https://www.ecdc.europa.eu/en/taxonomy/term/1310/feed", "epidemiological_update"),
    ]
    out: list[dict] = []
    for url, kind in feeds:
        try:
            r = SESSION.get(url, timeout=TIMEOUT)
            r.raise_for_status()
            feed = feedparser.loads(r.content)
        except Exception as exc:
            print(f"ECDC feed failed: {url}: {exc}")
            continue
        for entry in feed.entries[:30]:
            title = strip_html(entry.get("title"))
            summary = strip_html(entry.get("summary") or entry.get("description"))
            countries = extract_countries(f"{title} {summary}")
            out.append({
                "id": f"ecdc-{entry.get('id') or entry.get('link') or title}",
                "source": "ECDC",
                "source_kind": kind,
                "title": title,
                "published_at": parse_date(entry.get("published") or entry.get("updated")),
                "url": entry.get("link") or "https://www.ecdc.europa.eu/en/rss-feeds",
                "countries": countries,
                "regions": ["EU_EEA"],
                "geographic_precision": "EU/EEA regional surveillance; country names are extracted only when explicitly present",
                "importance": "moderate" if countries else "info",
                "summary": summary[:700] or "ECDC communicable-disease surveillance update.",
            })
    return out


def hpsc_items() -> list[dict]:
    url = "https://www.hpsc.ie/epidemiology-reports"
    try:
        r = SESSION.get(url, timeout=TIMEOUT)
        r.raise_for_status()
    except Exception as exc:
        print(f"HPSC page failed: {exc}")
        return []
    soup = BeautifulSoup(r.text, "html.parser")
    out: list[dict] = []
    for row in soup.select("tr")[:40]:
        cells = row.find_all(["td", "th"])
        if len(cells) < 2:
            continue
        title = strip_html(cells[0].get_text(" ", strip=True))
        date_text = strip_html(cells[1].get_text(" ", strip=True))
        if not title or title.lower() in {"title", "report name"}:
            continue
        link = row.find("a", href=True)
        item_url = urljoin(url, link["href"]) if link else url
        out.append({
            "id": "hpsc-" + re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:120],
            "source": "HPSC",
            "source_kind": "national_surveillance",
            "title": title,
            "published_at": parse_date(date_text),
            "url": item_url,
            "countries": ["IE"],
            "regions": [],
            "geographic_precision": "Ireland national/report-specific surveillance",
            "importance": "info",
            "summary": "Official HPSC surveillance publication. Open the source for disease-specific geography, methods and interpretation.",
        })
    return out[:20]


def dedupe(items: list[dict]) -> list[dict]:
    seen: set[tuple[str, str]] = set()
    unique: list[dict] = []
    for item in items:
        key = (item.get("source", ""), item.get("url", "") or item.get("title", ""))
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    unique.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    return unique[:160]


def existing_items() -> list[dict]:
    try:
        return json.loads(OUT.read_text(encoding="utf-8")).get("items", [])
    except Exception:
        return []


def main() -> None:
    fetched = []
    for loader in (who_items, ecdc_items, hpsc_items):
        try:
            fetched.extend(loader())
        except Exception as exc:
            print(f"Loader failed: {loader.__name__}: {exc}")
    items = dedupe(fetched)
    if not items:
        items = existing_items()
    payload = {
        "generated_at": iso_now(),
        "notice": "Country and regional public-health signals are aggregated from official sources. Absence of a matched item does not mean absence of disease. Geographic precision is always shown.",
        "items": items,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} public-health items to {OUT}")


if __name__ == "__main__":
    main()
