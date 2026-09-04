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
- **ECDC RSS** — communicable-disease threat reports and epidemiological updates for EU/EEA context
- **WHO Disease Outbreak News (DON)** — global authoritative outbreak fallback

The scheduled data path is:

```text
WHO / ECDC / HPSC                  CDC NWSS
        ↓                             ↓
scripts/fetch_public_health.py    scripts/fetch_us_wastewater.py
        ↓                             ↓
data/public-health.json           data/us-wastewater.json
             \                       /
              \                     /
               location matching in app.js
                         ↓
                  Health Around Me
```

`.github/workflows/update-public-health.yml` runs every six hours, can be triggered manually and also refreshes after ingestion logic changes are merged to `main`.

### Ireland wastewater proximity layer

The HPSC adapter reads the latest National SARS-CoV-2 Wastewater Surveillance Programme report and extracts catchment results when HPSC publishes a machine-readable table.

Records retain county, catchment, sample date, result category, publication date, source URL and explicit geographic precision. Swasthya matches them conservatively to the user's resolved county or named catchment context.

A positive wastewater sample means SARS-CoV-2 RNA was detected in population-level wastewater surveillance. It does **not** mean an infected individual is at a particular address, that the user was exposed, or that the user is infected.

### United States county/sewershed layer

The CDC NWSS adapter is schema-tolerant across several pathogen datasets. It keeps only recent records and matches them to the user's resolved county where possible.

It deliberately avoids turning every numeric wastewater measurement into a health warning. A record is elevated only when the official dataset supplies an elevated/high category or when a clearly relative source metric such as a very high historical percentile/detection proportion supports that description. Other records remain informational.

A CDC wastewater site may serve all or only part of a county and can serve more than one county. Therefore a county match is **population surveillance context**, not evidence of a patient within the user's selected radius or proof of personal exposure.

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

This principle applies to every provider: Swasthya uses the finest geography the source genuinely supports and never manufactures smaller precision.

## Autonomous country switching

The provider selection model is:

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

For countries without a dedicated connected national/local machine-readable feed, Swasthya still uses WHO outbreak intelligence and links to the configured national health authority. `data/country-health-providers.json` contains the growing authority and emergency-number registry.

## Environmental health context

The browser currently uses Open-Meteo for modelled weather and European AQI because it does not require a browser-side secret. Current interpretation considers rain, apparent temperature, cold, wind, UV and AQI as supporting exposure detail.

AQI is deliberately secondary in the citizen-facing experience. Swasthya prioritises the health meaning and recommended action over raw pollutant KPIs.

## My Health and Samsung wearable direction

The optional My Health page now has two complementary inputs:

1. **Self-reported wellbeing** — lightweight support modes and mood anchors.
2. **Future wearable context** — consented Samsung Health / Android data around sleep, heart rate, activity, recovery and supported sensor measurements.

The current website includes a session-only mood anchor (`Happy`, `Calm`, `Focused`, `Stressed`, `Low`, `Tired`) and the wearable UX/contract, but it does **not** yet read Samsung Health directly because a static browser cannot access the Samsung Health data store.

The planned production integration uses an Android companion with Samsung Health Data SDK and/or Health Connect. The preferred interpretation is:

```text
Wearable measurements
        +
Personal baseline
        +
User's own mood anchor
        ↓
Descriptive personal association
```

Wearables may support statements such as “recovery appears lower than your usual baseline” or “this pattern often coincided with your self-reported tired days.” They must not independently declare that the user is happy, depressed, anxious, focused or clinically stressed.

See:

- `docs/wearables.md`
- `docs/wearable-summary.schema.json`

## Privacy principles

- Location access is explicit, optional and revocable.
- When location is used, coordinates are sent to selected weather/air and reverse-geocoding providers to retrieve context.
- The static Swasthya site does not persist exact coordinates in a backend.
- Live awareness refreshes on coarse location-cell changes rather than every GPS movement.
- Individual patient health status is never displayed.
- Wastewater signals are population-level context, never patient/exposure claims.
- Future community-health signals require privacy-preserving aggregation and minimum-participant thresholds.
- Wearable access requires explicit, granular permission and should favour local feature extraction over uploading raw sensor streams.
- Personal wellbeing/wearable history must not be combined with precise location without explicit purpose, consent and security architecture.

## Source confidence

Every public-health item should expose provider, publication date, direct official URL, country/regional/local match, true geographic precision and source type.

**Unknown is better than wrong.** Absence of a matched item does not mean absence of disease.

## Notification limitation

The current GitHub Pages version can show browser notifications while the page is open or active. Reliable background alerts when the site is closed require a service worker, push-subscription storage and a secure backend notification service.

## Next priorities

1. Add UKHSA machine-readable respiratory surveillance for England and other national/local adapters where geography is suitable.
2. Validate and harden CDC/HPSC local surveillance parsers against provider schema changes.
3. Integrate official warning/weather feeds country-by-country where licensing permits.
4. Build the Android companion prototype for consented Samsung Health summaries.
5. Move provider adapters into a backend canonical schema and provenance layer.
6. Add secure background push notifications.
7. Add privacy-safe community-health aggregation only after DPIA/privacy/security design.

## Run locally

```bash
python -m http.server 8000
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/dashboard.html`

## Licence

A project licence has not yet been selected. Add an explicit licence before encouraging broad reuse or third-party distribution.
