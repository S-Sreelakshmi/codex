"""OpenStreetMap acquisition and Leaflet-ready digital-twin transformations."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

import networkx as nx
import osmnx as ox
import requests

from app.schemas.digital_twin import (
    DigitalTwinMapResponse,
    DigitalTwinQuery,
    GraphNode,
    GraphStatistics,
    PlaceOfInterest,
    RoadFeature,
)

FACILITY_AMENITIES = {
    "hospital": "hospitals",
    "clinic": "clinics",
    "school": "schools",
    "library": "public_facilities",
    "police": "public_facilities",
    "fire_station": "public_facilities",
    "community_centre": "public_facilities",
    "townhall": "public_facilities",
    "post_office": "public_facilities",
}
DEFAULT_SPEED_KPH = {
    "motorway": 80.0,
    "trunk": 60.0,
    "primary": 45.0,
    "secondary": 35.0,
    "tertiary": 30.0,
    "residential": 25.0,
    "service": 15.0,
    "unclassified": 25.0,
}


def road_edge_id(source: int, target: int, key: int) -> str:
    """Return the stable edge identifier exposed by the Digital Twin API."""
    return f"{source}-{target}-{key}"


class RoadNetworkNotFoundError(Exception):
    """No navigable OSM road network was returned for the requested area."""


class OSMServiceError(Exception):
    """OSM or Overpass could not be reached or returned an unusable response."""


def _number(value: Any, default: float) -> float:
    if isinstance(value, (list, tuple)):
        value = value[0] if value else None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        value = value.lower().replace("km/h", "").replace("kph", "").strip()
        try:
            return float(value) * (1.60934 if "mph" in value else 1.0)
        except ValueError:
            pass
    return default


def _road_class(value: Any) -> str:
    if isinstance(value, (list, tuple)):
        value = value[0] if value else "unclassified"
    return str(value or "unclassified")


def download_road_graph(latitude: float, longitude: float, radius: int) -> nx.MultiDiGraph:
    """Download a drive network centered on a (latitude, longitude) point."""
    try:
        graph = ox.graph_from_point(
            (latitude, longitude),
            dist=radius,
            network_type="drive",
            simplify=True,
        )
    except requests.RequestException as error:
        raise OSMServiceError("Unable to reach OpenStreetMap road data.") from error
    except ValueError as error:
        raise RoadNetworkNotFoundError("No driveable roads found within this radius.") from error
    except Exception as error:
        raise OSMServiceError("OpenStreetMap road-network download failed.") from error
    if graph.number_of_nodes() == 0 or graph.number_of_edges() == 0:
        raise RoadNetworkNotFoundError("No driveable roads found within this radius.")
    return graph


def add_travel_time_weights(graph: nx.MultiDiGraph) -> nx.MultiDiGraph:
    """Ensure every edge has speed_kph and travel_time_seconds for routing."""
    for _, _, _, data in graph.edges(keys=True, data=True):
        road_class = _road_class(data.get("highway"))
        fallback_speed = DEFAULT_SPEED_KPH.get(road_class, DEFAULT_SPEED_KPH["unclassified"])
        speed_kph = max(_number(data.get("maxspeed"), fallback_speed), 5.0)
        length_meters = max(_number(data.get("length"), 0.0), 0.0)
        data["speed_kph"] = speed_kph
        data["travel_time_seconds"] = round(length_meters / (speed_kph * 1000 / 3600), 2)
    return graph


def roads_and_nodes(graph: nx.MultiDiGraph) -> tuple[list[RoadFeature], list[GraphNode]]:
    """Transform NetworkX roads/nodes into Leaflet coordinate order: [longitude, latitude]."""
    roads: list[RoadFeature] = []
    for source, target, key, data in graph.edges(keys=True, data=True):
        geometry = data.get("geometry")
        if geometry is not None:
            coordinates = [[float(lon), float(lat)] for lon, lat in geometry.coords]
        else:
            coordinates = [
                [float(graph.nodes[source]["x"]), float(graph.nodes[source]["y"])],
                [float(graph.nodes[target]["x"]), float(graph.nodes[target]["y"])],
            ]
        roads.append(
            RoadFeature(
                id=road_edge_id(source, target, key),
                coordinates=coordinates,
                name=data.get("name") if isinstance(data.get("name"), str) else None,
                highway=data.get("highway"),
                length_meters=round(_number(data.get("length"), 0.0), 2),
                speed_kph=round(float(data["speed_kph"]), 2),
                travel_time_seconds=float(data["travel_time_seconds"]),
            )
        )
    nodes = [
        GraphNode(id=str(node_id), latitude=float(data["y"]), longitude=float(data["x"]))
        for node_id, data in graph.nodes(data=True)
    ]
    return roads, nodes


def _empty_or_unavailable_facilities(error: Exception) -> bool:
    message = str(error).lower()
    return "no matching features" in message or "no data elements" in message


def download_facilities(latitude: float, longitude: float, radius: int) -> dict[str, list[PlaceOfInterest]]:
    """Download public facilities and group their representative points by amenity."""
    result: dict[str, list[PlaceOfInterest]] = defaultdict(list)
    try:
        facilities = ox.features_from_point(
            (latitude, longitude),
            tags={"amenity": list(FACILITY_AMENITIES)},
            dist=radius,
        )
    except requests.RequestException as error:
        raise OSMServiceError("Unable to reach OpenStreetMap facility data.") from error
    except Exception as error:
        if _empty_or_unavailable_facilities(error):
            return result
        raise OSMServiceError("OpenStreetMap facility download failed.") from error
    for index, facility in facilities.iterrows():
        category = FACILITY_AMENITIES.get(str(facility.get("amenity")))
        geometry = facility.geometry
        if category is None or geometry is None or geometry.is_empty:
            continue
        point = geometry if geometry.geom_type == "Point" else geometry.representative_point()
        identifier = ":".join(map(str, index)) if isinstance(index, tuple) else str(index)
        result[category].append(
            PlaceOfInterest(
                id=identifier,
                name=str(facility.get("name") or f"Unnamed {facility.get('amenity')}"),
                latitude=float(point.y),
                longitude=float(point.x),
            )
        )
    return result


def download_hospitals(latitude: float, longitude: float, radius: int) -> list[PlaceOfInterest]:
    """Fetch only hospitals for routing simulations, avoiding unrelated amenity queries."""
    try:
        facilities = ox.features_from_point(
            (latitude, longitude),
            tags={"amenity": ["hospital"]},
            dist=radius,
        )
    except requests.RequestException as error:
        raise OSMServiceError("Unable to reach OpenStreetMap hospital data.") from error
    except Exception as error:
        if _empty_or_unavailable_facilities(error):
            return []
        raise OSMServiceError("OpenStreetMap hospital download failed.") from error
    hospitals: list[PlaceOfInterest] = []
    for index, facility in facilities.iterrows():
        geometry = facility.geometry
        if geometry is None or geometry.is_empty:
            continue
        point = geometry if geometry.geom_type == "Point" else geometry.representative_point()
        identifier = ":".join(map(str, index)) if isinstance(index, tuple) else str(index)
        hospitals.append(
            PlaceOfInterest(
                id=identifier,
                name=str(facility.get("name") or "Unnamed hospital"),
                latitude=float(point.y),
                longitude=float(point.x),
            )
        )
    return hospitals


def build_digital_twin(query: DigitalTwinQuery) -> DigitalTwinMapResponse:
    """Build a real OSM-backed road graph plus map marker data."""
    graph = add_travel_time_weights(download_road_graph(query.latitude, query.longitude, query.radius))
    roads, nodes = roads_and_nodes(graph)
    facilities = download_facilities(query.latitude, query.longitude, query.radius)
    return DigitalTwinMapResponse(
        roads=roads,
        nodes=nodes,
        hospitals=facilities["hospitals"],
        clinics=facilities["clinics"],
        schools=facilities["schools"],
        public_facilities=facilities["public_facilities"],
        graph_statistics=GraphStatistics(nodes=graph.number_of_nodes(), edges=graph.number_of_edges()),
    )
