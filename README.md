# Swasthya

**Swasthya** is an open-source, location-aware health-intelligence and wellbeing-awareness platform. Its primary purpose is to answer three questions:

1. **What health-relevant thing is happening around me?**
2. **Does it matter right now?**
3. **What can I reasonably do next?**

> Swasthya is an awareness and decision-support product. It does not diagnose, prescribe treatment, replace professional medical advice or replace emergency services.

## Live application

**Around Me — vicinity health intelligence:** https://utpal-mishra.github.io/Swasthya/

**My Health — optional personal dashboard:** https://utpal-mishra.github.io/Swasthya/dashboard.html

## Current product structure

### 1. Around Me

The primary page is now dynamic and location-aware.

Current implementation includes:

- Town/city geocoding
- Optional browser geolocation
- Optional **Live Health Awareness** using coarse location changes
- Configurable 1–25 km health-awareness radius
- Live current weather context
- Live modelled European AQI and pollutant context
- Weather interpretation using current rain, apparent temperature, wind and UV
- Health-relevance prioritisation rather than a conventional weather forecast screen
- `What Matters Now?` summary
- One practical next action
- Nearby pharmacy, healthcare, essentials and indoor-location searches
- Meaningful notifications only for materially changed high-priority context
- Explicit unavailable states for disease, environmental-incident and community-health feeds that are not yet connected

No hard-coded condition is allowed to present itself as current weather or current disease activity.

### 2. My Health

The secondary page is optional and contains:

- ADHD support mode
- Epilepsy wellbeing mode
- Stress support
- General mental wellbeing
- Private browser-session check-ins
- Specialist support resources
- Technical air-quality detail for users who want underlying indicators

The personal layer does not diagnose, screen or predict a condition. Epilepsy content does not predict seizures.

## Live environmental providers

The current GitHub Pages MVP uses **Open-Meteo** in the browser for live modelled weather and air-quality context because it requires no client-side API secret. Swasthya labels this information as modelled and links users to official Irish sources such as:

- Met Éireann
- EPA AirQuality.ie
- HPSC
- HSE

This is an MVP provider strategy, not the final commercial data architecture. Before commercial launch, provider licensing, SLAs, official-warning ingestion, source validation and fallback behaviour must be reviewed.

## Vicinity disease intelligence

Swasthya does **not** show identifiable patient locations and does not infer whether a nearby individual is healthy or ill.

The intended disease-awareness model is:

```text
Official / authorised surveillance
        ↓
Geographic aggregation
        ↓
Freshness + privacy validation
        ↓
Selected user proximity
        ↓
Health Around Me signal
```

If a trustworthy feed does not support street-level precision, Swasthya must display the real geographic resolution rather than manufacture a smaller radius. Until such feeds are connected, disease activity is shown as **Unavailable**, with a link to official surveillance.

## Health-context engine

Current environmental interpretation considers signals such as:

- rain / precipitation
- apparent temperature
- cold exposure
- wind
- UV
- European AQI

It converts those inputs into ranked awareness signals and one primary next action. These are general-awareness rules, not clinical assessments or official warnings.

## Privacy principles

- Location access is explicit, optional and revocable.
- Exact coordinates remain in the browser session and are not stored by the static site.
- Live awareness refreshes on coarse location-cell changes rather than every GPS movement.
- Individual patient health status must never be displayed.
- Future community-health signals must use privacy-preserving aggregation and minimum-participant thresholds.
- Personal wellbeing data must not be combined with precise location without a deliberate privacy architecture and user consent.

## Notification limitation

The current GitHub Pages version can show notifications while the website is open or active. Reliable background alerts when the website is closed will require a service worker, push-subscription storage and a secure backend notification service.

## Trust-by-design

Every future production health signal should include:

- provider and source URL
- source classification: official, observed, modelled, community or reference
- observation/publication/retrieval timestamps
- real geographic precision
- freshness status
- confidence / uncertainty
- applicable rule version
- practical action linked to authoritative guidance

**Unknown is better than wrong.** Stale, unavailable, estimated and modelled information must never masquerade as a current official observation.

## Next priorities

1. Integrate official Met Éireann warnings and/or an appropriate licensed weather feed.
2. Integrate official EPA air-quality observations and station distance.
3. Identify the highest-resolution suitable HPSC/ECDC disease-surveillance feeds.
4. Build the canonical provider/observation/advisory/provenance schema in the backend.
5. Add a production notification service and service worker.
6. Add privacy-safe aggregated community-health signals only after privacy/security design is complete.
7. Move personal longitudinal wellbeing history behind explicit consent and secure storage.

## Run locally

```bash
python -m http.server 8000
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/dashboard.html`

## Licence

A project licence has not yet been selected. Add an explicit licence before encouraging broad reuse or third-party distribution.
