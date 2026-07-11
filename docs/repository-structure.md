# Repository structure and conventions

## 1. Purpose

This document explains how the Swasthya repository is organised, what each area owns and how the structure should evolve as the project moves from demonstration content to validated live integrations.

## 2. Current structure

```text
Swasthya/
├── index.html
├── styles.css
├── app.js
├── app/
│   ├── app.py
│   └── services/
│       └── alert_engine.py
├── docs/
│   ├── project-brief.md
│   ├── architecture.md
│   ├── repository-structure.md
│   ├── data-sources.md
│   ├── roadmap.md
│   └── deployment.md
├── .github/
│   └── workflows/
│       └── pages.yml
├── requirements.txt
├── .gitignore
└── README.md
```

## 3. File responsibilities

### Root static application

- `index.html` — semantic structure and content of the GitHub Pages interface
- `styles.css` — responsive layout, typography, component styling and mobile behaviour
- `app.js` — browser-side location interaction, radius filtering and demonstration-alert rendering

The static application must not contain secret credentials or private API keys.

### Python application

- `app/app.py` — Streamlit interface and experimental server-side application entry point
- `app/services/alert_engine.py` — current demonstration alert construction

As the backend grows, business logic should move out of the Streamlit page into reusable modules.

### Documentation

- `docs/project-brief.md` — business and product definition
- `docs/architecture.md` — current and target technical design
- `docs/repository-structure.md` — ownership and structural conventions
- `docs/data-sources.md` — provider-selection and data-quality policy
- `docs/roadmap.md` — phased milestones and acceptance criteria
- `docs/deployment.md` — local preview and GitHub Pages operations

### Automation

- `.github/workflows/pages.yml` — deploys the static site to GitHub Pages from `main`

### Dependency files

- `requirements.txt` — Python dependencies for the Streamlit foundation and future backend modules

## 4. Recommended target structure

When live provider integration begins, evolve toward:

```text
Swasthya/
├── web/
│   ├── index.html
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   └── data/
│       └── demo-alerts.json
├── app/
│   ├── streamlit_app.py
│   ├── api/
│   │   └── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── logging.py
│   │   └── exceptions.py
│   ├── schemas/
│   │   ├── provider.py
│   │   ├── observation.py
│   │   ├── advisory.py
│   │   ├── alert.py
│   │   └── provenance.py
│   ├── providers/
│   │   ├── base.py
│   │   ├── met_eireann.py
│   │   └── epa_air_quality.py
│   ├── services/
│   │   ├── ingestion.py
│   │   ├── validation.py
│   │   ├── geospatial.py
│   │   ├── risk_engine.py
│   │   ├── deduplication.py
│   │   └── provenance.py
│   └── rules/
│       └── health_risk_rules.yaml
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── contract/
├── scripts/
│   ├── fetch_provider_data.py
│   └── validate_sources.py
├── docs/
├── .github/workflows/
├── pyproject.toml
└── README.md
```

This target is guidance, not a requirement to introduce every directory immediately.

## 5. Structural principles

### Separate presentation from decision logic

HTML, JavaScript and Streamlit pages should display validated outputs. Provider parsing, quality checks and risk decisions belong in reusable Python modules.

### One adapter per provider

Each provider should have an isolated adapter and tests. Provider-specific fields must not leak directly into the user interface.

### Schemas before integrations

Define canonical schemas before adding multiple providers. This prevents the application from becoming a collection of incompatible payload handlers.

### Version rules and transformations

Risk rules, mappings and transformations should be version controlled and independently testable.

### Keep demo content explicit

Demonstration records should live in clearly named code or data files and must remain visibly labelled in the interface.

### Avoid premature infrastructure

Do not introduce databases, queues or caches until a documented requirement justifies them.

## 6. Naming conventions

- Python modules and functions: `snake_case`
- Python classes and schemas: `PascalCase`
- JavaScript variables and functions: `camelCase`
- Documentation files: lowercase kebab-case
- Provider adapters: use the organisation or dataset name
- Risk rules: stable identifier plus explicit version
- Branches: `agent/<clear-scope>` or standard team convention

## 7. Test organisation

### Unit tests

Cover:

- schema validation
- unit conversions
- freshness calculations
- distance and geographic logic
- risk thresholds
- deduplication decisions

### Contract tests

Verify that provider payloads still match expected fields and definitions.

### Integration tests

Test the path from provider payload through canonical schema, validation, risk processing and final alert.

### Interface tests

Check that demonstration and live records are correctly labelled and that source links and limitations remain visible.

## 8. Configuration and secrets

- Public configuration may be committed when it contains no secrets.
- API keys, tokens and credentials must use encrypted environment or deployment secrets.
- Include an example configuration file when configuration becomes necessary.
- Never log exact user location by default.

## 9. Documentation maintenance

A structural change should update:

1. `README.md`
2. this repository-structure document
3. architecture documentation when component boundaries change
4. deployment documentation when execution or hosting changes
5. roadmap status when a milestone is completed

## 10. Pull-request expectations

A meaningful feature PR should state:

- problem and scope
- files and components changed
- source and licensing implications
- privacy and safety considerations
- tests added or updated
- deployment impact
- documentation impact
