# Swasthya

**Swasthya** is an open-source, location-aware health, environment and wellbeing awareness platform. Its purpose is to help people understand potentially relevant conditions near them through transparent, source-linked and privacy-conscious information.

> Swasthya is an awareness and decision-support product. It does not diagnose, prescribe treatment, replace professional medical advice or replace emergency services.

## Live application

**GitHub Pages:** https://utpal-mishra.github.io/Swasthya/

The deployed website is currently a responsive static MVP. All displayed health signals are clearly labelled demonstration records until validated live integrations are introduced.

## Product vision

Swasthya aims to answer five practical questions:

1. What health, environmental or weather-related conditions may be relevant near me?
2. How geographically relevant is the signal?
3. How recent, severe and reliable is it?
4. Which official or trusted source produced it?
5. What proportionate preventive action or official guidance should I review?

## Current capabilities

- Responsive GitHub Pages dashboard
- Manual location entry and optional browser geolocation
- User-controlled proximity radius
- Demonstration alert filtering by distance
- Health-awareness categories covering air, weather, infectious disease and wellbeing
- Direct links to official reference organisations
- Transparent labels distinguishing demonstration information from verified live alerts
- Python/Streamlit foundation for future server-side integrations
- Automated GitHub Pages deployment from `main`

## Planned capability areas

| Area | Intended capability |
|---|---|
| Health overview | Ranked summary of current relevant signals |
| Nearby alerts | Map and list filtered by distance, coverage and freshness |
| Air and environment | Pollutants, environmental incidents and exposure context |
| Weather health | Heat, cold, UV, severe weather and other health-relevant conditions |
| Infectious disease | Official surveillance notices and geographic applicability |
| Water and environment | Water-quality and environmental incident awareness |
| Mental wellbeing | Verified support resources and preventive wellbeing guidance |
| Local support | Health-service, urgent-care and community-resource signposting |
| Source explorer | Provenance, methods, thresholds, freshness and data-quality details |

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
User consent and location
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

The static site currently performs only browser-side interaction. The future backend will handle provider ingestion, validation, risk processing, provenance and optional notification services.

## Repository structure

```text
Swasthya/
├── index.html                      # Static GitHub Pages interface
├── styles.css                      # Responsive design and layout
├── app.js                          # Browser-side interactions and demo alerts
├── app/
│   ├── app.py                      # Streamlit application foundation
│   └── services/
│       └── alert_engine.py         # Demonstration alert construction
├── docs/
│   ├── project-brief.md            # Purpose, scope, objectives and success measures
│   ├── architecture.md             # Current and target technical architecture
│   ├── repository-structure.md     # File ownership and structural conventions
│   ├── data-sources.md             # Source-selection and validation policy
│   ├── roadmap.md                  # Phased implementation roadmap
│   └── deployment.md               # Local and GitHub Pages deployment runbook
├── .github/workflows/pages.yml     # GitHub Pages deployment workflow
├── requirements.txt                # Python dependencies
└── README.md                       # Project entry point
```

## Documentation

- [Project brief](docs/project-brief.md)
- [Architecture](docs/architecture.md)
- [Repository structure](docs/repository-structure.md)
- [Trusted data-source policy](docs/data-sources.md)
- [Implementation roadmap](docs/roadmap.md)
- [Deployment guide](docs/deployment.md)

## Run the static website locally

Open `index.html` directly, or serve the repository with a local static server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Run the Streamlit foundation locally

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
- Define retention and deletion policies before introducing accounts or saved preferences.
- Never infer or expose sensitive health status from location behaviour alone.

## Delivery status

### Completed

- Project foundation and documentation baseline
- Static, mobile-responsive awareness dashboard
- Browser-side location and radius controls
- Transparent demonstration alerts
- Streamlit scaffold
- GitHub Pages deployment workflow

### Next priorities

1. Introduce a canonical alert schema and validation tests.
2. Implement the first official provider adapter.
3. Add freshness, geographic-quality and provenance checks.
4. Replace demonstration records with verified live data in one category.
5. Add observability, failure handling and automated tests.
6. Introduce a source and methodology explorer.

## Contributing

Contributions should preserve the product’s safety, privacy and transparency principles. New providers or risk rules should include source authority, licensing, geographic precision, freshness expectations, validation logic and user-facing limitations.

## Licence

A project licence has not yet been selected. Add an explicit licence before encouraging broad reuse or third-party distribution.
