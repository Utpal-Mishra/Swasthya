# Swasthya project brief

## 1. Project overview

Swasthya is a location-aware health, environment and wellbeing awareness platform. It is intended to help users understand potentially relevant public-health, environmental and weather-related conditions near them using transparent, source-linked and privacy-conscious information.

The project evolves an earlier healthcare ideathon concept into a practical, deployable and extensible product foundation.

## 2. Problem statement

Health-relevant information is often fragmented across public-health agencies, environmental monitoring systems, weather services, local authorities and international institutions. Users may struggle to determine:

- whether a notice applies to their location
- how current and reliable the information is
- which organisation produced it
- whether the information is official, modelled or community-sourced
- what proportionate preventive action is appropriate

Swasthya aims to reduce this fragmentation without presenting itself as a diagnostic or clinical decision-making system.

## 3. Product purpose

The platform should provide a clear, trustworthy and explainable view of health-relevant conditions by combining:

- geographic relevance
- freshness
- source authority
- severity or advisory status
- confidence and quality indicators
- direct source references
- practical, non-diagnostic guidance

## 4. Objectives

1. Build a transparent health-awareness dashboard accessible on web and mobile devices.
2. Prioritise official and institutionally trusted data sources.
3. Show the origin, freshness, coverage and limitations of every alert.
4. Protect user location through explicit consent and data minimisation.
5. Develop reusable provider adapters and canonical schemas.
6. Introduce explainable, versioned and testable risk rules.
7. Support future notifications without creating alert fatigue.
8. Maintain a structure suitable for incremental expansion beyond Ireland.

## 5. Target users

### Primary users

- Members of the public seeking local health-awareness information
- People sensitive to air pollution, weather extremes or infectious-disease notices
- Travellers or residents checking conditions in a selected area

### Secondary users

- Researchers and civic-technology contributors
- Public-interest data practitioners
- Community organisations seeking transparent source-linked information

The initial product is not designed for clinicians, emergency dispatch, medical diagnosis or individual treatment decisions.

## 6. In scope

- Location selection and optional browser geolocation
- User-controlled geographic radius
- Health and environmental signal summaries
- Air-quality and pollution awareness
- Weather-related health context
- Infectious-disease notices from official sources
- Water and environmental incident awareness
- Mental-wellbeing and verified support resources
- Emergency and local service signposting
- Source, provenance, freshness and methodology details
- Static web deployment and experimental Streamlit application
- Future server-side provider ingestion and validation

## 7. Out of scope for the initial phases

- Medical diagnosis
- Personalised treatment recommendations
- Prescription or medication advice
- Emergency triage or dispatch
- Continuous background location tracking
- Storage of detailed personal health records
- Unverified crowdsourced outbreak claims presented as official alerts
- Automated interpretation of individual symptoms
- Replacement of official agency communication

## 8. Current MVP

The current release includes:

- a mobile-responsive GitHub Pages website
- manual and browser-assisted location selection
- a configurable alert radius
- demonstration alerts filtered by distance
- category cards for planned health-awareness areas
- direct links to official reference sources
- explicit awareness and demonstration-data notices
- a Streamlit foundation for future integration work
- automated GitHub Pages deployment

## 9. Functional requirements

### Location

- Users can enter a location manually.
- Browser geolocation is optional and requires consent.
- The interface explains how location is used.
- Exact coordinates are not stored by default.

### Alerts

- Alerts can be filtered by geographic relevance.
- Each alert displays category, severity, freshness, coverage and source.
- Alerts distinguish official, modelled, estimated, community and demonstration information.
- Users can open the original provider source.

### Source transparency

- Each production record includes provenance metadata.
- Source definitions and geographic limitations are visible.
- Risk thresholds and transformation methods are documented.

### Reliability

- A failed provider must not break unrelated categories.
- Stale or invalid records must be downgraded or suppressed.
- Retrieval and validation failures must be observable.

## 10. Non-functional requirements

- Responsive and accessible interface
- Privacy by default
- Explainable processing
- Low-cost initial deployment
- Modular provider integration
- Testable schemas and risk rules
- Graceful degradation
- Clear separation of current data from demonstration content
- Secure handling of secrets and provider credentials

## 11. Success measures

### Product measures

- Percentage of displayed alerts with complete provenance
- Percentage of live records passing freshness and quality gates
- Time required to identify source, coverage and recommended action
- User ability to distinguish demonstration from verified information
- Mobile usability and accessibility outcomes

### Technical measures

- Provider ingestion success rate
- Schema-validation pass rate
- Stale-record suppression accuracy
- Alert deduplication accuracy
- Deployment success rate
- Mean time to detect provider failures

### Trust and safety measures

- Zero unlabelled demonstration records
- Zero active alerts without direct source attribution
- Zero default storage of exact user coordinates
- Documented review ownership for every live provider and risk rule

## 12. Key risks

| Risk | Mitigation |
|---|---|
| False precision | Respect source geographic resolution and explain coverage |
| Stale information | Provider-specific freshness limits and automatic expiry |
| Misinterpretation as diagnosis | Persistent product boundary and awareness notices |
| Inconsistent definitions | Preserve original units and document transformations |
| Provider instability | Isolated adapters, retries and graceful degradation |
| Alert fatigue | Material-change and severity thresholds for notifications |
| Privacy exposure | Consent, data minimisation and no default exact-location storage |
| Unclear accountability | Named owners, versioned rules and audit provenance |

## 13. Dependencies

- Suitable official or trusted public data sources
- Clear licensing and attribution conditions
- Geographic metadata of sufficient quality
- Stable retrieval methods
- Versioned schema and risk-rule definitions
- Monitoring and operational ownership before live release

## 14. Delivery approach

The project will progress through controlled phases:

1. Foundation and static demonstration
2. Schema, tests and first live provider
3. Geographic relevance and source explorer
4. Multi-provider alert engine
5. Optional notifications and saved preferences
6. International expansion and operational maturity

Detailed milestones are maintained in [roadmap.md](roadmap.md).

## 15. Definition of a trusted live alert

An alert may be labelled trusted only when:

- the source has passed onboarding review
- licensing permits the intended use
- the record passes schema validation
- freshness and geographic-quality checks pass
- the applicable risk rule is versioned and active
- provenance is complete
- user-facing limitations are present
- automated tests cover the transformation and rule logic
