from __future__ import annotations

from datetime import datetime, timezone

import pandas as pd
import streamlit as st

from services.alert_engine import build_demo_alerts


st.set_page_config(page_title="Swasthya", page_icon="🩺", layout="wide")

st.title("Swasthya")
st.caption("Location-aware health, environment and wellbeing awareness")

with st.sidebar:
    st.header("Your area")
    location = st.text_input("Location", value="Cork, Ireland")
    radius_km = st.select_slider("Alert radius", options=[1, 5, 10, 25, 50], value=10)
    st.info(
        "Location is used only to calculate nearby relevance in this MVP. "
        "Precise coordinates are not stored."
    )

st.warning(
    "Swasthya provides awareness information, not diagnosis or emergency medical advice. "
    "For urgent help, contact the appropriate emergency service."
)

alerts = build_demo_alerts(location=location, radius_km=radius_km)

col1, col2, col3, col4 = st.columns(4)
col1.metric("Area", location)
col2.metric("Alert radius", f"{radius_km} km")
col3.metric("Active signals", len(alerts))
col4.metric("Checked", datetime.now(timezone.utc).strftime("%H:%M UTC"))

sections = st.tabs(
    [
        "Overview",
        "Nearby alerts",
        "Air & environment",
        "Weather health",
        "Infectious disease",
        "Mental wellbeing",
        "Sources",
    ]
)

with sections[0]:
    st.subheader("Health situation overview")
    st.write(
        "This foundation demonstrates how alerts will be presented with severity, distance, "
        "freshness, source provenance and practical action. Live integrations will replace "
        "the clearly labelled demonstration records."
    )
    for alert in alerts:
        with st.container(border=True):
            st.markdown(f"### {alert['severity_icon']} {alert['title']}")
            st.write(alert["summary"])
            st.caption(
                f"{alert['distance_km']} km away · {alert['coverage']} · "
                f"Updated {alert['updated_at']} · Confidence: {alert['confidence']}"
            )
            st.markdown(f"**Suggested action:** {alert['recommended_action']}")
            st.markdown(
                f"**Source:** [{alert['source_name']}]({alert['source_url']}) "
                f"— `{alert['source_label']}`"
            )

with sections[1]:
    st.subheader("Nearby health alerts")
    st.dataframe(pd.DataFrame(alerts), use_container_width=True, hide_index=True)

with sections[2]:
    st.subheader("Air quality and environmental exposure")
    st.info("Planned: EPA Ireland monitoring, validated pollutant thresholds and station distance.")

with sections[3]:
    st.subheader("Weather-related health")
    st.info("Planned: heat, cold, UV, pollen, wind and severe-weather health guidance.")

with sections[4]:
    st.subheader("Infectious-disease awareness")
    st.info("Planned: official HPSC, HSE, ECDC and WHO notices with geographic applicability.")

with sections[5]:
    st.subheader("Mental wellbeing")
    st.write(
        "This section will prioritise local, verified support resources, preventive wellbeing "
        "guidance and crisis-routing information without attempting mental-health diagnosis."
    )

with sections[6]:
    st.subheader("Source transparency")
    source_rows = [
        {
            "Source": alert["source_name"],
            "Label": alert["source_label"],
            "Coverage": alert["coverage"],
            "Reference": alert["source_url"],
        }
        for alert in alerts
    ]
    st.dataframe(pd.DataFrame(source_rows).drop_duplicates(), use_container_width=True, hide_index=True)
