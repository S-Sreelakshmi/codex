import networkx as nx
from fastapi import APIRouter, HTTPException
from app.schemas.graph import GraphLoadRequest, GraphSummary, RouteRequest, RouteResponse
from app.services.graph_loader import graph_loader
from app.services.optimization import find_shortest_route

router = APIRouter(prefix="/graphs", tags=["graphs"])


@router.post("/load", response_model=GraphSummary)
def load_graph(request: GraphLoadRequest) -> GraphSummary:
    try:
        graph_loader.load_from_place(request.place_name, request.network_type)
        return GraphSummary(**graph_loader.summary())
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Could not load graph: {error}") from error


@router.get("/summary", response_model=GraphSummary)
def get_graph_summary() -> GraphSummary:
    return GraphSummary(**graph_loader.summary())


@router.post("/route", response_model=RouteResponse)
def get_route(request: RouteRequest) -> RouteResponse:
    if graph_loader.graph is None:
        raise HTTPException(status_code=409, detail="Load a graph before requesting a route.")
    try:
        return find_shortest_route(graph_loader.graph, request.source_node, request.target_node)
    except (nx.NetworkXNoPath, nx.NodeNotFound) as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
