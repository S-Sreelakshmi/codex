import { useState } from 'react'
import { isAxiosError } from 'axios'
import { wardMindApi } from './api/wardmind'
import { DigitalTwinMap } from './components/DigitalTwinMap'
import type { DigitalTwinResponse, RoadClosureResponse } from './types/api'

const defaultLocation = { latitude: 10.0159, longitude: 76.3419, radius: 800 }

export default function App() {
  const [twin, setTwin] = useState<DigitalTwinResponse | null>(null)
  const [simulation, setSimulation] = useState<RoadClosureResponse | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [loadingMap, setLoadingMap] = useState(false)
  const [loadingSimulation, setLoadingSimulation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latitude, setLatitude] = useState(defaultLocation.latitude)
  const [longitude, setLongitude] = useState(defaultLocation.longitude)
  const [radius, setRadius] = useState(defaultLocation.radius)

  const requestError = (fallback: string, error: unknown) => {
    if (isAxiosError(error) && typeof error.response?.data?.detail === 'string') return error.response.data.detail
    return fallback
  }

  const loadTwin = async () => {
    setLoadingMap(true)
    setError(null)
    setSimulation(null)
    setSelectedEdgeId(null)
    try {
      setTwin(await wardMindApi.getDigitalTwin(latitude, longitude, radius))
    } catch (loadError) {
      setError(requestError('Unable to load the Digital Twin.', loadError))
    } finally {
      setLoadingMap(false)
    }
  }

  const runClosureSimulation = async () => {
    if (!selectedEdgeId) return
    setLoadingSimulation(true)
    setError(null)
    try {
      setSimulation(await wardMindApi.simulateRoadClosure(latitude, longitude, radius, selectedEdgeId))
    } catch (simulationError) {
      setError(requestError('Unable to simulate this road closure.', simulationError))
    } finally {
      setLoadingSimulation(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-900 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Urban intelligence</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">WardMind AI Digital Twin</h1>
            <p className="mt-1 text-slate-600">Live road infrastructure and essential-services analysis.</p>
          </div>
          {twin && <p className="text-sm text-slate-500">{twin.graph_statistics.edges.toLocaleString()} road segments · {twin.graph_statistics.nodes.toLocaleString()} nodes</p>}
        </header>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm font-medium">Latitude
              <input type="number" step="any" value={latitude} onChange={(event) => setLatitude(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-medium">Longitude
              <input type="number" step="any" value={longitude} onChange={(event) => setLongitude(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="text-sm font-medium">Radius (metres)
              <input type="number" min="100" max="10000" step="100" value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <button onClick={() => void loadTwin()} disabled={loadingMap} className="self-end rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              {loadingMap ? <><span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-0.2em]" aria-hidden="true" />Loading map...</> : 'Load Digital Twin'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-red-600" />Hospitals</span>
              <span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-blue-600" />Clinics</span>
              <span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-green-600" />Schools</span>
              <span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-violet-600" />Other public facilities</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="text-sm font-medium text-slate-700">
                <span className="sr-only">Road to close</span>
                <select
                  aria-label="Road to close"
                  value={selectedEdgeId ?? ''}
                  onChange={(event) => setSelectedEdgeId(event.target.value || null)}
                  disabled={!twin}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 sm:w-64"
                >
                  <option value="">Select a road</option>
                  {twin?.roads.map((road) => (
                    <option key={road.id} value={road.id}>
                      {road.name ?? 'Unnamed road'} ({road.length_meters.toFixed(0)} m)
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={() => void runClosureSimulation()} disabled={!selectedEdgeId || loadingSimulation} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
                {loadingSimulation ? <><span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-0.2em]" aria-hidden="true" />Simulating...</> : selectedEdgeId ? 'Simulate selected road closure' : 'Select a road to simulate'}
              </button>
            </div>
          </div>
          <DigitalTwinMap twin={twin} selectedEdgeId={selectedEdgeId} onEdgeSelect={setSelectedEdgeId} />
        </section>

        {simulation && (
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-500">Before closure</p>
              <p className="mt-2 text-2xl font-bold">{simulation.before.average_travel_time_seconds?.toFixed(0) ?? '—'} s</p>
              <p className="mt-1 text-sm text-slate-600">{simulation.before.reachable_nodes} reachable nodes</p>
            </article>
            <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-500">After closure</p>
              <p className="mt-2 text-2xl font-bold">{simulation.after.average_travel_time_seconds?.toFixed(0) ?? '—'} s</p>
              <p className="mt-1 text-sm text-slate-600">{simulation.after.reachable_nodes} reachable nodes</p>
            </article>
            <article className="rounded-xl bg-indigo-700 p-5 text-white shadow-sm">
              <p className="text-sm font-medium text-indigo-100">Accessibility impact</p>
              <p className="mt-2 text-2xl font-bold">{simulation.delta.travel_time_change_percent?.toFixed(1) ?? '—'}%</p>
              <p className="mt-1 text-sm text-indigo-100">Travel-time change · {simulation.delta.reachable_node_change} reachable-node change</p>
            </article>
          </section>
        )}
      </div>
    </main>
  )
}
