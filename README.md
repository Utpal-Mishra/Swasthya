# Swasthya

**Swasthya** is an open-source, location-aware health-intelligence and wellbeing-awareness platform. Its primary purpose is to answer three questions:

1. **What health-relevant thing is happening around me?**
2. **Does it matter right now?**
3. **What can I reasonably do next?**

> Swasthya is an awareness and decision-support product. It does not diagnose, prescribe treatment, identify nearby patients, replace professional medical advice or replace emergency services.

## Live application

**Around Me — vicinity health intelligence:** https://utpal-mishra.github.io/Swasthya/

**My Health — optional personal dashboard:** https://utpal-mishra.github.io/Swasthya/dashboard.html

## Around Me — country-aware health intelligence

The primary page changes its health context when the selected or live location changes, including across country borders.

Current implementation:

- Town/city geocoding with country, region and county context where available
- Browser geolocation with reverse country/region/county resolution
- Optional **Live Health Awareness** using coarse location-cell changes
- 1–25 km environmental/nearby-service context
- Live current weather and modelled air context
- Dynamic `What Matters Now?` prioritisation
- Country-aware official public-health intelligence
- Local → national → regional → WHO fallback strategy
- Country-specific health-authority links
- Verified emergency numbers for countries included in the provider registry
- Nearby pharmacy, healthcare, essentials and indoor-place searches
- Material-change notifications
- Explicit geographic-precision labels for every public-health item

## Official public-health integration

Swasthya builds static public-health caches from authoritative sources through a scheduled GitHub Action.

Current connected layers:

- **HPSC wastewater surveillance** — catchment-level SARS-CoV-2 population surveillance for Ireland
- **HPSC Ireland** — national epidemiology/surveillance publications
- **CDC NWSS** — county/sewershed wastewater context for SARS-CoV-2, Influenza A, RSV, measles, mpox and avian influenza A(H5) in the United States where current records are available
- **UKHSA Data Dashboard API** — official England-level respiratory surveillance metrics for COVID-19, influenza and RSV; retained at published national geography and not converted into a Swasthya clinical-risk score
- **ECDC RSS** — communicable-disease threat reports and epidemiological updates for EU/EEA context
- **WHO Disease Outbreak News (DON)** — global authoritative outbreak fallback

The scheduled data path is:

```text
WHO / ECDC / HPSC          CDC NWSS               UKHSA
        ↓                      ↓                      ↓
fetch_public_health.py   fetch_us_wastewater.py   fetch_ukhsa.py
        ↓                      ↓                      ↓
public-health.json       us-wastewater.json       ukhsa-health.json
                \             |             /
                 \            |            /
                  location matching in app.js
                            ↓
                     Health Around Me
```

`.github/workflows/update-public-health.yml` runs every six hours, can be triggered manually and refreshes after ingestion logic changes are merged to `main`.

### Geographic honesty

A 5 km user radius does **not** turn country-, county- or catchment-level disease surveillance into 5 km patient data.

```text
User location + selected radius
        ↓
Resolve real source geography
        ↓
Country / county / wastewater catchment
        ↓
Show that precision explicitly

Never: “patient detected within 5 km”
```

Swasthya uses the finest geography the source genuinely supports and never manufactures smaller precision.

## Autonomous country switching

```text
Live / selected location
        ↓
Country + region + county when available
        ↓
Local official surveillance when supported
        ↓
National source
        ↓
Regional source when relevant
        ↓
WHO fallback
```

For countries without a dedicated connected machine-readable national/local feed, Swasthya still uses WHO outbreak intelligence and links to the configured national health authority. `data/country-health-providers.json` contains the growing authority and emergency-number registry.

## Environmental health context

The browser currently uses Open-Meteo for modelled weather and European AQI because it does not require a browser-side secret. Current interpretation considers rain, apparent temperature, cold, wind, UV and AQI as supporting exposure detail.

AQI is deliberately secondary in the citizen-facing experience. Swasthya prioritises health meaning and recommended action over raw pollutant KPIs.

