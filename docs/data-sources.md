# Trusted data-source policy

Swasthya must not present a signal as a trusted health alert merely because an API is available. Each provider integration must be reviewed for authority, licensing, freshness, geographic precision, stability and responsible interpretation.

## Source hierarchy

1. National public-health, environmental and meteorological authorities
2. European and international public institutions
3. Peer-reviewed or institutionally maintained research datasets
4. Validated third-party aggregators where official coverage is unavailable
5. Community reports, always separated from verified alerts

## Initial Ireland catalogue

| Domain | Preferred source | Reference | Intended use |
|---|---|---|---|
| Public health | HSE | https://www.hse.ie/ | Official health advice and services |
| Disease surveillance | HPSC | https://www.hpsc.ie/ | Surveillance reports and public-health notices |
| Air and environment | EPA Ireland | https://www.epa.ie/ | Environmental monitoring and official guidance |
| Air monitoring | AirQuality.ie | https://airquality.ie/ | Air-quality observations and station information |
| Weather | Met Éireann | https://www.met.ie/ | Forecasts and official weather warnings |
| Open government data | data.gov.ie | https://data.gov.ie/ | Discoverable Irish public datasets |
| Statistics | CSO Ireland | https://www.cso.ie/ | Population and health-related statistical context |

## European and international catalogue

| Domain | Preferred source | Reference | Intended use |
|---|---|---|---|
| European disease intelligence | ECDC | https://www.ecdc.europa.eu/ | Cross-border surveillance and risk information |
| Global public health | WHO | https://www.who.int/ | International guidance and emergency information |
| Atmosphere and environment | Copernicus | https://www.copernicus.eu/ | Modelled environmental and atmospheric products |
| Open air-quality aggregation | OpenAQ | https://openaq.org/ | Supplemental monitoring where provenance is retained |

## Required alert metadata

Every provider adapter must return:

- provider name
- source URL
- source classification: `official`, `institutional`, `modelled`, `third_party`, or `community`
- dataset or advisory title
- observed, issued and retrieved timestamps
- geographic coverage and coordinates where permitted
- units and pollutant/condition definition
- severity value and threshold standard
- confidence or quality status
- freshness state
- licensing or attribution requirement
- transformation and risk-rule version

## Presentation rules

- Demo, stale, estimated and community-sourced information must be visibly labelled.
- Never imply street-level precision from county-level data.
- Never merge differently defined measurements without explaining the conversion.
- Link to the original source, not only an aggregator.
- Show when the application last retrieved the record.
- Suppress or downgrade an alert when required fields, freshness or geographic quality fail validation.
