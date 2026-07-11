# Swasthya architecture

## 1. Architectural intent

Swasthya is designed as a transparent health-awareness platform rather than a diagnostic system. The architecture must prioritise source authority, privacy, geographic honesty, freshness, provenance and graceful failure.

The implementation is intentionally split into two layers:

1. **Static presentation layer** — the current GitHub Pages application, which provides browser-side interactions and demonstration content.
2. **Data and intelligence layer** — the planned backend responsible for trusted ingestion, validation, risk processing, provenance and optional notifications.

## 2. Current architecture

```text
GitHub repository
      |
      +-- index.html
      +-- styles.css
      +-- app.js
      |
      v
GitHub Actions Pages workflow
      |
      v
GitHub Pages static website
      |
      +-- Manual location entry
      +-- Optional browser geolocation
      +-- Radius filtering
      +-- Demonstration alert rendering
      +-- Direct official-source links
```

### Current limitations

- No live provider feeds
- No server-side processing
- No persistent user accounts or preferences
- No production alert validation
- No automated risk classification
- No notification service
- No database or audit store

These limitations are deliberate and must remain clearly visible to users.

## 3. Target end-to-end flow

```text
User consent and location
        |
        v
Location normalisation and privacy controls
        |
        v
Trusted provider adapters
        |
        v
Raw payload validation and source-specific parsing
        |
        v
Canonical observation and alert schemas
        |
        v
Freshness, licensing and geographic-quality checks
        |
        v
Geographic relevance and distance engine
        |
        v
Versioned health-risk rules
        |
        v
Ranking, deduplication and conflict handling
        |
        v
Provenance and audit record
        |
        +--> Web dashboard and source explorer
        +--> Optional user notifications
        +--> Operational monitoring and quality review
```

## 4. Core components

### 4.1 Client applications

The client layer may include:

- GitHub Pages public dashboard
- Streamlit internal or experimental dashboard
- Future progressive web application
- Future mobile or partner interfaces

Clients should consume validated canonical records rather than directly interpreting provider-specific payloads.

### 4.2 Location and privacy service

Responsibilities:

- request explicit user consent
- support manually entered location
- normalise places into coordinates or coarse geographic regions
- minimise precision by default
- calculate relevance on-device where practical
- avoid permanent storage of exact coordinates unless explicitly justified and consented

### 4.3 Provider adapters

Each provider should have an isolated adapter responsible for:

- retrieval and authentication
- rate-limit and retry handling
- source-specific parsing
- attribution and licensing metadata
- timestamp normalisation
- unit preservation
- failure reporting

One provider failure must not make the whole application unavailable.

### 4.4 Canonical schemas

At minimum, separate schemas should exist for:

- `ProviderRecord`
- `Observation`
- `Advisory`
- `Alert`
- `RiskRule`
- `ProvenanceRecord`

The canonical layer must preserve the original source definition and units while enabling consistent downstream filtering and presentation.

### 4.5 Validation and quality gates

Quality gates should check:

- required fields
- timestamp validity
- freshness window
- geographic precision
- supported units
- licensing and attribution requirements
- source authority classification
- duplicate or conflicting records
- transformation validity

A record that fails a mandatory gate should be suppressed or visibly downgraded.

### 4.6 Geographic relevance engine

The engine should determine whether a signal applies to the user based on:

- point distance
- administrative region
- source coverage polygon
- station catchment
- advisory area
- source geographic resolution

The user interface must not imply greater precision than the source provides.

### 4.7 Risk engine

The risk engine maps validated observations or advisories to transparent severity bands. Each rule should include:

- rule identifier and version
- effective date
- applicable geography
- source standard or authority
- input definition and units
- threshold logic
- affected population context where appropriate
- recommended official action
- review and expiry status

Rules should be explainable and independently testable.

### 4.8 Ranking and deduplication

Ranking may consider:

- severity
- distance or geographic relevance
- freshness
- source authority
- confidence or data quality
- material change from a previous alert
- user category preferences

Duplicate or overlapping alerts should be merged only when definitions and coverage are compatible.

### 4.9 Provenance and audit layer

Every displayed alert should be traceable to:

- provider and original record
- retrieval timestamp
- transformation history
- schema version
- risk-rule version
- geographic calculation
- quality-gate result
- final presentation decision

This layer is essential for user trust, debugging and future audit requirements.

### 4.10 Notification engine

Notifications are a later-phase component. They should be sent only when:

- a verified alert is new or materially changed
- the user opted into the category
- the alert falls within the chosen geographic scope
- severity and freshness conditions are met
- duplicate-notification rules allow delivery

## 5. Suggested target technology stack

| Layer | Initial option | Notes |
|---|---|---|
| Static client | HTML, CSS, JavaScript | Current GitHub Pages MVP |
| Experimental client | Streamlit | Suitable for rapid internal iteration |
| API service | FastAPI | Typed Python endpoints and validation |
| Validation | Pydantic | Canonical schemas and provider validation |
| Scheduled ingestion | GitHub Actions initially; managed scheduler later | Suitable for low-frequency public feeds at MVP stage |
| Operational database | PostgreSQL | Structured alerts, rules and provider state |
| Geospatial support | PostGIS | Geographic coverage and distance calculations |
| Cache | Optional Redis | Only when scale or provider limits justify it |
| Object storage | Cloud object storage | Raw payload retention where licensing permits |
| Monitoring | Structured logs and health checks | Add before live-alert release |

Technology choices should remain proportional to actual usage and data-source requirements.

## 6. Security and privacy boundaries

- No secrets in browser code or the repository.
- Provider credentials must be stored in encrypted deployment secrets.
- Input must be validated before processing or display.
- Exact location must not be logged by default.
- Stored preferences must be separated from sensitive health information.
- Administrative endpoints require authentication and least-privilege access.
- Dependencies and workflows should be regularly reviewed.

## 7. Reliability expectations

The system should:

- display provider-specific freshness status
- degrade gracefully when one provider is unavailable
- avoid retaining stale alerts as active
- expose retrieval failures internally
- retain enough provenance to reproduce decisions
- support rollback of risk rules and transformations

## 8. Planned product sections

- Personalised overview
- Nearby alerts map and list
- Air quality and pollution
- Weather-health risks
- Infectious-disease awareness
- Water and environmental incidents
- Mental wellbeing and verified support
- Emergency and local support resources
- Source and methodology explorer

## 9. Architectural decision principles

1. Prefer official sources over easier but less authoritative integrations.
2. Preserve original definitions and units.
3. Do not imply false geographic precision.
4. Make risk rules versioned and explainable.
5. Separate ingestion from presentation.
6. Fail visibly and safely rather than silently presenting uncertain information.
7. Introduce infrastructure only when it solves a demonstrated requirement.
