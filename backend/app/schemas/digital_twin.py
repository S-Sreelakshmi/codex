from typing import Any

from pydantic import BaseModel, Field


class DigitalTwinQuery(BaseModel):
    """Validated query parameters for the Leaflet-ready twin endpoint."""

    latitude: float = Field(..., ge=-90, le=90, examples=[12.9716])
    longitude: float = Field(..., ge=-180, le=180, examples=[77.5946])
    radius: int = Field(default=1500, ge=100, le=10000, description="Search radius in metres")


class DigitalTwinRequest(BaseModel):
    """Legacy request shape retained for the existing POST endpoint."""

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_meters: int = Field(default=1500, ge=100, le=10000)
    network_type: str = Field(default="drive")


class RoadFeature(BaseModel):
    id: str
    coordinates: list[list[float]]
    name: str | None = None
    highway: str | list[str] | None = None
    length_meters: float
    speed_kph: float
    travel_time_seconds: float


class GraphNode(BaseModel):
    id: str
    latitude: float
    longitude: float


class PlaceOfInterest(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float


class GraphStatistics(BaseModel):
    nodes: int
    edges: int


class DigitalTwinMapResponse(BaseModel):
    roads: list[RoadFeature]
    nodes: list[GraphNode]
    hospitals: list[PlaceOfInterest]
    clinics: list[PlaceOfInterest]
    schools: list[PlaceOfInterest]
    public_facilities: list[PlaceOfInterest] = Field(
        default_factory=list,
        description="Other mapped public amenities, such as libraries and police stations.",
    )
    graph_statistics: GraphStatistics


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: list[dict[str, Any]]


class DigitalTwinResponse(BaseModel):
    """Legacy POST response for the existing frontend client."""

    center: dict[str, float]
    radius_meters: int
    road_network: GeoJSONFeatureCollection
    points_of_interest: GeoJSONFeatureCollection
    metadata: dict[str, int]
