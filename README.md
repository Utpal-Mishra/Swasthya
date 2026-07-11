# Swasthya

**Swasthya** is an open-source, location-aware health, environment and wellbeing awareness platform. Its purpose is to help people understand potentially relevant conditions near them through transparent, source-linked and privacy-conscious information.

> Swasthya is an awareness and decision-support product. It does not diagnose, prescribe treatment, replace professional medical advice or replace emergency services.

## Live application

**Location-based awareness:** https://utpal-mishra.github.io/Swasthya/

**Health and wellbeing dashboard:** https://utpal-mishra.github.io/Swasthya/dashboard.html

## Responsive KPI layout

The six air-quality KPIs now adapt to screen size:

- Large monitors: **1 row × 6 columns**
- Tablets: **2 rows × 3 columns**
- Phones: **2 rows × 3 columns**, using compact card typography and spacing

The KPI set includes AQI/AQIH, PM2.5, PM10, NO₂, O₃ and CO.

## Page 1 — Location-based healthcare awareness

`index.html` contains:

- Region, nearby-town or city selection
- Optional browser geolocation
- User-controlled alert radius
- Meaningful-alert notification toggle
- Heat-health awareness and preventive measures
- Nearby grocery navigation
- Location-filtered environmental and public-health alert cards
- Emergency services, Samaritans and HSE service navigation
- A decision-support section covering action, freshness, confidence, safer alternatives, low-clutter design and notification control

## Page 2 — Health and wellbeing dashboard

`dashboard.html` contains:

- Six responsive air-quality KPI cards
- ADHD support check-in
- Epilepsy wellbeing check-in
- Stress check-in
- General mental-wellbeing check-in
- Condition-specific actions and verified support links

The air-quality values are illustrative until an official live feed is connected. The wellbeing check-ins do not diagnose, screen or predict a condition, and the epilepsy section does not predict seizures.

## Product principles informed by mapping, weather and health-app feedback

Swasthya is designed around the following principles:

1. **Action first** — show the most useful next step before secondary detail.
2. **Visible freshness** — display observation time, retrieval time and stale-data status.
3. **Honest uncertainty** — distinguish official observations, forecasts, models and reference content.
4. **Route-aware support** — future navigation should consider exposure, shade, heat, opening hours and accessibility, not only shortest distance.
5. **Progressive disclosure** — keep the main screen readable and move methodology, thresholds and source detail behind expandable views.
6. **Meaningful notifications** — alert only when a high-priority condition is new or materially changed.
7. **One consolidated view** — reduce the need to switch between separate maps, weather, air-quality and health-support apps.

## Current files

```text
Swasthya/
├── index.html          # Location-based healthcare awareness page
├── dashboard.html      # KPI and wellbeing dashboard page
├── styles.css          # Shared application styles
├── page-layout.css     # Responsive page navigation and KPI matrix
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

## Run locally

```bash
python -m http.server 8000
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/dashboard.html`

## Privacy principles

- Location access must be explicit, optional and revocable.
- Exact coordinates must not be stored by default.
- Prefer coarse location or on-device distance calculations.
- Do not introduce background tracking in the initial phases.
- Do not infer or expose sensitive health status from location or check-in behaviour.

## Next priorities

1. Connect official live air-quality and weather providers.
2. Add station distance, timestamps, dominant-pollutant and confidence logic.
3. Add route-aware exposure and safer-place recommendations.
4. Add canonical alert schemas and automated tests.
5. Add secure background push notifications.

## Licence

A project licence has not yet been selected. Add an explicit licence before encouraging broad reuse or third-party distribution.
