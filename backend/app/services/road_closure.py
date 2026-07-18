"""Road-closure impact simulation using NetworkX shortest-path algorithms."""

from __future__ import annotations

import math

import networkx as nx
import osmnx as ox

from app.schemas.digital_twin import PlaceOfInterest, RoadFeature
from app.schemas.road_closure import (
    AccessibilityMetrics,
    ClosureDelta,
    RoadClosureRequest,
    RoadClosureResponse,
)
from app.services.digital_twin import (
    add_travel_time_weights,
    download_hospitals,
    download_road_graph,
    road_edge_id,
)


class RoadEdgeNotFoundError(Exception):
    """The requested edge is not part of the downloaded network."""


class HospitalsNotFoundError(Exception):
    """No hospitals were found in the selected study area."""


def _edge_index(graph: nx.MultiDiGraph) -> dict[str, tuple[int, int, int]]:
    return {
        road_edge_id(source, target, key): (source, target, key)
        for source, target, key in graph.edges(keys=True)
    }


def _closed_edge(graph: nx.MultiDiGraph, source: int, target: int, key: int) -> RoadFeature:
    data = graph.edges[source, target, key]
    geometry = data.get("geometry")
    if geometry is not None:
        coordinates = [[float(longitude), float(latitude)] for longitude, latitude in geometry.coords]
    else:
        coordinates = [
            [float(graph.nodes[source]["x"]), float(graph.nodes[source]["y"])],
            [float(graph.nodes[target]["x"]), float(graph.nodes[target]["y"])],
        ]
    highway = data.get("highway")
    return RoadFeature(
        id=road_edge_id(source, target, key),
        coordinates=coordinates,
        name=data.get("name") if isinstance(data.get("name"), str) else None,
        highway=highway,
        length_meters=round(float(data.get("length", 0.0)), 2),
        speed_kph=round(float(data["speed_kph"]), 2),
        travel_time_seconds=float(data["travel_time_seconds"]),
    )


def _hospital_node_ids(graph: nx.MultiDiGraph, hospitals: list[PlaceOfInterest]) -> set[int]:
    if not hospitals:
        raise HospitalsNotFoundError("No hospitals found within the requested radius.")
    longitudes = [hospital.longitude for hospital in hospitals]
    latitudes = [hospital.latitude for hospital in hospitals]
    nearest = ox.distance.nearest_nodes(graph, X=longitudes, Y=latitudes)
    return {int(node_id) for node_id in nearest}


def accessibility_metrics(graph: nx.MultiDiGraph, hospital_nodes: set[int]) -> AccessibilityMetrics:
    """Calculate each node's directed travel time to its nearest hospital efficiently."""
    # Paths from each road node to a hospital in G are paths from a hospital in reversed G.
    reverse_graph = graph.reverse(copy=False)
    travel_times = nx.multi_source_dijkstra_path_length(
        reverse_graph,
        hospital_nodes,
        weight="travel_time_seconds",
    )
    reachable = len(travel_times)
    average = sum(travel_times.values()) / reachable if reachable else None
    components = nx.number_weakly_connected_components(graph)
    coverage = reachable / graph.number_of_nodes() if graph.number_of_nodes() else 0.0
    # Coverage is discounted as the mean journey approaches the 15-minute planning target.
    journey_factor = math.exp(-(average or 0.0) / 900)
    score = round(100 * coverage * journey_factor, 2)
    return AccessibilityMetrics(
        average_travel_time_seconds=round(average, 2) if average is not None else None,
        reachable_nodes=reachable,
        connected_components=components,
        accessibility_score=score,
    )


def simulate_road_closure(request: RoadClosureRequest) -> RoadClosureResponse:
    """Measure hospital accessibility before and after removing one directed road edge."""
    graph = add_travel_time_weights(download_road_graph(request.latitude, request.longitude, request.radius))
    edge_location = _edge_index(graph).get(request.edge_id)
    if edge_location is None:
        raise RoadEdgeNotFoundError(f"Road edge '{request.edge_id}' was not found in this network.")
    hospitals = download_hospitals(request.latitude, request.longitude, request.radius)
    hospital_nodes = _hospital_node_ids(graph, hospitals)
    before = accessibility_metrics(graph, hospital_nodes)
    source, target, key = edge_location
    closed_edge = _closed_edge(graph, source, target, key)
    graph.remove_edge(source, target, key)
    after = accessibility_metrics(graph, hospital_nodes)
    if before.average_travel_time_seconds in (None, 0):
        travel_change = None
    elif after.average_travel_time_seconds is None:
        travel_change = None
    else:
        travel_change = round(
            (after.average_travel_time_seconds - before.average_travel_time_seconds)
            / before.average_travel_time_seconds
            * 100,
            2,
        )
    return RoadClosureResponse(
        before=before,
        after=after,
        delta=ClosureDelta(
            travel_time_change_percent=travel_change,
            reachable_node_change=after.reachable_nodes - before.reachable_nodes,
        ),
        closed_edge=closed_edge,
    )
