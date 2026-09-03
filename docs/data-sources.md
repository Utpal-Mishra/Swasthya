# Trusted data-source policy

## 1. Purpose

Swasthya must not present information as a trusted health alert merely because an API, webpage or dataset is publicly accessible. Every integration must be assessed for authority, licensing, freshness, geographic precision, stability, interpretability and responsible use.

## 2. Source hierarchy

Sources are prioritised in this order:

1. National public-health, environmental and meteorological authorities
2. Regional public-health authorities such as ECDC
3. WHO and other international public institutions
4. Local authorities and public-service bodies
5. Peer-reviewed/institutional datasets
6. Validated third-party aggregators where official coverage is unavailable
7. Community reports, always separated from verified alerts

For location-aware disease intelligence, Swasthya now implements the first practical version of this hierarchy as:

```text
Resolved country
      ↓
National connected source (when available)
      ↓
Regional source (when applicable)
      ↓
WHO Disease Outbreak News fallback
```

A lower-ranked source may supplement official coverage but should not silently replace or contradict the competent authority.

## 3. Connected public-health sources

| Layer | Provider | Access | Use in Swasthya | Status |
|---|---|---|---|---|
| Global | WHO Disease Outbreak News | WHO public API | Country-matched outbreak intelligence and global fallback | **Connected** |
| EU/EEA | ECDC | Official RSS feeds | Communicable-disease threat reports and epidemiological updates | **Connected** |
| Ireland | HPSC | Epidemiology reports/publications | Irish national surveillance context | **Connected** |
| Country directory | National authorities | Registry of official URLs | Link to competent national authority when a dedicated feed is not yet connected | **Connected registry** |

The scheduled ingestion job runs through `scripts/fetch_public_health.py` and writes `data/public-health.json`.

## 4. Important limitation: publication is not proximity

The public-health cache contains official publications, not patient tracking.

Swasthya must never transform:

- a national WHO/HPSC notice into a 1 km case alert
- an EU/EEA surveillance report into a street-level exposure claim
- a report mentioning a country into evidence that a particular individual nearby is infected

When a user selects a 5 km radius, that radius applies only to data whose source geometry genuinely supports that precision. National or regional disease intelligence keeps its original geographic resolution.

## 5. Country switching

Manual place search returns a country code from the geocoder. Browser location uses a reverse-geocoding service to resolve country/region. That country code determines:

- national health-authority link
- applicable regional layer
- WHO fallback
- verified emergency information where present in the country registry

The country-provider registry is stored at `data/country-health-providers.json`.

Unknown countries fall back to WHO and do **not** receive invented emergency numbers or local surveillance claims.

## 6. Environmental sources

| Domain | Provider | Intended use | Status |
|---|---|---|---|
| Weather | Open-Meteo | Live modelled current weather context | Connected MVP |
| Air | Open-Meteo European AQI | Supporting citizen exposure context | Connected MVP |
| Official Irish weather | Met Éireann | Verification/official warnings | Reference; direct warning ingestion pending |
| Official Irish air | EPA / AirQuality.ie | Verification and future observation feed | Reference; direct station ingestion pending |

Modelled weather/air data must never be labelled as an official observation.

## 7. Source onboarding checklist

Before a new provider is integrated, document:

- provider and dataset owner
- official status and authority
- dataset purpose and population coverage
- access method and authentication requirements
- licence, attribution and redistribution conditions
- update frequency and expected latency
- geographic resolution and limitations
- field definitions, units and coding systems
- historic availability and revision behaviour
- API stability, rate limits and service expectations
- known quality issues or missing-data patterns
- intended Swasthya use and prohibited interpretations

## 8. Required record metadata

Every canonical record should retain:

- original provider record identifier
- provider name and direct source URL
- source classification
- publication/observation/retrieval timestamps where available
- country and regional tags
- original geographic precision
- source-specific quality flags
- transformation history
- schema version
- severity/importance supplied or derived
- freshness state

## 9. Freshness policy

Freshness limits are category-specific. The system should:

- calculate age from the most relevant source timestamp
- distinguish observation time from publication/retrieval time
- mark records current, ageing, stale or expired
- suppress old outbreak items from actionable notifications
- retain older reports only as surveillance/history where appropriate
- never imply that an old publication represents a current nearby case

## 10. Geographic-quality policy

- Station data describes a station or model grid, not necessarily an entire city.
- County-level advisories remain county-level.
- National guidance remains national.
- Regional ECDC intelligence remains regional unless the source explicitly identifies a country.
- Distance is shown only when source geometry actually supports distance calculation.
- Individual patient coordinates are never exposed.

## 11. Presentation rules

- Official, modelled, stale, estimated and community-sourced information must be visibly distinguished.
- Link to the original source.
- Show publication/observation date.
- Explain geographic coverage.
- Preserve source terminology unless a documented mapping is used.
- Do not infer diagnosis, personal exposure or treatment from area-level surveillance.
- Absence of a matched item must be worded as **"no recent matched item in connected feeds"**, never **"no disease nearby"**.

## 12. Privacy and country lookup

When browser location is enabled, coordinates are sent to selected data providers for environmental and country lookup. The static Swasthya site does not persist exact coordinates in a backend.

Future production architecture should consider:

- server-side provider proxying
- coarse geohashes rather than raw coordinates where possible
- documented retention rules
- DPIA/privacy review
- provider data-processing terms

## 13. Review and ownership

Each live provider should have:

- a technical owner
- a documented review date
- automated retrieval/schema tests
- a monitored freshness threshold
- a deactivation process
- periodic authority, licence and quality review

No provider should remain active indefinitely without review.
