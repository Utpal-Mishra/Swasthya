# Official weather-warning layer

## Purpose

Swasthya uses modelled weather to describe current environmental context, but an official severe-weather warning should outrank a forecast-derived interpretation when the official warning can be matched to the user's resolved area.

The warning layer is deliberately separate from ordinary weather data:

```text
Current location
      ↓
Country + region
      ↓
Official warning provider
      ↓
Published warning geography
      ↓
Location relevance
      ↓
What Matters Now?
```

## Connected providers

### Europe

MeteoAlarm / EUMETNET country-specific **Atom** feeds. Legacy RSS feeds were sunset in January 2026; Atom feeds remain maintained. The cache is refreshed hourly by `.github/workflows/update-weather-alerts.yml`.

The cache stores:

- country
- source
- warning title/hazard
- severity when it can be conservatively parsed
- update timestamp
- direct warning link
- source-described geographic precision

A country-feed warning is not automatically treated as local. Swasthya only promotes a cached MeteoAlarm item into `What Matters Now?` when the warning text can be matched to the resolved subdivision/county. Otherwise it remains visible as country-level warning context and the user is told to open the source for the exact warning area.

### United States

For U.S. browser locations, Swasthya requests the National Weather Service active-alert endpoint using the current coordinate. NWS warnings returned for that point are treated as coordinate-matched official warnings and keep the NWS source geography/area description.

## Severity and notifications

The UI distinguishes moderate/yellow, severe/orange and extreme/red where available from source text. Only a severe/extreme locally relevant warning is eligible for a browser notification by default.

Warning fingerprints include country, source warning ID, severity and update time so unchanged warnings are not repeatedly notified.

## Geographic honesty

The user's `5 km` or other selected radius does not redefine an official warning boundary. For example:

- a county-level warning remains county-level
- a country-feed warning remains country-feed context unless its area can be text-matched
- an NWS point query means the current coordinate is included in an active alert returned by NWS, but the actual warning area remains the NWS polygon/area

## Failure behaviour

- Provider retrieval failure preserves the previous country's cached warning entries rather than replacing them with a false all-clear.
- If no connected warning source is available, Swasthya says so.
- Absence of a displayed warning is not a guarantee of safe conditions.
- Modelled weather and official warnings are labelled separately.

## Next

1. Replace textual MeteoAlarm area matching with the OGC EDR GeoJSON API when a production re-user token is available.
2. Add official warning providers outside Europe/US country by country.
3. Add warning expiry parsing and stricter CAP semantics.
4. Connect background push through the future Swasthya backend/service worker.
