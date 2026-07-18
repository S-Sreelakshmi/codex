from fastapi import APIRouter, HTTPException, status

from app.schemas.facility_placement import FacilityPlacementRequest, FacilityPlacementResponse
from app.services.digital_twin import OSMServiceError, RoadNetworkNotFoundError
from app.services.facility_placement import optimize_facility_placement
from app.services.road_closure import HospitalsNotFoundError

router = APIRouter(tags=["simulation"])


@router.post("/optimize-facility-placement", response_model=FacilityPlacementResponse)
def optimize_placement(request: FacilityPlacementRequest) -> FacilityPlacementResponse:
    try:
        return optimize_facility_placement(request)
    except RoadNetworkNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except HospitalsNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except OSMServiceError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
