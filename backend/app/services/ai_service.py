"""
AI Report Prioritization Service
Uses LangGraph + LangChain Groq to analyze and rank civic reports by urgency/priority.
"""
from __future__ import annotations

import json
import os
from typing import Any, TypedDict

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END


# ── State schema ──────────────────────────────────────────────────────────────

class PrioritizationState(TypedDict):
    reports: list[dict]          # raw report dicts fed in
    ranked: list[dict]           # output from LLM, sorted
    error: str | None


# ── LLM setup ─────────────────────────────────────────────────────────────────

def get_llm() -> ChatGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in environment variables")
    return ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.2,
        groq_api_key=api_key,
    )


# ── Graph nodes ───────────────────────────────────────────────────────────────

def validate_reports(state: PrioritizationState) -> PrioritizationState:
    """Node 1: validate there are reports to process."""
    if not state["reports"]:
        return {**state, "ranked": [], "error": "No reports to prioritize"}
    return {**state, "error": None}


def rank_reports(state: PrioritizationState) -> PrioritizationState:
    """Node 2: call Grok LLM to score and rank reports."""
    if state.get("error"):
        return state

    reports = state["reports"]

    # Build a compact representation for the prompt
    report_lines = []
    for r in reports:
        age_h = r.get("age_hours", 0)
        report_lines.append(
            f"- ID: {r['id']} | Title: {r.get('title') or r.get('description','')[:60]}"
            f" | Category: {r['category']} | Urgency: {r['urgency']}"
            f" | Upvotes: {r.get('upvote_count', 0)} | Age: {age_h:.0f}h"
            f" | Status: {r['status']}"
        )

    report_text = "\n".join(report_lines)

    prompt = f"""You are a civic administration AI assistant. Analyze these incoming civic issue reports and rank them by priority for the admin to act on first.

Reports:
{report_text}

Scoring criteria:
- Higher urgency field = higher priority
- More upvotes = more community impact = higher priority  
- Older unresolved issues = higher priority
- Safety-critical categories (Pothole, Water Supply, Drainage/Flood, Street Light) = higher priority
- pending/verified status = needs action

Return ONLY a valid JSON array (no markdown, no extra text) like this:
[
  {{
    "id": "<report_id>",
    "priority_score": <integer 1-10>,
    "reason": "<1-2 sentence explanation>",
    "suggested_department": "<department name>"
  }}
]

Order the array from highest to lowest priority_score. Include ALL {len(reports)} reports."""

    try:
        llm = get_llm()
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()

        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        ranked = json.loads(content)
        # Sort descending by priority_score just to be safe
        ranked.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
        return {**state, "ranked": ranked}

    except json.JSONDecodeError as e:
        return {**state, "ranked": [], "error": f"LLM returned invalid JSON: {e}"}
    except Exception as e:
        return {**state, "ranked": [], "error": str(e)}


def format_output(state: PrioritizationState) -> PrioritizationState:
    """Node 3: merge AI scores back with original report data."""
    if state.get("error") or not state["ranked"]:
        return state

    # Build a lookup from original reports
    report_map = {r["id"]: r for r in state["reports"]}

    enriched = []
    for item in state["ranked"]:
        original = report_map.get(item["id"], {})
        enriched.append({
            **item,
            "title": original.get("title") or original.get("description", "")[:60],
            "category": original.get("category"),
            "urgency": original.get("urgency"),
            "status": original.get("status"),
            "upvote_count": original.get("upvote_count", 0),
            "created_at": original.get("created_at"),
            "reporter_name": original.get("reporter_name"),
        })

    return {**state, "ranked": enriched}


# ── Build the graph ────────────────────────────────────────────────────────────

def build_prioritization_graph():
    graph = StateGraph(PrioritizationState)

    graph.add_node("validate", validate_reports)
    graph.add_node("rank", rank_reports)
    graph.add_node("format", format_output)

    graph.set_entry_point("validate")
    graph.add_edge("validate", "rank")
    graph.add_edge("rank", "format")
    graph.add_edge("format", END)

    return graph.compile()


# ── Public API ─────────────────────────────────────────────────────────────────

async def prioritize_reports(reports: list[dict]) -> dict:
    """
    Run the LangGraph prioritization workflow.
    Returns {"ranked": [...], "error": None | str}
    """
    graph = build_prioritization_graph()
    initial_state: PrioritizationState = {
        "reports": reports,
        "ranked": [],
        "error": None,
    }
    # LangGraph's compiled graph is synchronous; run in thread pool to stay async-safe
    import asyncio
    result = await asyncio.get_event_loop().run_in_executor(
        None, graph.invoke, initial_state
    )
    return {"ranked": result["ranked"], "error": result.get("error")}
