# Wearables and personal wellbeing context

## Purpose

Wearables can strengthen Swasthya's optional **My Health** layer by adding objective wellness context around a user's own self-reported experience.

The intended question is not:

> Can the watch decide whether the user is happy, sad, stressed or focused?

It is:

> What physiological context was present when the user reported feeling happy, calm, focused, stressed, low or tired, and are there recurring personal patterns worth noticing?

Heart rate, sleep, activity and autonomic signals are non-specific. Exercise, illness, excitement, caffeine, temperature, stress and many other factors can produce overlapping physiological patterns. Therefore mood labels remain user-reported.

## Implemented prototype

Swasthya now contains an Android Health Connect companion prototype under:

`android/health-connect-companion/`

The current flow is:

```text
Galaxy Watch / supported wearable
        ↓
Samsung Health / compatible Android health app
        ↓
Health Connect
        ↓
Explicit per-type permission
        ↓
Swasthya Android companion
        ↓
on-device 24 h summary + 14-day baseline
        ↓
wearable-bridge.js
        ↓
My Health
        +
user-reported mood anchor
```

The Android companion requests read access only to the supported types used by the prototype:

- steps
- heart rate
- resting heart rate
- sleep
- oxygen saturation
- HRV RMSSD

If a permission or data type is unavailable, the UI shows it as unavailable rather than estimating it.

The same summary can be imported manually into the web dashboard as JSON. An example is available at `examples/wearable-snapshot.example.json`.

## Why Health Connect is the first integration

Samsung Health can synchronize selected Galaxy Watch data into Health Connect with user permission. Health Connect gives Swasthya a broader Android interoperability layer rather than coupling the initial product to one wearable manufacturer.

It is therefore the preferred first path for commonly shared data such as:

- steps
- exercise/activity
- heart rate
- sleep
- blood oxygen when populated
- HRV when populated by the source application

A Health Connect record type existing does not guarantee Samsung Health will populate that type on every device. Swasthya must preserve `Unavailable` states.

## Samsung-specific expansion

### Samsung Health Data SDK

Samsung Health Data SDK can later add Samsung-specific wellness fields that are not assumed to be available through Health Connect, including supported values such as:

- Energy Score
- richer sleep data
- skin temperature
- blood oxygen
- heart rate
- activity summary

Samsung's distribution process for applications using the Samsung Health Data SDK includes Samsung partnership/registration requirements. It should therefore be a deliberate second adapter rather than the only product architecture.

### Samsung Health Sensor SDK

Only add the Sensor SDK when a clearly justified feature benefits from higher-frequency watch-side measurements such as:

- inter-beat intervals
- heart-rate context
- PPG / ECG-derived research features where permitted
- skin temperature
- blood oxygen
- electrodermal activity on supported devices

Raw physiological streams should not be collected merely because they are available.

## What Swasthya calculates

Prefer interpretable personal-baseline features rather than a universal emotion classifier.

### Recovery context

- sleep duration
- sleep difference from a recent baseline
- resting heart-rate deviation
- HRV deviation when available
- Samsung Energy Score in a future Samsung-specific adapter

### Autonomic / arousal context

- resting heart-rate deviation from personal baseline
- HRV RMSSD deviation when available
- recent activity as a confounder when available
- future EDA only where a supported Samsung sensor path and clear product need exist

### Activity context

- steps
- recent exercise where available
- active time where available

### Other optional context

- blood oxygen
- skin-temperature deviation from personal baseline
- time of day
- self-reported caffeine/illness context only if the user chooses to provide it

## Current heuristic language

The web bridge uses deliberately simple baseline-relative product heuristics to decide whether to describe the physiology as:

- `Near your recent baseline`
- `Mixed physiological context`
- `Lower recovery / elevated arousal context`
- `Baseline still building`

These are not clinical thresholds. They are presentation heuristics and should be replaced or validated before any clinical claim is considered.

The current prototype may treat signals such as approximately one hour less sleep than baseline, a noticeably higher resting heart rate, or lower HRV as contributors to a descriptive context. It also explicitly warns that exercise, illness, temperature, caffeine and ordinary variation can explain the same pattern.

## Mood anchors

The user's own label is the primary description of subjective state.

Current lightweight anchors:

- Happy
- Calm
- Focused
- Stressed
- Low
- Tired

The current prototype stores anchors only for the browser session. It waits for multiple anchors before describing even a basic personal association.

Example future wording:

> On days you labelled yourself `Tired`, your previous night's sleep was often below your own baseline.

Acceptable wording describes association. It does not claim that one measurement caused the mood.

## What wearable data is good for

Wearable measurements are most useful for:

- recovery / fatigue context
- sleep consistency
- physiological arousal
- stress-related context when interpreted cautiously
- activity/exertion context
- noticing personal deviations from baseline

They are much weaker as a direct classifier of:

- happiness
- sadness
- concentration/focus
- anxiety as a diagnosis
- depression
- ADHD
- seizure likelihood

`Focused` is particularly difficult to infer from wrist physiology because elevated arousal can represent concentration, exercise, stress, excitement or other states.

## Privacy and data minimisation

Default principles:

- explicit opt-in for wearable access
- granular data-type permissions
- local/on-device feature extraction where practical
- do not upload raw ECG, PPG, EDA or location by default
- store derived daily features rather than raw sensor streams when possible
- never combine precise location and sensitive wellbeing history without explicit purpose and consent
- clear data-export and deletion controls before persistent accounts are introduced
- allow wearable access to be revoked independently of other Swasthya features

The current Android prototype injects a derived summary into the public GitHub Pages frontend running in a restricted WebView. That is acceptable for development, but a commercial version handling persistent sensitive data should bundle/sign the frontend or use a native UI so health summaries are not exposed to remotely changeable application code.

## Current implementation status

Completed:

- My Health wearable UX
- session-only mood anchors
- wearable summary JSON contract
- JSON import/testing path
- `wearable-bridge.js`
- Health Connect Android companion scaffold
- Health Connect permission flow
- 24-hour wellness summary
- 14-day baseline comparison where data is available
- Android CI compile check

Next:

1. Test on a physical Samsung phone + Galaxy Watch with Samsung Health → Health Connect sync enabled.
2. Verify which Samsung-origin data types populate Health Connect for the user's watch model.
3. Add origin metadata and exercise confounders.
4. Add a Samsung Health Data SDK adapter for Energy Score/richer Samsung-only fields if the partnership/distribution path is justified.
5. Build longitudinal encrypted storage only after consent, deletion/export and privacy architecture are in place.
