# WardMind AI

> AI-Powered Civic Decision Intelligence

WardMind AI is a hyperlocal digital twin platform that helps urban planners and local governments simulate infrastructure changes before implementing them.

Using real OpenStreetMap road networks, the platform evaluates road closures, analyzes healthcare accessibility, and recommends optimal locations for new clinics using graph-based optimization.

---

##  Features

### Hyperlocal Digital Twin
- Builds a real road network from OpenStreetMap
- Interactive Leaflet map
- Displays hospitals, clinics, schools and public facilities

###  Road Closure Simulation
- Simulate closure of any selected road
- Recompute travel times
- Analyze accessibility changes
- Compare before vs after metrics

###  AI Clinic Placement Optimizer
- Evaluates multiple candidate locations
- Uses graph-based optimization
- Recommends the best clinic location
- Displays ranked candidate locations

###  Accessibility Analytics
- Average travel time
- Accessibility score
- Reachable nodes
- Infrastructure statistics

---

##  Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Leaflet

### Backend
- FastAPI
- Python

### GIS & Graph Processing
- OSMnx
- NetworkX
- OpenStreetMap
- GeoPandas
- Shapely

---

## 🧠 How It Works

1. Load a real neighborhood using OpenStreetMap.
2. Build a NetworkX graph of the road network.
3. Simulate road closures.
4. Measure accessibility changes.
5. Evaluate candidate clinic locations.
6. Recommend the optimal placement.

---

## 📈 Workflow

```
User
   │
   ▼
React Dashboard
   │
   ▼
FastAPI Backend
   │
   ▼
OpenStreetMap + OSMnx
   │
   ▼
NetworkX Road Graph
   │
   ├── Road Closure Simulation
   ├── Accessibility Analysis
   └── Clinic Placement Optimizer
   │
   ▼
Interactive Dashboard
```

---

##  Use Cases

- Urban Planning
- Healthcare Accessibility
- Smart Cities
- Disaster Preparedness
- Infrastructure Planning
- Civic Decision Support

---

##  Future Scope

- Live traffic integration
- Flood impact simulation
- AI-powered natural language scenario input
- Ambulance and emergency vehicle optimization
- Multi-city digital twins
- IoT sensor integration

---

---

##  License

MIT License
