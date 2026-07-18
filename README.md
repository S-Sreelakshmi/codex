# WardMind AI

Starter full-stack application for ward network analysis, traffic simulation, and route optimization.

- frontend: React, TypeScript, Tailwind CSS, React Leaflet
- backend: FastAPI, NetworkX, OSMnx

Run the backend:
    cd backend
    python -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8007

Run the frontend:
    cd frontend
    npm install
    npm run dev

## Digital Twin API

GET /api/v1/digital-twin downloads driveable roads and nearby essential services.
It returns Leaflet-ready road coordinates and facility locations.

Example request:
    /api/v1/digital-twin?latitude=10.0159&longitude=76.3419&radius=800

POST /api/v1/simulate-road-closure calculates the accessibility impact for a
road selected from the Digital Twin response.
