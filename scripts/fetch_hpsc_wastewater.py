#!/usr/bin/env python3
"""Fetch the latest HPSC SARS-CoV-2 wastewater catchment results.

The output is population surveillance context. It must never be interpreted as a
patient location, individual infection, or direct exposure notification.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "ie-wastewater.json"
INDEX_URLS = [
    "https://www.hpsc.ie/a-z/nationalwastewatersurveillanceprogramme/2026wastewatersurveillanceprogrammereports/",
    "https://hpsc.ie/p/nationalwastewatersurveillanceprogramme/wastewater-surveillance-reports-2026/",
]
GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
UA = "Swasthya-hpsc-wastewater/1.0 (+https://github.com/Utpal-Mishra/Swasthya)"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": UA})
TIMEOUT = 30
VALID_RESULTS = {"positive", "weak positive", "undetectable", "unavailable", "not available"}


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_report_date(text: str) -> str:
    for pattern in (r"Report prepared on\s+(\d{1,2}/\d{1,2}/\d{4})", r"Publication Date:\s*(\d{1,2}\s+\w+\s+\d{4})"):
        m = re.search(pattern, text, re.I)
        if not m:
            continue
        value = m.group(1)
        for fmt in ("%d/%m/%Y", "%d %B %Y", "%d %b %Y"):
            try:
                dt = datetime.strptime(value, fmt).replace(tzinfo=timezone.utc)
                return dt.isoformat().replace("+00:00", "Z")
            except ValueError:
                pass
    return iso_now()


def parse_sample_date(value: str) -> str | None:
    try:
        return datetime.strptime(value.strip(), "%d/%m/%Y").date().isoformat()
    except Exception:
        return None


def discover_latest_report() -> tuple[str, int, int]:
    candidates: list[tuple[int, int, str]] = []
    for index_url in INDEX_URLS:
        try:
            r = SESSION.get(index_url, timeout=TIMEOUT)
            r.raise_for_status()
        except Exception:
            continue
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.find_all("a", href=True):
            href = urljoin(index_url, a["href"])
            label = " ".join(a.get_text(" ", strip=True).split())
            combined = f"{href} {label}"
            m = re.search(r"week[_\s-]?(\d{1,2})[_\s-]?(20\d{2})", combined, re.I)
            if not m:
                continue
            week, year = int(m.group(1)), int(m.group(2))
            if href.lower().endswith(".html") or "nwsp_main_week_" in href.lower():
                candidates.append((year, week, href))
        if candidates:
            break

    if candidates:
        year, week, href = sorted(candidates, reverse=True)[0]
        return href, week, year

    # Conservative fallback for the current programme: try recent week-pattern URLs.
    year = datetime.now(timezone.utc).year
    current_week = datetime.now(timezone.utc).isocalendar().week
    base = f"https://www.hpsc.ie/a-z/nationalwastewatersurveillanceprogramme/{year}wastewatersurveillanceprogrammereports/"
    for week in range(current_week, max(current_week - 12, 0), -1):
        for suffix in ("", "_v2", "_v1_min", "_v1"):
            url = f"{base}nwsp_main_week_{week:02d}_{year}{suffix}.html"
            try:
                r = SESSION.get(url, timeout=12)
                if r.ok and "National SARS-CoV-2 Wastewater Surveillance Programme" in r.text:
                    return url, week, year
            except Exception:
                pass
    raise RuntimeError("Could not discover a current HPSC wastewater HTML report")


def geocode_catchment(catchment: str, county: str) -> tuple[float | None, float | None, str]:
    names = [catchment]
    simplified = re.sub(r"\b(Ringsend\s*[12]|North|Lower|Upper|Regional|Sewerage|Scheme|WWTP|WwTP)\b", " ", catchment, flags=re.I)
    simplified = re.sub(r"\([^)]*\)", " ", simplified)
    simplified = " ".join(simplified.split())
    if simplified and simplified.lower() != catchment.lower():
        names.append(simplified)
    for name in names:
        query = f"{name}, {county}, Ireland"
        try:
            r = SESSION.get(GEOCODE_URL, params={"name": query, "count": 1, "language": "en", "format": "json"}, timeout=15)
            if not r.ok:
                continue
            rows = r.json().get("results") or []
            if not rows:
                continue
            hit = rows[0]
            return float(hit["latitude"]), float(hit["longitude"]), "place geocoder"
        except Exception:
            continue
    return None, None, "catchment name only"


def extract_rows(report_url: str, week: int, year: int) -> dict:
    r = SESSION.get(report_url, timeout=TIMEOUT)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    text = soup.get_text(" ", strip=True)
    published_at = parse_report_date(text)
    current_county = ""
    items: list[dict] = []

    for tr in soup.find_all("tr"):
        cells = [" ".join(td.get_text(" ", strip=True).split()) for td in tr.find_all(["td", "th"])]
        if len(cells) < 5:
            continue
        result = cells[-1].strip()
        if result.lower() not in VALID_RESULTS:
            continue
        county = cells[0].strip() or current_county
        if county:
            current_county = county
        catchment = cells[1].strip()
        if not county or not catchment:
            continue
        sample_date = parse_sample_date(cells[-2])
        lat, lon, coordinate_precision = geocode_catchment(catchment, county)
        result_lower = result.lower()
        importance = "moderate" if result_lower == "positive" else "low" if "weak" in result_lower else "info"
        summary = (
            f"HPSC reported a {result.lower()} SARS-CoV-2 wastewater result for the {catchment} catchment. "
            "This indicates population-level wastewater detection only; it does not identify an infected person or prove personal exposure."
        )
        items.append({
            "id": f"hpsc-wastewater-{year}-w{week:02d}-" + re.sub(r"[^a-z0-9]+", "-", catchment.lower()).strip("-"),
            "source": "HPSC",
            "source_kind": "wastewater_surveillance",
            "title": f"SARS-CoV-2 wastewater · {catchment}",
            "published_at": published_at,
            "sample_date": sample_date,
            "url": report_url,
            "countries": ["IE"],
            "regions": [county],
            "county": county,
            "catchment": catchment,
            "result_category": result,
            "importance": importance,
            "geographic_precision": "wastewater treatment catchment; not a patient location or circular radius",
            "latitude": lat,
            "longitude": lon,
            "coordinate_precision": coordinate_precision,
            "summary": summary,
        })

    if not items:
        raise RuntimeError("No wastewater catchment rows could be parsed from the HPSC report")
    return {
        "generated_at": iso_now(),
        "report_week": week,
        "report_year": year,
        "report_url": report_url,
        "notice": "Official HPSC wastewater surveillance. Catchment signals are population surveillance and must not be interpreted as nearby patient locations or direct exposure.",
        "items": items,
    }


def stable_payload(payload: dict) -> dict:
    stable = dict(payload)
    stable.pop("generated_at", None)
    return stable


def existing_payload() -> dict:
    try:
        return json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:
        return {"generated_at": None, "items": []}


def main() -> None:
    report_url, week, year = discover_latest_report()
    payload = extract_rows(report_url, week, year)
    old = existing_payload()
    if stable_payload(old) == stable_payload(payload):
        print(f"No material Irish wastewater change; keeping {len(payload['items'])} catchments.")
        return
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(payload['items'])} Irish wastewater catchments for week {week} {year}")


if __name__ == "__main__":
    main()