## My Health — Health Connect + Samsung wearable prototype

The optional My Health page now supports a real wearable-summary integration path rather than only a visual placeholder.

```text
Galaxy Watch
    ↓
Samsung Health
    ↓
Health Connect
    ↓
Swasthya Android companion
    ↓
on-device derived summary
    ↓
wearable-bridge.js
    ↓
My Health + user's mood anchor
```

Implemented:

- Android Health Connect companion scaffold under `android/health-connect-companion/`
- Explicit read-permission flow
- Steps, heart-rate, resting-heart-rate, sleep, oxygen-saturation and HRV-RMSSD support where Health Connect contains those records
- 24-hour summary plus 14-day personal-baseline comparison
- Browser/WebView bridge through `wearable-bridge.js`
- Manual JSON-import fallback for testing
- Session-only wearable summary storage in the current prototype
- Self-reported anchors: `Happy`, `Calm`, `Focused`, `Stressed`, `Low`, `Tired`
- Descriptive physiology states such as `Near your recent baseline`, `Mixed physiological context` and `Lower recovery / elevated arousal context`
- CI syntax checks plus Android companion compilation

The user's own label remains the source of truth for subjective mood. Wearable measurements are used to describe recovery, physiological arousal, fatigue and personal baseline deviations—not to declare that the user is happy, sad, anxious, focused or depressed.

### Why Health Connect first

Samsung Health can synchronize selected Galaxy Watch data to Health Connect with user permission. This gives Swasthya a broader Android interoperability layer and avoids making the first wearable architecture Samsung-only.

A later Samsung Health Data SDK adapter can add richer Samsung-specific fields such as Energy Score and supported sleep/temperature detail when the Samsung partnership/distribution path is justified. Samsung Health Sensor SDK should be reserved for clearly justified higher-frequency signals such as IBI/EDA/PPG rather than collecting raw streams by default.

See:

- `docs/wearables.md`
- `docs/wearable-summary.schema.json`
- `android/health-connect-companion/README.md`
- `examples/wearable-snapshot.example.json`

## Privacy principles

- Location access is explicit, optional and revocable.
- When location is used, coordinates are sent to selected weather/air and reverse-geocoding providers to retrieve context.
- The static Swasthya site does not persist exact coordinates in a backend.
- Live awareness refreshes on coarse location-cell changes rather than every GPS movement.
- Individual patient health status is never displayed.
- Wastewater signals are population-level context, never patient/exposure claims.
- Future community-health signals require privacy-preserving aggregation and minimum-participant thresholds.
- Wearable access requires explicit, granular permission and favours local feature extraction over uploading raw sensor streams.
- Personal wellbeing/wearable history must not be combined with precise location without explicit purpose, consent and security architecture.
- Before commercial persistent health history is introduced, the wearable frontend should be bundled/signed or made native rather than relying on remotely changeable web content.

## Source confidence

Every public-health item should expose provider, publication date, direct official URL, country/regional/local match, true geographic precision and source type.

**Unknown is better than wrong.** Absence of a matched item does not mean absence of disease.

## Notification limitation

The current GitHub Pages version can show browser notifications while the page is open or active. Reliable background alerts when the site is closed require a service worker, push-subscription storage and a secure backend notification service.

## Next priorities

1. Test the Health Connect companion on physical Samsung phone + Galaxy Watch hardware and confirm which Samsung-origin data types populate Health Connect.
2. Add a Samsung Health Data SDK adapter for Energy Score/richer Samsung fields if the distribution path is justified.
3. Extend fine-grained disease surveillance to more countries and lower geographies.
4. Integrate official warning/weather feeds country-by-country where licensing permits.
5. Move provider adapters into a backend canonical schema and provenance layer.
6. Add secure background push notifications.
7. Add encrypted longitudinal personal history only after consent, export/deletion and privacy/security controls are complete.

## Run the website locally

```bash
python -m http.server 8000
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/dashboard.html`

## Licence

A project licence has not yet been selected. Add an explicit licence before encouraging broad reuse or third-party distribution.
