# Fine-grained public-health surveillance

Swasthya should use the finest official geography that can be justified without turning aggregate surveillance into an individual health claim.

## Current hierarchy

1. **Local / catchment surveillance** — currently HPSC SARS-CoV-2 wastewater catchments in Ireland and CDC NWSS county/sewershed context in the US.
2. **National surveillance** — competent national public-health authority outputs.
3. **Regional surveillance** — for example ECDC in the EU/EEA.
4. **Global outbreak intelligence** — WHO Disease Outbreak News.

## Irish wastewater interpretation

HPSC wastewater results can identify a named wastewater treatment catchment such as Cork City, Ballincollig or Cork Lower Harbour. Swasthya may use the catchment name and an approximate geocoded catchment place to determine whether a result is relevant to the user's selected radius.

The following rules are mandatory:

- A wastewater result is **population surveillance**, not a patient location.
- `Positive` or `Weak Positive` means SARS-CoV-2 RNA was detected in wastewater according to the HPSC report; it does not mean a particular nearby person has COVID-19.
- A geocoded place is an approximation used for relevance ranking. It is not the catchment boundary.
- Distance from the user to the geocoded catchment place must be labelled as approximate.
- If the source has no suitable geometry, Swasthya may use an explicit named-catchment match, but must not manufacture a kilometre distance.
- The user-selected radius never changes the source geography.
- `Undetectable` is not equivalent to zero infections in the population.

## Notifications

A local disease-surveillance notification should be considered only when:

- the surveillance item is recent enough for its provider,
- its geography is relevant to the current location,
- the item is new or materially changed since the previous notification,
- the wording describes surveillance context rather than personal exposure.

## Future providers

Country-specific finer-grained providers should be added only after review of authority, licence, update cadence, geography and privacy. Where a country does not publish sufficiently local surveillance, Swasthya must fall back to national, regional and WHO sources rather than infer local disease activity.
