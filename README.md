# Swasthya

Swasthya is a location-aware health intelligence and early-warning platform. It combines trusted public-health, environmental, weather and wellbeing information to help people understand nearby risks and take informed preventive action.

## Live website

**GitHub Pages:** https://utpal-mishra.github.io/Swasthya/

The GitHub Pages version is a responsive static dashboard. It uses browser-side interaction only, so location coordinates are not sent to or stored by this website. The Python/Streamlit foundation remains available for future server-side data integrations and processing.

## Vision

Move beyond a static healthcare ideathon prototype into a practical, transparent and privacy-conscious dashboard that can answer:

- What health or environmental risks are currently relevant near me?
- How far away is the issue?
- How severe and recent is it?
- Which official or trusted source reported it?
- What preventive action is reasonable?

Swasthya is an awareness and decision-support tool. It does not diagnose, treat or replace professional medical advice.

## MVP sections

1. Health overview
2. Nearby health alerts
3. Air quality and pollution
4. Weather-related health risks
5. Infectious-disease notices
6. Mental wellbeing resources
7. Emergency and local support resources
8. Source and data-quality explorer

## Trust-by-design

Every alert should include:

- source organisation
- direct source or dataset link
- official/modelled/community label
- publication and last-updated time
- geographic coverage
- distance from the user
- severity and confidence
- risk-rule explanation
- recommended preventive action

## Initial data-source priority

For Ireland, the platform will prioritise HSE, HPSC, EPA Ireland, Met Éireann, CSO, data.gov.ie and local-authority sources. European and international expansion may use ECDC, WHO, Copernicus and OpenAQ where appropriate.

## Run the Streamlit foundation locally

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
streamlit run app/app.py
```

The static website can also be previewed by opening `index.html` or serving the repository with any static web server.

## Privacy principles

- Location access must be explicit and revocable.
- Precise coordinates should not be stored by default.
- Prefer coarse geohashes or on-device distance calculations.
- Collect only data required for the current feature.
- Explain how each alert was produced.

## Deployment

A GitHub Actions workflow in `.github/workflows/pages.yml` deploys the static site whenever changes are merged or pushed to `main`.

## Status

Foundation MVP with a deployable static dashboard. Current records are deliberately marked as demonstration data. Live provider integrations will be added incrementally and must pass source, licensing, freshness and geographic-quality checks before being presented as trusted alerts.
