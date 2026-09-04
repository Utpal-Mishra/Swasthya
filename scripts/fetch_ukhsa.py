#!/usr/bin/env python3
"""Fetch a conservative UKHSA respiratory surveillance summary for England.

The adapter deliberately preserves the UKHSA metric name and value instead of
converting it into a Swasthya risk score. National England data is not presented
as street-level or selected-radius disease activity.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "ukhsa-health.json"
BASE = "https://api.ukhsa-dashboard.data.gov.uk"
SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Swasthya-ukhsa/1.0 (+https://github.com/Utpal-Mishra/Swasthya)",
    "Accept": "application/json",
})
TIMEOUT = 30
TOPICS = ["COVID-19", "Influenza", "RSV"]
PREFERRED_TERMS = (
    "positiv", "admission", "hospital", "incidence", "rate", "cases",
    "testing", "percentage", "percent",
)


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def get_json(url: str, params: dict | None = None):
    r = SESSION.get(url, params=params, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def extract_list(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("results", "data", "items"):
            if isinstance(payload.get(key), list):
                return payload[key]
    return []


def row_date(row: dict) -> str | None:
    value = row.get("date") or row.get("period_end") or row.get("period") or row.get("timestamp") or row.get("reporting_date")
    return str(value) if value else None


def date_sort_key(row: dict) -> datetime:
    value = row_date(row)
    if not value:
        return datetime.min.replace(tzinfo=timezone.utc)
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)


def metric_names(topic: str) -> list[str]:
    path = f"/themes/infectious_disease/sub_themes/respiratory/topics/{quote(topic, safe='')}/geography_types/Nation/geographies/England/metrics"
    rows = extract_list(get_json(BASE + path))
    names = [str(row.get("name") or row.get("metric") or "").strip() for row in rows]
    names = [name for name in names if name]
    ranked = sorted(names, key=lambda name: (not any(term in name.lower() for term in PREFERRED_TERMS), name.lower()))
    return ranked[:3]


def latest_metric(topic: str, metric: str) -> dict | None:
    """Return the newest available point independent of API ordering.

    UKHSA's API is page-based and reports a total ``count``. The first page is
    not guaranteed to contain the newest point, so with page_size=1 we inspect
    both the first and final pages and select the row with the latest date.
    """
    path = f"/themes/infectious_disease/sub_themes/respiratory/topics/{quote(topic, safe='')}/geography_types/Nation/geographies/England/metrics/{quote(metric, safe='')}"
    first_payload = get_json(BASE + path, params={"page": 1, "page_size": 1, "format": "json"})
    candidates = extract_list(first_payload)

    count = None
    if isinstance(first_payload, dict):
        try:
            count = int(first_payload.get("count"))
        except (TypeError, ValueError):
            count = None

    if count and count > 1:
        last_payload = get_json(BASE + path, params={"page": count, "page_size": 1, "format": "json"})
        candidates.extend(extract_list(last_payload))

    if not candidates:
        return None

    row = max(candidates, key=date_sort_key)
    date = row_date(row)
    value = row.get("metric_value")
    if value is None:
        value = row.get("value")
    if value is None:
        value = row.get("figure")
    return {"date": date, "value": value}


def items() -> list[dict]:
    out: list[dict] = []
    for topic in TOPICS:
        try:
            metrics = metric_names(topic)
        except Exception as exc:
            print(f"UKHSA metric discovery failed for {topic}: {exc}")
            continue
        for metric in metrics:
            try:
                point = latest_metric(topic, metric)
            except Exception as exc:
                print(f"UKHSA metric fetch failed for {topic}/{metric}: {exc}")
                continue
            if not point:
                continue
            date = point["date"] or iso_now()
            value = point["value"]
            out.append({
                "id": f"ukhsa-{topic}-{metric}".lower().replace(" ", "-")[:180],
                "source": "UKHSA",
                "source_kind": "national_surveillance",
                "title": f"{topic} · {metric}",
                "published_at": date,
                "url": "https://ukhsa-dashboard.data.gov.uk/",
                "countries": ["GB"],
                "regions": ["England"],
                "geographic_precision": "England national surveillance; not a street-level or selected-radius signal",
                "importance": "info",
                "topic": topic,
                "metric": metric,
                "metric_value": value,
                "summary": f"Latest UKHSA dashboard value for {topic}: {metric} = {value}. The metric is shown as published and is not converted into a Swasthya clinical-risk score.",
            })
    return out


def main() -> None:
    current = items()
    payload = {
        "generated_at": iso_now(),
        "notice": "UKHSA values are England-level official surveillance metrics. They are not individual exposure data and do not inherit the user's selected radius.",
        "items": current,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists():
        try:
            old = json.loads(OUT.read_text(encoding="utf-8"))
            if old.get("items") == current:
                print(f"No material UKHSA change; keeping {len(current)} items.")
                return
        except Exception:
            pass
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(current)} UKHSA surveillance items")


if __name__ == "__main__":
    main()
