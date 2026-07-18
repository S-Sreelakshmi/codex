import { useEffect } from 'react'
import type { LatLngBoundsExpression } from 'leaflet'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { Building2, Hospital, MapPin, School, Stethoscope } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import type { DigitalTwinResponse, Facility, FacilityPlacementResponse, Road } from '../types/api'

const facilityStyles = {
  hospital: { color: '#dc2626', label: 'Hospital', icon: Hospital },
  clinic: { color: '#2563eb', label: 'Clinic', icon: Stethoscope },
  school: { color: '#16a34a', label: 'School', icon: School },
  public: { color: '#7c3aed', label: 'Public facility', icon: Building2 },
}

function MapViewport({ twin }: { twin: DigitalTwinResponse | null }) {
  const map = useMap()
  useEffect(() => {
    if (!twin) return
    const points = twin.roads.flatMap((road) => road.coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number]))
    if (points.length > 1) map.fitBounds(points as LatLngBoundsExpression, { padding: [32, 32] })
  }, [map, twin])
  return null
}

function FacilityMarker({ facility, category }: { facility: Facility; category: keyof typeof facilityStyles }) {
  const style = facilityStyles[category]
  const Icon = style.icon
  return <CircleMarker center={[facility.latitude, facility.longitude]} radius={8} pathOptions={{ color: '#ffffff', fillColor: style.color, fillOpacity: 1, weight: 2 }}>
    <Popup><div className="flex items-center gap-2"><Icon className="h-4 w-4" style={{ color: style.color }} /><p className="font-semibold">{facility.name}</p></div><p className="mt-1 text-sm text-slate-600">{style.label}</p></Popup>
  </CircleMarker>
}

function RoadLine({ road, selected, onSelect }: { road: Road; selected: boolean; onSelect: (edgeId: string) => void }) {
  const positions = road.coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number])
  return <Polyline positions={positions} pathOptions={{ color: selected ? '#ef4444' : '#334155', weight: selected ? 5.5 : 2.5, opacity: selected ? 1 : 0.75 }} eventHandlers={{ click: () => onSelect(road.id) }}>
    <Popup><p className="font-semibold">{road.name ?? 'Unnamed road'}</p><p className="text-slate-600">{road.length_meters.toFixed(0)} m · {road.travel_time_seconds.toFixed(0)} s</p><p className="mt-1 text-sm text-red-600">Select for closure simulation.</p></Popup>
  </Polyline>
}

interface Props { twin: DigitalTwinResponse | null; selectedEdgeId: string | null; onEdgeSelect: (edgeId: string) => void; recommendedLocation: FacilityPlacementResponse['recommended_location'] | null }

export function DigitalTwinMap({ twin, selectedEdgeId, onEdgeSelect, recommendedLocation }: Props) {
  const center: [number, number] = twin?.nodes[0] ? [twin.nodes[0].latitude, twin.nodes[0].longitude] : [10.0159, 76.3419]
  return <MapContainer center={center} zoom={13} zoomControl scrollWheelZoom className="h-[600px] w-full sm:h-[660px]">
    <MapViewport twin={twin} />
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {twin?.roads.map((road) => <RoadLine key={road.id} road={road} selected={road.id === selectedEdgeId} onSelect={onEdgeSelect} />)}
    {twin?.hospitals.map((facility) => <FacilityMarker key={facility.id} facility={facility} category="hospital" />)}
    {twin?.clinics.map((facility) => <FacilityMarker key={facility.id} facility={facility} category="clinic" />)}
    {twin?.schools.map((facility) => <FacilityMarker key={facility.id} facility={facility} category="school" />)}
    {twin?.public_facilities.map((facility) => <FacilityMarker key={facility.id} facility={facility} category="public" />)}
    {recommendedLocation && <><CircleMarker center={[recommendedLocation.latitude, recommendedLocation.longitude]} radius={19} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.16, weight: 1 }} /><CircleMarker center={[recommendedLocation.latitude, recommendedLocation.longitude]} radius={10} pathOptions={{ color: '#14532d', fillColor: '#22c55e', fillOpacity: 1, weight: 3 }}><Popup><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" /><p className="font-semibold">Recommended Clinic</p></div><p className="mt-1 text-sm text-slate-600">Accessibility score: {recommendedLocation.accessibility_score.toFixed(2)}</p></Popup></CircleMarker></>}
  </MapContainer>
}
