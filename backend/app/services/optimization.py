import networkx as nx
from app.schemas.graph import RouteResponse


def find_shortest_route(graph: nx.MultiDiGraph, source_node: int, target_node: int) -> RouteResponse:
    """Find a shortest route using OpenStreetMap edge lengths."""
    route = nx.shortest_path(graph, source_node, target_node, weight="length")
    distance = nx.path_weight(graph, route, weight="length")
    return RouteResponse(nodes=route, distance_meters=round(distance, 2))
