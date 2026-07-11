# Swasthya architecture

## Practical MVP flow

```text
User consent and location
        |
        v
Location normalisation / coarse geohash
        |
        v
Trusted provider adapters
        |
        v
Schema validation + freshness checks
        |
        v
Geographic relevance and distance engine
        |
        v
Versioned health-risk rules
        |
        v
Alert ranking and deduplication
        |
        v
Dashboard + source provenance + optional notification
```

## Core components

### Provider adapters
One adapter per official or trusted provider. Raw responses should be retained only where licensing and privacy rules permit.

### Canonical alert schema
Normalises source-specific information while preserving original units, definitions and reference URLs.

### Proximity engine
Calculates whether an observation or advisory is relevant to the user's selected radius. It must respect the actual resolution of the source.

### Risk engine
Maps validated measurements to transparent severity bands. Every rule must identify its standard, version and effective date.

### Provenance layer
Stores the source, retrieval time, transformation history, quality status and direct reference used for each displayed alert.

### Notification engine
Future component that sends notifications only when a new or materially changed verified alert meets the user's category, severity and radius preferences.

## Planned sections

- Personalised overview
- Nearby alerts map and list
- Air quality and pollution
- Weather-health risks
- Infectious-disease awareness
- Water and environmental incidents
- Mental wellbeing and verified support
- Emergency resources
- Source and methodology explorer

## Privacy controls

- Explicit opt-in before location access
- Coarse location by default
- No background location tracking in the initial release
- No permanent storage of exact coordinates by default
- User-controlled radius and notification categories
- Clear retention and deletion policy before accounts are introduced
