from app.schemas.simulation import SimulationRequest, SimulationResult


def run_simulation(request: SimulationRequest) -> SimulationResult:
    """Starter deterministic congestion model."""
    delay = round((request.vehicles / 50) * request.congestion_factor, 2)
    status = "clear" if delay < 5 else "moderate" if delay < 15 else "congested"
    return SimulationResult(
        vehicles=request.vehicles,
        congestion_factor=request.congestion_factor,
        estimated_delay_minutes=delay,
        network_status=status,
    )
