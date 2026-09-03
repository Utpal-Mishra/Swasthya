"""Minimal RSS/Atom compatibility shim used by fetch_public_health.py.

The upstream feedparser package changed its public surface in the runner image used
by this project. Swasthya only needs a small subset: loads(...).entries with dict
items exposing title, summary/description, published/updated, link and id.
Using the standard library here keeps the scheduled public-health pipeline stable.
"""
from __future__ import annotations

from types import SimpleNamespace
from xml.etree import ElementTree as ET


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def _text(node: ET.Element | None) -> str:
    if node is None:
        return ""
    return "".join(node.itertext()).strip()


def _first(parent: ET.Element, *names: str) -> ET.Element | None:
    wanted = {name.lower() for name in names}
    for child in parent.iter():
        if child is parent:
            continue
        if _local(child.tag) in wanted:
            return child
    return None


def _link(entry: ET.Element) -> str:
    for child in entry.iter():
        if _local(child.tag) != "link":
            continue
        href = child.attrib.get("href")
        if href:
            rel = child.attrib.get("rel", "alternate")
            if rel in {"alternate", ""}:
                return href
        value = _text(child)
        if value:
            return value
    return ""


def loads(content: bytes | str):
    if isinstance(content, str):
        content = content.encode("utf-8")
    root = ET.fromstring(content)
    entries = []

    candidates = [node for node in root.iter() if _local(node.tag) in {"item", "entry"}]
    for node in candidates:
        title = _text(_first(node, "title"))
        summary = _text(_first(node, "summary", "description", "content", "encoded"))
        published = _text(_first(node, "pubdate", "published", "date", "dc:date"))
        updated = _text(_first(node, "updated", "modified"))
        entry_id = _text(_first(node, "guid", "id"))
        link = _link(node)
        entries.append({
            "title": title,
            "summary": summary,
            "description": summary,
            "published": published,
            "updated": updated,
            "id": entry_id or link or title,
            "link": link,
        })

    return SimpleNamespace(entries=entries)
