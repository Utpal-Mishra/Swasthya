# Swasthya

**Swasthya** is an open-source, location-aware health, environment and wellbeing awareness platform. Its purpose is to help people understand potentially relevant conditions near them through transparent, source-linked and privacy-conscious information.

> Swasthya is an awareness and decision-support product. It does not diagnose, prescribe treatment, replace professional medical advice or replace emergency services.

## Live application

**Location-based awareness:** https://utpal-mishra.github.io/Swasthya/

**Health and wellbeing dashboard:** https://utpal-mishra.github.io/Swasthya/dashboard.html

The static application is now divided into two focused pages.

## Page 1 — Location-based healthcare awareness

`index.html` contains:

- Region, nearby-town or city selection
- Optional browser geolocation
- User-controlled alert radius
- Unexpected-condition notification toggle
- Heat-health awareness and preventive measures
- Nearby grocery navigation
- Location-filtered environmental and public-health alert cards
- Emergency services, Samaritans and HSE service navigation

## Page 2 — Health and wellbeing dashboard

`dashboard.html` contains:

- Six air-quality KPIs arranged as a **3 × 2 matrix** on desktop
- Responsive two-column tablet and one-column mobile layouts
- AQI/AQIH
- PM2.5
- PM10
- NO₂
- O₃
- CO
- ADHD support check-in
- Epilepsy wellbeing check-in
- Stress check-in
- General mental-wellbeing check-in
- Condition-specific actions and verified support links

The air-quality values are illustrative until an official live feed is connected. The wellbeing check-ins do not diagnose, screen or predict a condition, and the epilepsy section does not predict seizures.

## Current files

```text
Swasthya/
├── index.html          # Location-based healthcare awareness page
├── dashboard.html      # KPI and wellbeing dashboard page
├── styles.css          # Shared application styles
├── page-layout.css     # Two-page navigation and 3 × 2 KPI matrix
├── app.js              # Location awareness, alerts and notifications
├── dashboard.js        # Wellbeing dashboard interactions
├── app/                # Streamlit foundation
├── docs/               # Brief, architecture, roadmap and policies
└── .github/workflows/  # GitHub Pages deployment
```

## Notification limitation

The current static GitHub Pages version can request browser notification permission and show high-priority notifications while the website is open or active. Reliable background push notifications when the website is closed will require a service worker, push subscription storage and a secure backend notification service.

## Trust-by-design

Every future production alert should include:

- source organisation and direct reference URL
- source classification
- publication, observation and retrieval timestamps
- geographic coverage and distance relevance
- original units and definitions
- severity, confidence and freshness status
- applicable threshold or risk-rule version
- recommended action linked to official guidance

Demonstration, stale, estimated, modelled and community-sourced information must always be visibly distinguished.

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

Open:

- `http://localhost:8000/`
- `http://localhost:8000/dashboard.html`

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
- Prefer coarse location or on-device distance calculations.
- Do not introduce background tracking in the initial phases.
- Do not infer or expose sensitive health status from location or check-in behaviour.

## Next priorities

1. Connect an official live air-quality provider.
2. Add station distance, observation time and dominant-pollutant logic.
3. Replace manually maintained weather references with verified live data.
4. Add canonical alert schemas and automated tests.
5. Add secure background push notifications.

## Licence

A project licence has not yet been selected. Add an explicit licence before encouraging broad reuse or third-party distribution.
