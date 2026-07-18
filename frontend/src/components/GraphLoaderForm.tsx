import { useState } from 'react'

interface Props {
  loading: boolean
  onSubmit: (placeName: string) => Promise<void>
}

export function GraphLoaderForm({ loading, onSubmit }: Props) {
  const [placeName, setPlaceName] = useState('Indiranagar, Bengaluru, India')

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit(placeName)
      }}
    >
      <input
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
        value={placeName}
        onChange={(event) => setPlaceName(event.target.value)}
      />
      <button className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-50" disabled={loading}>
        {loading ? 'Loading...' : 'Load road graph'}
      </button>
    </form>
  )
}
