from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


SEVERITY_ICONS = {
    "low": "🟢",
    "moderate": "🟠",
    "high": "🔴",
    "critical": "🟣",
}


def build_demo_alerts(location: str, radius_km: int) -> list[dict[str, Any]]:
    """Return transparent demonstration records for the initial UI.

    These are not live warnings. Each record is explicitly labelled as a demonstration
    until a provider adapter, validation rule and freshness check are implemented.
    """
    checked_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    records = [
        {
            "title": "Air-quality monitoring foundation",
            "category": "Air quality",
            "severity": "moderate",
            "summary": (
                "Demonstration of how a nearby particulate-matter or gas-pollution signal "
                "will be presented after connection to an official monitoring feed."
            ),
            "distance_km": min(3.2, float(radius_km)),
            "coverage": "Demonstration only",
            "updated_at": checked_at,
            "confidence": "Not scored — no live feed",
            "recommended_action": (
                "Check the linked official source before changing activity. People with "
                "respiratory conditions should follow their clinician's existing advice."
            ),
            "source_name": "EPA Ireland — Air Quality",
            "source_url": "https://airquality.ie/",
            "source_label": "REFERENCE SOURCE — DEMO RECORD",
            "location_query": location,
        },
        {
            "title": "Weather-health monitoring foundation",
            "category": "Weather health",
            "severity": "low",
            "summary": (
                "Demonstration of future heat, cold, UV and severe-weather health relevance "
                "using official forecasts and health guidance."
            ),
            "distance_km": 0.0,
            "coverage": "User-selected area",
            "updated_at": checked_at,
            "confidence": "Not scored — no live feed",
            "recommended_action": "Review current official forecasts and any active public warnings.",
            "source_name": "Met Éireann",
            "source_url": "https://www.met.ie/",
            "source_label": "REFERENCE SOURCE — DEMO RECORD",
            "location_query": location,
        },
        {
            "title": "Public-health notice foundation",
            "category": "Infectious disease",
            "severity": "low",
            "summary": (
                "Demonstration of how official infectious-disease notices will be filtered by "
                "date, geography and public relevance."
            ),
            "distance_km": 0.0,
            "coverage": "Ireland",
            "updated_at": checked_at,
            "confidence": "Not scored — no live feed",
            "recommended_action": "Use current HSE or HPSC guidance and consult a professional for personal concerns.",
            "source_name": "Health Protection Surveillance Centre",
            "source_url": "https://www.hpsc.ie/",
            "source_label": "REFERENCE SOURCE — DEMO RECORD",
            "location_query": location,
        },
    ]

    for record in records:
        record["severity_icon"] = SEVERITY_ICONS[record["severity"]]

    return [record for record in records if record["distance_km"] <= radius_km]
