from fastapi import APIRouter
from app.api.routes import digital_twin, graphs, health, road_closure, simulations

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(graphs.router)
api_router.include_router(simulations.router)
api_router.include_router(digital_twin.router)
api_router.include_router(road_closure.router)
