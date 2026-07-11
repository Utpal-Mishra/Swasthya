# Trusted data-source policy

## 1. Purpose

Swasthya must not present information as a trusted health alert merely because an API, webpage or dataset is publicly accessible. Every integration must be assessed for authority, licensing, freshness, geographic precision, stability, interpretability and responsible use.

This policy defines the minimum conditions for accepting, transforming and presenting external information.

## 2. Source hierarchy

Sources should generally be prioritised in this order:

1. National public-health, environmental and meteorological authorities
2. European and international public institutions
3. Local authorities and public-service bodies
4. Peer-reviewed or institutionally maintained research datasets
5. Validated third-party aggregators where official coverage is unavailable
6. Community reports, always separated from verified alerts

A lower-ranked source may supplement official coverage but should not silently replace or contradict a more authoritative source.

## 3. Source onboarding checklist

Before integration, document:

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
- contact or escalation route where available
- intended Swasthya use and prohibited interpretations

## 4. Initial Ireland catalogue

| Domain | Preferred source | Reference | Intended use | Current status |
|---|---|---|---|---|
| Public health | HSE | https://www.hse.ie/ | Official health advice and services | Reference only |
| Disease surveillance | HPSC | https://www.hpsc.ie/ | Surveillance reports and public-health notices | Reference only |
| Air and environment | EPA Ireland | https://www.epa.ie/ | Environmental monitoring and official guidance | Candidate |
| Air monitoring | AirQuality.ie | https://airquality.ie/ | Air-quality observations and station information | Candidate |
| Weather | Met Éireann | https://www.met.ie/ | Forecasts and official warnings | Candidate |
| Open government data | data.gov.ie | https://data.gov.ie/ | Discovery of Irish public datasets | Discovery source |
| Statistics | CSO Ireland | https://www.cso.ie/ | Population and health-related context | Contextual |
| Local services | Local authorities | Varies | Environmental incidents and local notices | Future review |

`Reference only` means the current interface links to the organisation but does not ingest its data. `Candidate` means an adapter may be designed after technical and licensing review.

## 5. European and international catalogue

| Domain | Preferred source | Reference | Intended use | Current status |
|---|---|---|---|---|
| European disease intelligence | ECDC | https://www.ecdc.europa.eu/ | Cross-border surveillance and risk information | Future review |
| Global public health | WHO | https://www.who.int/ | International guidance and emergency information | Reference only |
| Atmosphere and environment | Copernicus | https://www.copernicus.eu/ | Modelled environmental and atmospheric products | Future review |
| Open air-quality aggregation | OpenAQ | https://openaq.org/ | Supplemental monitoring with retained provenance | Future review |

## 6. Required provider metadata

Each provider configuration should include:

- unique provider identifier
- provider name and source URL
- source classification: `official`, `institutional`, `modelled`, `third_party` or `community`
- dataset or advisory title
- licence and attribution requirement
- expected update cadence
- freshness threshold
- supported geography
- geographic resolution
- units and definitions
- adapter version
- owner and review status

## 7. Required observation and alert metadata

Every canonical record should retain:

- original provider record identifier
- observed, issued, published and retrieved timestamps where available
- geographic coverage and coordinates where permitted
- original measurement, units and definition
- quality flags supplied by the source
- transformation history
- schema version
- severity or advisory status
- threshold standard and risk-rule version
- confidence or quality status
- freshness state
- direct source reference

## 8. Freshness policy

Freshness limits must be provider- and category-specific. The system should:

- calculate age from the most relevant source timestamp
- distinguish observation time from publication and retrieval time
- mark records as current, ageing, stale or expired
- suppress expired records from active-alert views
- retain stale records only for history or audit where permitted
- never imply that an old record represents current conditions

## 9. Geographic-quality policy

The application must respect the geographic resolution of the source:

- station-level data may describe a station, not an entire city
- county-level advisories must not be presented as street-level alerts
- modelled grids must identify their spatial resolution
- national guidance must not be assigned an artificial distance
- distance should be shown only when the source geometry supports it

## 10. Transformation policy

Transformations must be documented and testable. This includes:

- unit conversions
- timestamp normalisation
- coordinate transformations
- category mappings
- aggregation windows
- missing-value handling
- severity calculation
- deduplication and conflict resolution

Original values should remain available for provenance wherever licensing permits.

## 11. Presentation rules

- Demo, stale, estimated, modelled and community-sourced information must be visibly labelled.
- Link to the original source, not only an aggregator.
- Show when the application retrieved the record.
- Explain the geographic coverage.
- Preserve the source's terminology unless a documented mapping is used.
- Do not merge differently defined measurements without explaining the conversion.
- Suppress or downgrade records that fail mandatory freshness, licensing or quality checks.
- Never convert an informational notice into a medical diagnosis or personalised treatment recommendation.

## 12. Conflict handling

When reliable sources disagree:

1. preserve each source independently
2. check definitions, timestamps, geography and revision status
3. prioritise the competent authority for that jurisdiction and topic
4. avoid averaging incompatible values
5. disclose the disagreement when material
6. escalate unresolved conflicts for manual review

## 13. Review and ownership

Each live provider should have:

- a named technical owner
- a documented review date
- automated retrieval and schema tests
- a monitored freshness threshold
- a deactivation process
- a periodic authority, licence and quality review

No provider should remain active indefinitely without review.
