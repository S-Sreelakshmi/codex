import networkx as nx
import osmnx as ox


class GraphLoader:
    """Loads and retains the current OpenStreetMap road graph."""

    def __init__(self) -> None:
        self.graph: nx.MultiDiGraph | None = None
        self.place_name: str | None = None

    def load_from_place(self, place_name: str, network_type: str = "drive") -> nx.MultiDiGraph:
        self.graph = ox.graph_from_place(place_name, network_type=network_type)
        self.place_name = place_name
        return self.graph

    def summary(self) -> dict[str, int | str | None]:
        if self.graph is None:
            return {"nodes": 0, "edges": 0, "place_name": None}
        return {
            "nodes": self.graph.number_of_nodes(),
            "edges": self.graph.number_of_edges(),
            "place_name": self.place_name,
        }


graph_loader = GraphLoader()
