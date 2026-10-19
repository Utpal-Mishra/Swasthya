# Wearables and personal wellbeing context

## Purpose

Wearables strengthen Swasthya's optional **My Health** layer by adding objective physiological context around a user's own self-reported experience.

The product question is not:

> Can the watch decide whether the user is happy, sad, stressed or focused?

It is:

> What recovery/arousal context was present when the user reported feeling happy, calm, focused, stressed, low or tired, and do recurring personal associations appear over time?

Heart rate, HRV, sleep, activity, skin temperature and EDA are non-specific. Exercise, illness, excitement, caffeine, heat, stress and many other factors can create overlapping patterns. **The user's own mood label remains the subjective ground truth.**

## Implemented path

```text
Galaxy Watch / supported Android wearable
        ↓
Samsung Health / compatible health app
        ↓
Health Connect
        ↓
Explicit per-type permission + feature check
        ↓
Swasthya Android companion
        ↓
on-device 24 h summary + 14-day baseline
        ↓
source attribution + wearable-bridge.js
        ↓
My Health
        +
user-reported mood anchor
```

The Android companion currently supports, when present and permitted:

- steps
- heart rate
- resting heart rate
- sleep duration
- oxygen saturation
- HRV RMSSD
- skin-temperature delta on Health Connect versions that support the feature
- mindfulness-session duration on Health Connect versions that support the feature

Optional Health Connect features are checked at runtime. Unsupported records remain unavailable rather than being estimated.

The summary also collects Health Connect `DataOrigin.packageName` values from available records. If the record origin identifies Samsung Health, Swasthya labels the summary **Samsung Health via Health Connect**. This is preferable to assuming every Health Connect measurement came from the watch.

## Samsung Health reality

Samsung Health can synchronize selected Galaxy Watch information to Health Connect after the user grants permission. The exact synchronized scope can vary by Samsung Health version and device, so the existence of a Health Connect record class does not guarantee Samsung Health will populate it.

Samsung's current Health Data SDK offers richer Samsung-specific fields including Energy Score, sleep, heart rate, skin temperature and blood oxygen. It does **not** expose a general public mood or emotion record that tells a third-party app the user is happy, sad or focused.

The first Swasthya architecture therefore remains Health Connect-first. A Samsung Health Data SDK adapter is a second-stage integration because production use requires Samsung's app/partner distribution path and a Samsung library dependency.

## What the watch is useful for

### Stronger uses

- sleep duration and sleep debt relative to personal baseline
- recovery/fatigue context
- resting-heart-rate deviations
- HRV deviations / autonomic context
- activity/exertion context
- SpO₂ context when available
- skin-temperature deviations when available
- mindfulness/breathing-session context
- Samsung Energy Score in a future Samsung-specific adapter

### Weaker uses

Do not directly classify from watch data alone:

- happiness
- sadness
- focus/concentration
- anxiety or depression
- ADHD
- seizure likelihood

`Focused` is particularly difficult because physiological arousal during concentration can overlap with stress, exercise, excitement or caffeine effects.

## Personal association learning

The web bridge stores self-reported anchors only in the browser session in the current prototype:

- Happy
- Calm
- Focused
- Stressed
- Low
- Tired

It waits for at least eight total anchors and at least three occurrences of the same label before attempting a baseline-relative description.

Example acceptable output:

> When you reported `Stressed` (4×), resting heart rate averaged above your baseline and HRV averaged below baseline. This is a personal association, not evidence that those measurements caused or can predict the mood.

This is deliberately different from an emotion classifier.

## Skin temperature and mindfulness

Skin temperature is treated as contextual physiology, not a diagnostic fever measurement. If a source supplies a meaningful delta, Swasthya can mention that it differs from the source baseline and explicitly note possible confounders.

Mindfulness records represent sessions such as meditation or breathing. A logged mindfulness session can be shown as context but is not interpreted as evidence that the person is calm or unstressed.

## Future Samsung Sensor SDK / EDA

Samsung's Sensor SDK can expose raw or processed watch-side sensors. Electrodermal activity (EDA) is especially relevant to physiological arousal, but Samsung documents EDA continuous tracking for **Galaxy Watch8 series and later**.

EDA could improve a future `arousal context` feature, but it still cannot distinguish stress from excitement or other sympathetic activation without context. It should therefore be:

- opt-in
- feature-specific
- processed on device where practical
- stored as derived features rather than raw continuous streams by default
- never marketed as direct mood detection

## Privacy and data minimisation

Default principles:

- explicit opt-in for wearable access
- granular permissions
- local/on-device feature extraction
- retain source attribution
- do not upload raw ECG, PPG, EDA or precise location by default
- store derived features rather than raw sensor streams where possible
- keep mood labels user-controlled
- provide export/deletion controls before persistent history is introduced
- never combine precise location and sensitive wellbeing history without explicit purpose and consent

The development companion currently injects a derived summary into the Swasthya WebView. A commercial version handling persistent health history should bundle/sign the frontend or use a native UI so sensitive summaries are not exposed to remotely changeable application code.

## Next

1. Test on physical Samsung phone + Galaxy Watch hardware with Samsung Health → Health Connect sync enabled.
2. Verify which records actually carry Samsung Health as `DataOrigin` for the user's device/watch combination.
3. Add exercise-session timing as a stronger arousal confounder.
4. Evaluate Samsung Health Data SDK for Energy Score only if the partner/distribution route is justified.
5. Evaluate EDA only for compatible Galaxy Watch8+ hardware and a clearly defined feature.
6. Add encrypted longitudinal storage only after consent, export/deletion and privacy controls are designed.
