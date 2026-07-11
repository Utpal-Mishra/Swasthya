# Swasthya

**Swasthya** is an open-source, location-aware health, environment and wellbeing awareness platform. Its purpose is to help people understand potentially relevant conditions near them through transparent, source-linked and privacy-conscious information.

> Swasthya is an awareness and decision-support product. It does not diagnose, prescribe treatment, replace professional medical advice or replace emergency services.

## Live application

**GitHub Pages:** https://utpal-mishra.github.io/Swasthya/

The deployed website is currently a responsive static MVP. Most displayed health signals remain clearly labelled demonstration or manually maintained reference records until validated live integrations are introduced.

## Current capabilities

- Responsive GitHub Pages dashboard
- Region, nearby-town or city entry with optional browser geolocation
- User-controlled proximity radius
- Opt-in browser notifications for high-priority reference signals while the website is active
- High-temperature health reference with hydration, food, shade and vulnerable-person guidance
- Location-aware navigation to nearby open grocery stores
- Air-quality dashboard using AQI/AQIH and prominent pollutant KPIs: PM2.5, PM10, NO₂, O₃ and CO
- Dominant-pollutant, monitoring-station and observation-time placeholders for future live integration
- Private browser-only check-in dashboard for ADHD support, epilepsy wellbeing, stress and general mental wellbeing
- Condition-specific practical actions and verified support links
- Emergency call actions for Ireland using `112` and `999`
- Samaritans emotional-support contact using `116 123`
- HSE local-service navigation
- Direct links to official and specialist reference organisations
- Python/Streamlit foundation for future server-side integrations
- Automated GitHub Pages deployment from `main`

## Air-quality interpretation

The current AQI/AQIH and pollutant figures are illustrative values, not live readings. A production alert must show the applicable official index, nearest relevant monitoring station, observation timestamp, geographic coverage, dominant pollutant and direct source link.

## Neurodiversity and mental-health dashboard boundary

The check-in dashboard helps users notice general patterns in sleep, stress, cognitive load and routine. It does not screen for, diagnose or predict ADHD, epilepsy, stress disorders or any mental-health condition. Epilepsy content does not predict seizures. Selections remain in the current browser session and are not transmitted by the static site.

Reference support includes ADHD Ireland, Epilepsy Ireland, HSE Mental Health and Samaritans.

## Notification limitation

The current static GitHub Pages version can request browser notification permission and show high-priority notifications while the website is open or active. Reliable background push notifications when the website is closed will require a service worker, push subscription storage and a secure backend notification service.

## Trust-by-design

A signal must not be presented as a trusted alert merely because an API or dataset is available. Every production alert should include:

- source organisation and direct reference URL
- source classification such as official, institutional, modelled, third-party or community
- publication, observation and retrieval timestamps
- geographic coverage and distance relevance
- original units and definitions
- severity, confidence and freshness status
- applicable threshold or risk-rule version
- transformation history where relevant
- recommended action linked to official guidance

Demonstration, stale, estimated, modelled and community-sourced information must always be visibly distinguished.

## Architecture summary

```text
User consent and region
        ↓
Location normalisation and privacy controls
        ↓
Trusted provider adapters
        ↓
Schema validation and freshness checks
        ↓
Geographic relevance and distance engine
        ↓
Versioned health-risk rules
        ↓
Ranking, deduplication and provenance
        ↓
Dashboard, source explorer and optional notifications
```

The static site currently performs browser-side interaction only. The future backend will handle provider ingestion, validation, risk processing, provenance and reliable background notifications.

## Documentation

- [Project brief](docs/project-brief.md)
- [Architecture](docs/architecture.md)
- [Repository structure](docs/repository-structure.md)
- [Trusted data-source policy](docs/data-sources.md)
- [Implementation roadmap](docs/roadmap.md)
- [Deployment guide](docs/deployment.md)

## Run locally

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

For the Streamlit foundation:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
streamlit run app/app.py
```

## Privacy principles

- Location access must be explicit, optional and revocable.
- Exact coordinates must not be stored by default.
- Prefer coarse location or on-device distance calculations where possible.
- Do not introduce background tracking in the initial product phases.
- Collect only the minimum data required for the requested feature.
- Do not infer or expose sensitive health status from location or check-in behaviour.

## Delivery status

### Completed

- Static, mobile-responsive awareness dashboard
- Browser-side region, radius and notification controls
- Heat-health guidance and grocery navigation
- AQI/AQIH and pollutant KPI dashboard foundation
- ADHD, epilepsy, stress and mental-wellbeing check-in dashboard
- Emergency and emotional-support contact actions
- Streamlit scaffold and GitHub Pages workflow

### Next priorities

1. Connect an official live air-quality provider and replace illustrative KPI values.
2. Add monitoring-station distance, observation time and dominant-pollutant logic.
3. Introduce canonical alert schemas and automated tests.
4. Replace manually maintained weather references with verified live data.
5. Add secure background push notifications.
6. Add optional, consent-based local history for wellbeing patterns without creating diagnostic scores.

## Licence

A project licence has not yet been selected. Add an explicit licence before encouraging broad reuse or third-party distribution.
