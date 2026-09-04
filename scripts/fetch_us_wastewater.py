#!/usr/bin/env python3
"""Build a conservative county-context cache from CDC NWSS public datasets.

This cache is for vicinity awareness, not individual exposure. County/sewershed
records do not imply that every person in a county is infected or exposed.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "us-wastewater.json"
BASE = "https://data.cdc.gov"
TIMEOUT = 40
SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Swasthya-us-wastewater/1.0 (+https://github.com/Utpal-Mishra/Swasthya)",
    "Accept": "application/json",
})

# CDC identifies these as public NWSS wastewater datasets. The ingest is
# intentionally schema-tolerant because fields differ across pathogens.
DATASETS = {
    "SARS-CoV-2": "j9g8-acpt",
    "Influenza A": "ymmh-divb",
    "RSV": "45cq-cw4i",
    "Measles": "akvg-8vrb",
    "Mpox": "xpxn-rzgz",
    "Avian influenza A(H5)": "mtpu-urpp",
}

DATE_FIELDS = [
    "date", "sample_collect_date", "sample_collection_date", "sample_date",
    "date_end", "week_ending", "reporting_week", "collection_date",
]
COUNTY_FIELDS = ["county_names", "counties_served", "county_name", "county"]
FIPS_FIELDS = ["county_fips", "county_fips_code", "fips", "countyfips"]
STATE_FIELDS = ["wwtp_jurisdiction", "reporting_jurisdiction", "state_abbr", "state"]
ACTIVITY_FIELDS = [
    "wastewater_viral_activity_level", "viral_activity_level", "wval",
    "activity_level", "activity", "percentile", "detect_prop_15d",
    "detection_proportion", "percent_change_15d", "ptc_15d",
]


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def first(row: dict, names: list[str]):
    for name in names:
        value = row.get(name)
        if value not in (None, ""):
            return value
    return None


def parse_date(value) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    try:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    except ValueError:
        return None


def age_days(value: str | None) -> float:
    if not value:
        return 10_000
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return max(0, (datetime.now(timezone.utc) - dt.astimezone(timezone.utc)).total_seconds() / 86400)
    except ValueError:
        return 10_000


def metadata_fields(dataset_id: str) -> set[str]:
    r = SESSION.get(f"{BASE}/api/views/{dataset_id}", timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    return {c.get("fieldName") for c in data.get("columns", []) if c.get("fieldName")}


def fetch_rows(dataset_id: str) -> list[dict]:
    fields = metadata_fields(dataset_id)
    date_field = next((name for name in DATE_FIELDS if name in fields), None)
    params = {"$limit": "3500"}
    if date_field:
        params["$order"] = f"{date_field} DESC"
    r = SESSION.get(f"{BASE}/resource/{dataset_id}.json", params=params, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def numeric(value):
    try:
        return float(str(value).replace("%", "").strip())
    except (TypeError, ValueError):
        return None


def activity_from_row(row: dict) -> tuple[str, str, str]:
    """Return label, confidence-safe importance, and field name.

    We only elevate when the source itself supplies a textual high category, or
    when a documented relative percentile is very high. Otherwise the record is
    informational and the official metric is exposed without risk conversion.
    """
    for field in ACTIVITY_FIELDS:
        value = row.get(field)
        if value in (None, ""):
            continue
        text = str(value).strip()
        lower = text.lower()
        if any(term in lower for term in ("very high", "high", "elevated")):
            return text, "moderate", field
        if any(term in lower for term in ("low", "minimal")):
            return text, "info", field
        number = numeric(value)
        if field == "percentile" and number is not None:
            return f"{number:g}th percentile vs this site's history", "moderate" if number >= 80 else "info", field
        if "detect" in field and number is not None:
            return f"Detection proportion {number:g}%", "moderate" if number >= 80 else "info", field
        return f"{field.replace('_', ' ')}: {text}", "info", field
    return "Recent surveillance record available", "info", ""


def county_key(row: dict) -> tuple[str, str, str]:
    names = str(first(row, COUNTY_FIELDS) or "").strip()
    fips = str(first(row, FIPS_FIELDS) or "").strip()
    state = str(first(row, STATE_FIELDS) or "").strip()
    return names, fips, state


def build_items(pathogen: str, dataset_id: str) -> list[dict]:
    try:
        rows = fetch_rows(dataset_id)
    except Exception as exc:
        print(f"CDC {pathogen} fetch failed: {exc}")
        return []

    best: dict[tuple[str, str, str], dict] = {}
    for row in rows:
        county_names, county_fips, state = county_key(row)
        if not county_names and not county_fips:
            continue
        date = parse_date(first(row, DATE_FIELDS))
        if not date or age_days(date) > 28:
            continue
        activity, importance, metric_field = activity_from_row(row)
        key = (county_names, county_fips, state)
        candidate = {
            "id": f"cdc-nwss-{dataset_id}-" + re.sub(r"[^a-z0-9]+", "-", (county_fips or county_names).lower()).strip("-")[:90],
            "source": "CDC NWSS",
            "source_kind": "county_wastewater_surveillance",
            "title": f"{pathogen} wastewater surveillance",
            "published_at": date,
            "url": f"https://data.cdc.gov/d/{dataset_id}",
            "countries": ["US"],
            "regions": [state] if state else [],
            "state": state,
            "county_names": county_names,
            "county_fips": county_fips,
            "pathogen": pathogen,
            "activity_summary": activity,
            "metric_field": metric_field,
            "importance": importance,
            "proximity_mode": "county_sewershed_context",
            "geographic_precision": "CDC wastewater sewershed/county context; a site may serve all or part of one or more counties",
            "summary": f"CDC NWSS has a recent {pathogen} wastewater surveillance record associated with {county_names or county_fips}. {activity}. This is population-level surveillance, not evidence that a particular nearby person is infected or that you were exposed.",
        }
        existing = best.get(key)
        if existing is None or candidate["published_at"] > existing["published_at"] or (candidate["importance"] == "moderate" and existing["importance"] != "moderate"):
            best[key] = candidate
    return list(best.values())


def main() -> None:
    items: list[dict] = []
    for pathogen, dataset_id in DATASETS.items():
        items.extend(build_items(pathogen, dataset_id))
    items.sort(key=lambda x: (x.get("importance") == "moderate", x.get("published_at", "")), reverse=True)
    payload = {
        "generated_at": iso_now(),
        "notice": "CDC wastewater records are county/sewershed population surveillance. They are not patient locations, do not prove personal exposure, and do not necessarily cover an entire county.",
        "items": items[:2500],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    new_text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    if OUT.exists():
        try:
            old = json.loads(OUT.read_text(encoding="utf-8"))
            if old.get("items") == payload["items"]:
                print(f"No material CDC wastewater change; keeping {len(payload['items'])} items.")
                return
        except Exception:
            pass
    OUT.write_text(new_text, encoding="utf-8")
    print(f"Wrote {len(payload['items'])} CDC wastewater county records")


if __name__ == "__main__":
    main()
