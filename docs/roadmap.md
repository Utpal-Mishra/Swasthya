# Swasthya implementation roadmap

## 1. Roadmap principles

The roadmap prioritises trust, privacy, source quality and explainability before feature breadth. A phase is complete only when its acceptance criteria are met and documented.

## 2. Phase 0 — Foundation and public demonstration

**Status:** Completed

### Scope

- Establish repository and product identity
- Create static responsive dashboard
- Add location and radius interaction
- Add explicit demonstration records
- Add Streamlit application foundation
- Configure GitHub Pages deployment
- Establish source, privacy and architecture principles

### Acceptance criteria

- Public site deploys from `main`
- All non-live records are visibly labelled demonstration data
- No secrets or private keys exist in client code
- Location permission is optional
- Core project documentation exists

## 3. Phase 1 — Canonical schema and quality foundation

**Goal:** Create the technical contract required for trustworthy live data.

### Deliverables

- Canonical Pydantic schemas for providers, observations, advisories, alerts and provenance
- Provider base interface
- Freshness-state calculation
- Geographic-quality classification
- Source classification and licensing fields
- Structured error model
- Unit tests and representative fixtures

### Acceptance criteria

- Invalid or incomplete records fail validation
- Schema versions are explicit
- Freshness can be calculated independently of the interface
- Demonstration alerts use the same canonical alert structure
- Core validation logic has automated tests

## 4. Phase 2 — First official live provider

**Goal:** Replace one demonstration category with validated live information.

### Recommended first category

Air quality or official weather warnings, subject to access, licensing and geographic suitability review.

### Deliverables

- Completed provider onboarding checklist
- One production provider adapter
- Retrieval, retry and rate-limit handling
- Source-specific parsing and contract tests
- Canonical transformation
- Freshness and geographic-quality gates
- Provenance record and direct source link
- Clear unavailable or stale state in the interface

### Acceptance criteria

- Provider failure does not break the rest of the site
- Live records are distinguishable from demonstration content
- Stale records are not presented as current
- Every live record is traceable to the original source
- Transformation and display behaviour are tested

## 5. Phase 3 — Geographic relevance and source explorer

**Goal:** Make location applicability and methodology understandable.

### Deliverables

- Place-to-coordinate or region normalisation
- Distance and region-based relevance methods
- Source geometry and geographic-resolution handling
- Alert explanation panel
- Source and methodology explorer
- Visible timestamps, quality flags and risk-rule references

### Acceptance criteria

- No alert displays a distance unsupported by source geometry
- Users can see why an alert applies to their selected area
- National, regional, station and modelled coverage are distinguished
- Source definitions and limitations are available from the alert view

## 6. Phase 4 — Multi-provider alert engine

**Goal:** Combine multiple categories without losing source integrity.

### Deliverables

- Additional approved provider adapters
- Risk-rule registry and versioning
- Ranking and deduplication logic
- Conflict-detection process
- Provider health monitoring
- Operational audit records
- Automated integration tests

### Acceptance criteria

- Duplicate alerts are consistently handled
- Conflicting sources remain traceable and are not silently averaged
- Ranking factors are documented
- Each provider has an owner and review date
- Provider outages and stale feeds are observable

## 7. Phase 5 — Preferences and notifications

**Goal:** Deliver useful alerts without unnecessary tracking or alert fatigue.

### Deliverables

- Optional saved categories, radius and severity preferences
- Explicit consent and deletion controls
- Material-change detection
- Notification deduplication and quiet-period rules
- Email, web-push or other selected channel
- Notification audit history

### Acceptance criteria

- Notifications are opt-in
- Exact location is not stored unless necessary and consented
- Duplicate or unchanged alerts do not repeatedly notify users
- Users can disable and delete preferences
- Notification content retains source and limitation details

## 8. Phase 6 — Operational maturity and expansion

**Goal:** Prepare Swasthya for broader use and additional jurisdictions.

### Deliverables

- Production API and database where justified
- Geospatial storage and query support
- Monitoring dashboards and incident procedures
- Security and privacy review
- Accessibility review
- Explicit open-source licence
- Contributor guide and code of conduct
- New-country provider onboarding process
- Internationalisation and localisation

### Acceptance criteria

- Operational ownership is defined
- Recovery and rollback procedures are tested
- Privacy and security risks are documented
- New jurisdictions follow the same source-governance standard
- Accessibility issues are tracked and remediated

## 9. Cross-cutting workstreams

These apply to every phase:

### Trust and safety

- Maintain the awareness-not-diagnosis boundary
- Label uncertainty and modelled content
- Preserve direct source references
- Avoid personalised treatment claims

### Privacy

- Collect the minimum location information
- Avoid background tracking
- Document retention before persistence is introduced
- Keep sensitive user data separate from general preferences

### Testing

- Add unit, contract and integration tests with every live provider
- Test stale, missing and conflicting data
- Verify labels and limitations in the interface

### Documentation

- Update README, architecture, structure, data-source policy, deployment and roadmap when relevant
- Record risk-rule and provider changes

## 10. Immediate backlog

1. Add canonical Pydantic models.
2. Convert demonstration alerts to the canonical schema.
3. Add unit tests for freshness and radius filtering.
4. Complete a technical and licensing assessment for the first provider.
5. Implement provider health and failure states.
6. Add a source-detail view to the static or Streamlit interface.
7. Add an explicit project licence.
