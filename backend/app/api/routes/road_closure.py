from fastapi import APIRouter, HTTPException, status

from app.schemas.road_closure import RoadClosureRequest, RoadClosureResponse
from app.services.digital_twin import OSMServiceError, RoadNetworkNotFoundError
from app.services.road_closure import (
    HospitalsNotFoundError,
    RoadEdgeNotFoundError,
    simulate_road_closure,
)

router = APIRouter(tags=["simulation"])


@router.post("/simulate-road-closure", response_model=RoadClosureResponse)
def simulate_closure(request: RoadClosureRequest) -> RoadClosureResponse:
    try:
        return simulate_road_closure(request)
    except RoadEdgeNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RoadNetworkNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except HospitalsNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except OSMServiceError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
