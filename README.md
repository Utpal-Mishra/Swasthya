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

Current implementation includes:

- town/city geocoding with country, region and county context where available
- browser geolocation with reverse country/region/county resolution
- optional **Live Health Awareness** using coarse location-cell changes
- 1–25 km environmental/nearby-service context
- live modelled weather and air context
- **official severe-weather warnings** separated from ordinary forecasts
- dynamic `What Matters Now?` prioritisation
- country-aware official public-health intelligence
- local → national → regional → WHO health-data fallback
- country-specific health-authority links and configured emergency numbers
- nearby pharmacy, healthcare, essentials and indoor-place searches
- material-change notifications
- explicit geographic-precision labels

## Official weather warnings

Swasthya now treats an official warning as a separate, higher-trust signal rather than merely inferring danger from a forecast.

### Europe

- MeteoAlarm / EUMETNET maintained country-specific **Atom** warning feeds
- hourly cache refresh through `.github/workflows/update-weather-alerts.yml`
- moderate/yellow, severe/orange and extreme/red awareness where source text supports it
- country-feed warnings remain country/region warnings; the Swasthya radius never redefines their geography
- a warning is promoted into `What Matters Now?` only when its warning text can be matched to the resolved county/region

### United States

For U.S. browser locations, Swasthya queries the National Weather Service active-alert service for the current coordinate. Returned warnings retain the NWS area/precision.

Only locally relevant severe/extreme official warnings are eligible for warning notifications by default.

See `docs/weather-warnings.md`.

## Official public-health integration

Swasthya builds static public-health caches from authoritative sources through scheduled GitHub Actions.

Connected layers include:

- **HPSC wastewater surveillance** — catchment-level SARS-CoV-2 population surveillance for Ireland
- **HPSC Ireland** — national epidemiology/surveillance publications
- **CDC NWSS** — county/sewershed wastewater context for multiple pathogens in the United States where records are available
- **UKHSA Data Dashboard API** — England-level respiratory surveillance for COVID-19, influenza and RSV
- **ECDC** — communicable-disease threat reports and epidemiological updates for EU/EEA context
- **WHO Disease Outbreak News** — global outbreak fallback

A 5 km user radius does **not** turn country-, county- or catchment-level disease surveillance into 5 km patient data. Swasthya uses the finest geography the source genuinely supports and never manufactures smaller precision.

## Environmental health context

Open-Meteo currently supplies modelled weather and European AQI because it does not require a browser-side secret. Current interpretation considers rain, apparent temperature, cold, wind, UV and AQI as supporting exposure detail.

AQI is deliberately secondary in the citizen-facing experience. The app prioritises health meaning and recommended action over raw pollutant values. Official warnings take precedence over modelled forecast interpretation when a warning can be matched to the user's area.

## My Health — Samsung/Health Connect wearable context

The optional personal layer uses a **self-report-first** design:

```text
Galaxy Watch / Android wearable
    ↓
Samsung Health / compatible health app
    ↓
Health Connect
    ↓
Swasthya Android companion
    ↓
on-device derived summary + source attribution
    ↓
My Health + user's mood anchor
```

Implemented, when data and device support exist:

- steps
- heart rate and resting heart rate
- sleep duration
- oxygen saturation
- HRV RMSSD
- skin-temperature delta with Health Connect feature detection
- mindfulness-session duration with Health Connect feature detection
- 24-hour summary plus 14-day personal baseline
- Health Connect `DataOrigin` attribution, including identifying Samsung Health-origin records when present
- browser/WebView bridge plus manual JSON import
- session-only wearable summary storage
- self-reported anchors: `Happy`, `Calm`, `Focused`, `Stressed`, `Low`, `Tired`
- baseline-relative personal association descriptions after repeated self-reports

### What the watch is good for

Wearable information is useful for **recovery/fatigue, sleep debt, activity load and physiological arousal context**. It is not a reliable direct classifier of happiness, sadness, focus, anxiety, depression or other mental-health states.

The current logic therefore waits for repeated user labels and describes associations such as:

> When you reported `Stressed`, resting heart rate was often above your own baseline and HRV lower than baseline.

It never turns that association into a claim that the watch can predict the user's mood.

Samsung's current Health Data SDK exposes rich wellness types such as Energy Score, sleep, heart rate, skin temperature and blood oxygen, but Swasthya keeps that as a future Samsung-specific adapter rather than coupling the core architecture to one manufacturer. A future Samsung Sensor SDK path may use EDA on compatible Galaxy Watch8+ hardware for **arousal context**, still not direct emotion detection.

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
- Wearable access requires explicit granular permission and favours local feature extraction over uploading raw streams.
- Health-record source attribution is retained rather than assuming every record came from the watch.
- Personal wellbeing/wearable history must not be combined with precise location without explicit purpose, consent and security architecture.

## Trust principles

Every production signal should expose provider, timestamp, direct source, geographic precision, source type and freshness/confidence where meaningful.

**Unknown is better than wrong.** Absence of a matched disease item does not mean absence of disease; absence of a displayed weather warning does not guarantee safe conditions.

## Notification limitation

The current GitHub Pages version can show browser notifications while the page is open or active. Reliable background alerts require a service worker, push-subscription storage and a secure backend notification service.

## Next priorities

1. Test the Health Connect companion on physical Samsung phone + Galaxy Watch hardware and confirm which records actually carry Samsung Health as `DataOrigin`.
2. Replace textual MeteoAlarm region matching with its OGC EDR GeoJSON API when a production re-user token is available.
3. Add official warning providers beyond Europe and the U.S.
4. Add exercise-session timing as a stronger confounder for wearable arousal interpretation.
5. Evaluate Samsung Health Data SDK for Energy Score if the Samsung partner/distribution route is justified.
6. Extend fine-grained disease surveillance to more countries and lower geographies.
7. Move provider adapters into a backend canonical schema, provenance and secure background-push layer.
8. Add encrypted longitudinal personal history only after consent, export/deletion and privacy/security controls are complete.

## Run locally

```bash
python -m http.server 8000
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/dashboard.html`

## Licence

A project licence has not yet been selected. Add an explicit licence before encouraging broad reuse or third-party distribution.
