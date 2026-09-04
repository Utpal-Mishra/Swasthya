# Wearables and personal wellbeing context

## Purpose

Wearables can strengthen Swasthya's optional **My Health** layer by adding objective wellness context around a user's own self-reported experience.

The intended question is not:

> Can the watch decide whether the user is happy, sad, stressed or focused?

It is:

> What physiological context was present when the user reported feeling happy, calm, focused, stressed, low or tired, and are there recurring personal patterns worth noticing?

This distinction is important because heart rate, sleep, activity and autonomic signals are non-specific. Exercise, illness, excitement, caffeine, temperature, stress and many other factors can produce overlapping physiological patterns.

## Integration path

The static GitHub Pages website cannot directly access the Samsung Health data store. A production implementation needs an Android companion layer.

```text
Galaxy Watch / Galaxy Ring
        ↓
Samsung Health
        ↓
Explicit user permission
        ↓
Android companion
Samsung Health Data SDK / Health Connect
        ↓
Local feature extraction
        ↓
Optional Swasthya personal profile
        ↓
User-reported mood anchor
        ↓
Personal pattern insights
```

### Phase 1 — Samsung Health Data SDK

Prefer aggregate wellness data already available in Samsung Health:

- sleep
- heart rate
- Energy Score where supported
- steps and activity summary
- exercise
- blood oxygen where supported
- skin temperature where supported

The Android companion should request the minimum permissions needed for the features the user explicitly enables.

### Phase 2 — Health Connect interoperability

Health Connect can provide a broader Android interoperability layer where appropriate. It may be useful when the user has multiple devices or health applications rather than only Samsung hardware.

### Phase 3 — optional watch-side Sensor SDK

Only add Samsung Health Sensor SDK when a use case genuinely benefits from higher-frequency watch-side measurements such as:

- inter-beat intervals
- heart-rate context
- PPG/ECG-derived research features where permitted
- skin temperature
- blood oxygen
- electrodermal activity when supported by the device/SDK

Raw physiological streams should not be collected merely because they are available.

## What to calculate

Prefer interpretable, personal-baseline features rather than a universal emotion classifier.

### Recovery context

- sleep duration
- sleep timing and consistency
- recent sleep deficit relative to the user's baseline
- resting heart-rate deviation
- Energy Score where available

### Autonomic / arousal context

- heart-rate deviation from personal baseline
- HRV-style features from inter-beat intervals when legitimately available and sufficiently clean
- electrodermal activity features where supported
- recent exercise as a confounder

### Activity context

- recent exercise
- steps / active time
- time since strenuous activity
- sedentary duration where available

### Other context

- skin-temperature deviation from personal baseline
- blood-oxygen context where appropriate
- time of day
- self-reported caffeine/illness context only if the user chooses to provide it

## Mood anchors

The user's own label should be treated as the primary description of subjective state.

Initial lightweight anchors:

- Happy
- Calm
- Focused
- Stressed
- Low
- Tired

A future implementation can save an anchor only after explicit opt-in. The system can then compare wearable features around the anchor with the user's historical baseline.

Example future insight:

> On days you labelled yourself "Tired", your previous night's sleep was usually below your own 30-day baseline and your resting heart rate was slightly above your baseline.

Acceptable wording describes association. It does not claim that one measurement caused the mood.

## Output language

Appropriate outputs include:

- recovery appears lower than your usual baseline
- physiological arousal is elevated relative to your baseline
- recent activity may explain the elevated heart rate
- sleep has been less consistent this week
- this pattern has often coincided with your self-reported tired/stressed anchors

Avoid outputs such as:

- you are depressed
- you are anxious
- your watch proves you are stressed
- you have ADHD
- you are about to have a seizure
- you are happy because your HRV increased

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

## Current implementation status

The web dashboard contains the UX foundation and a session-only self-reported mood anchor. It does **not** currently connect to Samsung Health.

The next engineering milestone is an Android companion prototype that obtains user-consented Samsung Health data and returns a minimal local summary to the Swasthya personal layer.
