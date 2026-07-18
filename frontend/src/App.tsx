import { useState } from 'react'
import { isAxiosError } from 'axios'
import {
  Activity, BrainCircuit, Building2, Clock3, Hospital, LoaderCircle,
  MapPinned, Network, Route, School, Sparkles, Stethoscope, TriangleAlert,
} from 'lucide-react'
import { wardMindApi } from './api/wardmind'
import { DigitalTwinMap } from './components/DigitalTwinMap'
import type { DigitalTwinResponse, FacilityPlacementResponse, RoadClosureResponse } from './types/api'

const defaultLocation = { latitude: 10.0159, longitude: 76.3419, radius: 800 }

const formatSeconds = (seconds: number | null | undefined) => seconds == null ? '--' : `${seconds.toFixed(0)} sec`
const LoadingIcon = () => <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />

function MetricCard({ icon: Icon, label, value, description, tone = 'indigo' }: {
  icon: typeof Route
  label: string
  value: string
  description: string
  tone?: 'indigo' | 'red' | 'blue' | 'green' | 'amber' | 'violet'
}) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100', red: 'bg-red-50 text-red-600 ring-red-100',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100', green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100', violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  }
  return (
    <article className="dashboard-card animate-rise flex min-w-0 items-center gap-3 p-4">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${tones[tone]}`}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-1 truncate text-xl font-bold tracking-tight text-slate-950">{value}</p>
        <p className="truncate text-xs text-slate-500">{description}</p>
      </div>
    </article>
  )
}

export default function App() {
  const [twin, setTwin] = useState<DigitalTwinResponse | null>(null)
  const [simulation, setSimulation] = useState<RoadClosureResponse | null>(null)
  const [placement, setPlacement] = useState<FacilityPlacementResponse | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [loadingMap, setLoadingMap] = useState(false)
  const [loadingSimulation, setLoadingSimulation] = useState(false)
  const [loadingPlacement, setLoadingPlacement] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latitude, setLatitude] = useState(defaultLocation.latitude)
  const [longitude, setLongitude] = useState(defaultLocation.longitude)
  const [radius, setRadius] = useState(defaultLocation.radius)

  const requestError = (fallback: string, error: unknown) =>
    isAxiosError(error) && typeof error.response?.data?.detail === 'string' ? error.response.data.detail : fallback

  const loadTwin = async () => {
    setLoadingMap(true); setError(null); setSimulation(null); setPlacement(null); setSelectedEdgeId(null)
    try { setTwin(await wardMindApi.getDigitalTwin(latitude, longitude, radius)) }
    catch (loadError) { setError(requestError('Unable to load the Digital Twin.', loadError)) }
    finally { setLoadingMap(false) }
  }

  const runClosureSimulation = async () => {
    if (!selectedEdgeId) return
    setLoadingSimulation(true); setError(null)
    try { setSimulation(await wardMindApi.simulateRoadClosure(latitude, longitude, radius, selectedEdgeId)) }
    catch (simulationError) { setError(requestError('Unable to simulate this road closure.', simulationError)) }
    finally { setLoadingSimulation(false) }
  }

  const optimizeFacilityPlacement = async () => {
    if (!twin) return
    setLoadingPlacement(true); setError(null)
    try { setPlacement(await wardMindApi.optimizeFacilityPlacement(latitude, longitude, radius)) }
    catch (placementError) { setError(requestError('Unable to optimize a clinic location.', placementError)) }
    finally { setLoadingPlacement(false) }
  }

  const accessibility = placement?.recommended_location.accessibility_score ?? simulation?.after.accessibility_score ?? '--'
  const averageTime = placement?.recommended_location.average_travel_time_seconds ?? simulation?.before.average_travel_time_seconds

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <nav className="border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-indigo-200"><BrainCircuit className="h-5 w-5" /></span>
            <div><h1 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">WardMind AI</h1><p className="text-xs font-medium text-slate-500">AI-Powered Civic Decision Intelligence</p></div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Live Digital Twin</div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <header className="order-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Civic analytics workspace</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Healthcare accessibility, made actionable.</h2></div>
          {twin && <p className="text-sm font-medium text-slate-500"><Network className="mr-1 inline h-4 w-4" />{twin.graph_statistics.edges.toLocaleString()} roads · {twin.graph_statistics.nodes.toLocaleString()} nodes</p>}
        </header>

        <section className="order-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:order-2 lg:grid-cols-6">
          <MetricCard icon={Route} label="Roads" value={twin?.roads.length.toLocaleString() ?? '--'} description="Mapped segments" />
          <MetricCard icon={Hospital} label="Hospitals" value={twin?.hospitals.length.toString() ?? '--'} description="Available facilities" tone="red" />
          <MetricCard icon={Stethoscope} label="Clinics" value={twin?.clinics.length.toString() ?? '--'} description="Available facilities" tone="blue" />
          <MetricCard icon={School} label="Schools" value={twin?.schools.length.toString() ?? '--'} description="Public facilities" tone="green" />
          <MetricCard icon={Activity} label="Accessibility" value={typeof accessibility === 'number' ? accessibility.toFixed(1) : accessibility} description="Access score" tone="violet" />
          <MetricCard icon={Clock3} label="Avg travel time" value={formatSeconds(averageTime)} description="Nearest care location" tone="amber" />
        </section>

        <section className="order-2 grid gap-5 lg:order-3 lg:grid-cols-[minmax(0,1.85fr)_minmax(340px,0.85fr)]">
          <div className="dashboard-card animate-rise overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="font-bold text-slate-950">Digital Twin Map</h3><p className="text-sm text-slate-500">Interactive infrastructure and service coverage</p></div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-slate-600"><span><i className="legend-dot bg-red-500" />Hospitals</span><span><i className="legend-dot bg-blue-500" />Clinics</span><span><i className="legend-dot bg-emerald-500" />Schools</span><span><i className="legend-dot border-2 border-emerald-900 bg-green-400" />AI clinic</span></div>
            </div>
            <DigitalTwinMap twin={twin} selectedEdgeId={selectedEdgeId} onEdgeSelect={setSelectedEdgeId} recommendedLocation={placement?.recommended_location ?? null} />
          </div>

          <aside className="dashboard-card animate-rise h-fit p-5" style={{ animationDelay: '70ms' }}>
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><MapPinned className="h-5 w-5" /></span><div><h3 className="font-bold text-slate-950">Digital Twin Controls</h3><p className="text-sm text-slate-500">Configure your study area</p></div></div>
            <div className="my-5 h-px bg-slate-100" />
            <div className="space-y-4">
              <label className="field-label">Latitude<input type="number" step="any" value={latitude} onChange={(event) => setLatitude(Number(event.target.value))} className="field-input" /></label>
              <label className="field-label">Longitude<input type="number" step="any" value={longitude} onChange={(event) => setLongitude(Number(event.target.value))} className="field-input" /></label>
              <label className="field-label">Analysis radius <span className="font-normal text-slate-400">(metres)</span><input type="number" min="100" max="10000" step="100" value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="field-input" /></label>
              <button onClick={() => void loadTwin()} disabled={loadingMap} className="btn-primary">
                {loadingMap ? <><LoadingIcon /> Loading Road Network...</> : <><Network className="h-4 w-4" /> Load Digital Twin</>}
              </button>
              {error && <p role="alert" className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700"><TriangleAlert className="h-4 w-4 shrink-0" />{error}</p>}
            </div>
            <div className="my-6 h-px bg-slate-100" />
            <div className="space-y-3"><div><p className="text-sm font-bold text-slate-900">AI facility placement</p><p className="text-xs text-slate-500">Evaluate the best clinic location.</p></div>
              <button onClick={() => void optimizeFacilityPlacement()} disabled={!twin || loadingPlacement} className="btn-success">{loadingPlacement ? <><LoadingIcon /> Evaluating Candidate Locations...</> : <><Sparkles className="h-4 w-4" /> AI Recommend Best Clinic</>}</button>
            </div>
            <div className="my-6 h-px bg-slate-100" />
            <div className="space-y-3"><div><p className="text-sm font-bold text-slate-900">Road closure simulation</p><p className="text-xs text-slate-500">Measure impact on hospital access.</p></div>
              <label className="field-label">Road selection<select aria-label="Road to close" value={selectedEdgeId ?? ''} onChange={(event) => setSelectedEdgeId(event.target.value || null)} disabled={!twin} className="field-input"><option value="">Select a road from map or list</option>{twin?.roads.map((road) => <option key={road.id} value={road.id}>{road.name ?? 'Unnamed road'} ({road.length_meters.toFixed(0)} m)</option>)}</select></label>
              <button onClick={() => void runClosureSimulation()} disabled={!selectedEdgeId || loadingSimulation} className="btn-secondary">{loadingSimulation ? <><LoadingIcon /> Running Accessibility Analysis...</> : <><Route className="h-4 w-4" /> Simulate Road Closure</>}</button>
            </div>
          </aside>
        </section>

        {simulation && <section className="order-4 grid gap-4 md:grid-cols-3">
          <ResultCard title="Before simulation" value={formatSeconds(simulation.before.average_travel_time_seconds)} detail={`${simulation.before.reachable_nodes} reachable nodes`} icon={<Clock3 className="h-5 w-5" />} />
          <ResultCard title="After simulation" value={formatSeconds(simulation.after.average_travel_time_seconds)} detail={`${simulation.after.reachable_nodes} reachable nodes`} icon={<Route className="h-5 w-5" />} tone="red" />
          <ResultCard title="Accessibility impact" value={`${simulation.delta.travel_time_change_percent?.toFixed(1) ?? '--'}%`} detail={`Travel time changed by ${formatSeconds(Math.abs((simulation.after.average_travel_time_seconds ?? 0) - (simulation.before.average_travel_time_seconds ?? 0)))}`} icon={<Activity className="h-5 w-5" />} tone="violet" />
        </section>}

        {placement && <section className="order-5 grid gap-4 lg:grid-cols-3">
          <article className="dashboard-card animate-rise border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 ring-1 ring-emerald-100"><div className="flex items-center justify-between"><span className="text-sm font-bold text-emerald-800">Recommended Clinic</span><span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">AI Recommendation</span></div><p className="mt-5 text-xl font-bold text-slate-950">Best-connected care location</p><p className="mt-2 text-sm text-slate-600">Selected from {placement.candidates_evaluated} graph candidates based on live road travel times.</p></article>
          <ResultCard title="Accessibility improvement" value={`+${placement.accessibility_improvement.toFixed(2)}`} detail="Accessibility-score points" icon={<Activity className="h-5 w-5" />} tone="green" />
          <ResultCard title="Travel time saved" value={formatSeconds(placement.travel_time_improvement_seconds)} detail="Average time to nearest care" icon={<Clock3 className="h-5 w-5" />} tone="green" />
          <article className="dashboard-card animate-rise p-5 lg:col-span-3"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-emerald-600" /><div><h3 className="font-bold text-slate-950">Top Candidate Rankings</h3><p className="text-sm text-slate-500">Best clinic locations ranked by accessibility</p></div></div><ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{placement.top_candidates.map((candidate, index) => <li key={candidate.node_id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"><div className="flex items-center justify-between"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">{index + 1}</span><span className="text-xs font-bold text-emerald-700">{index === 0 ? 'Excellent' : 'Strong'}</span></div><p className="mt-4 text-sm font-bold text-slate-800">Candidate {index + 1}</p><p className="mt-1 text-xs text-slate-500">Score <b className="text-slate-800">{candidate.accessibility_score.toFixed(2)}</b></p><p className="text-xs text-slate-500">Travel time <b className="text-slate-800">{formatSeconds(candidate.average_travel_time_seconds)}</b></p></li>)}</ol></article>
        </section>}
      </div>
    </main>
  )
}

function ResultCard({ title, value, detail, icon, tone = 'indigo' }: { title: string; value: string; detail: string; icon: React.ReactNode; tone?: 'indigo' | 'red' | 'violet' | 'green' }) {
  const tones = { indigo: 'bg-indigo-50 text-indigo-600', red: 'bg-red-50 text-red-600', violet: 'bg-violet-50 text-violet-600', green: 'bg-emerald-50 text-emerald-600' }
  return <article className="dashboard-card animate-rise p-5"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span><p className="mt-5 text-sm font-semibold text-slate-500">{title}</p><p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></article>
}
