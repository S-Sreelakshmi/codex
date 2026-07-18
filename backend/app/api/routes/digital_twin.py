from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.digital_twin import (
    DigitalTwinRequest,
    DigitalTwinResponse,
    DigitalTwinMapResponse,
    DigitalTwinQuery,
    GeoJSONFeatureCollection,
)
from app.services.digital_twin import (
    OSMServiceError,
    RoadNetworkNotFoundError,
    build_digital_twin,
)

router = APIRouter(prefix="/digital-twin", tags=["digital twin"])


@router.get("", response_model=DigitalTwinMapResponse)
def get_digital_twin(
    query: Annotated[DigitalTwinQuery, Depends()],
) -> DigitalTwinMapResponse:
    """Return road, node, and facility data directly usable by React Leaflet."""
    try:
        return build_digital_twin(query)
    except RoadNetworkNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except OSMServiceError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error


@router.post("/build", response_model=DigitalTwinResponse, deprecated=True)
def build_twin_legacy(request: DigitalTwinRequest) -> DigitalTwinResponse:
    """Compatibility response for the original frontend GeoJSON client."""
    try:
        twin = build_digital_twin(
            DigitalTwinQuery(
                latitude=request.latitude,
                longitude=request.longitude,
                radius=request.radius_meters,
            )
        )
    except RoadNetworkNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except OSMServiceError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error

    roads = [
        {
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": road.coordinates},
            "properties": road.model_dump(exclude={"coordinates"}),
        }
        for road in twin.roads
    ]
    points_of_interest = []
    for category, places in (
        ("hospital", twin.hospitals),
        ("clinic", twin.clinics),
        ("school", twin.schools),
        ("public_facility", twin.public_facilities),
    ):
        points_of_interest.extend(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [place.longitude, place.latitude]},
                "properties": {"id": place.id, "name": place.name, "category": category},
            }
            for place in places
        )
    return DigitalTwinResponse(
        center={"latitude": request.latitude, "longitude": request.longitude},
        radius_meters=request.radius_meters,
        road_network=GeoJSONFeatureCollection(features=roads),
        points_of_interest=GeoJSONFeatureCollection(features=points_of_interest),
        metadata={
            "road_nodes": twin.graph_statistics.nodes,
            "road_edges": twin.graph_statistics.edges,
            "points_of_interest": len(points_of_interest),
        },
    )
