"""Clinic-placement recommendations using the existing road accessibility model."""

from __future__ import annotations

import networkx as nx

from app.schemas.facility_placement import (
    FacilityCandidate,
    FacilityPlacementRequest,
    FacilityPlacementResponse,
)
from app.services.digital_twin import add_travel_time_weights, download_hospitals, download_road_graph
from app.services.road_closure import HospitalsNotFoundError, _hospital_node_ids, accessibility_metrics


def _candidate_nodes(graph: nx.MultiDiGraph, count: int = 12) -> list[int]:
    """Choose evenly distributed, deterministic graph nodes for a quick recommendation."""
    nodes = sorted(int(node_id) for node_id in graph.nodes)
    if not nodes:
        return []
    if len(nodes) <= count:
        return nodes
    return [nodes[index * (len(nodes) - 1) // (count - 1)] for index in range(count)]


def optimize_facility_placement(request: FacilityPlacementRequest) -> FacilityPlacementResponse:
    graph = add_travel_time_weights(download_road_graph(request.latitude, request.longitude, request.radius))
    hospitals = download_hospitals(request.latitude, request.longitude, request.radius)
    hospital_nodes = _hospital_node_ids(graph, hospitals)
    baseline = accessibility_metrics(graph, hospital_nodes)
    candidates = _candidate_nodes(graph)
    if not candidates:
        raise HospitalsNotFoundError("No road nodes were found within the requested radius.")

    ranked: list[FacilityCandidate] = []
    for node_id in candidates:
        # A candidate clinic becomes an additional care destination for the same
        # multi-source shortest-path calculation used by the closure simulator.
        metrics = accessibility_metrics(graph, hospital_nodes | {node_id})
        node = graph.nodes[node_id]
        ranked.append(
            FacilityCandidate(
                node_id=str(node_id),
                latitude=float(node["y"]),
                longitude=float(node["x"]),
                average_travel_time_seconds=metrics.average_travel_time_seconds,
                accessibility_score=metrics.accessibility_score,
            )
        )

    ranked.sort(
        key=lambda candidate: (
            candidate.accessibility_score,
            -(candidate.average_travel_time_seconds if candidate.average_travel_time_seconds is not None else float("inf")),
        ),
        reverse=True,
    )
    recommended = ranked[0]
    travel_improvement = (
        baseline.average_travel_time_seconds - recommended.average_travel_time_seconds
        if baseline.average_travel_time_seconds is not None and recommended.average_travel_time_seconds is not None
        else None
    )
    return FacilityPlacementResponse(
        baseline=baseline,
        recommended_location=recommended,
        top_candidates=ranked[:5],
        accessibility_improvement=round(recommended.accessibility_score - baseline.accessibility_score, 2),
        travel_time_improvement_seconds=round(travel_improvement, 2) if travel_improvement is not None else None,
        candidates_evaluated=len(ranked),
    )
