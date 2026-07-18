export interface Road {
  id: string
  coordinates: number[][]
  name: string | null
  highway: string | string[] | null
  length_meters: number
  speed_kph: number
  travel_time_seconds: number
}

export interface MapNode {
  id: string
  latitude: number
  longitude: number
}

export interface Facility {
  id: string
  name: string
  latitude: number
  longitude: number
}

export interface DigitalTwinResponse {
  roads: Road[]
  nodes: MapNode[]
  hospitals: Facility[]
  clinics: Facility[]
  schools: Facility[]
  public_facilities: Facility[]
  graph_statistics: {
    nodes: number
    edges: number
  }
}

export interface AccessibilityMetrics {
  average_travel_time_seconds: number | null
  reachable_nodes: number
  connected_components: number
  accessibility_score: number
}

export interface RoadClosureResponse {
  before: AccessibilityMetrics
  after: AccessibilityMetrics
  delta: {
    travel_time_change_percent: number | null
    reachable_node_change: number
  }
  closed_edge: Road
}
