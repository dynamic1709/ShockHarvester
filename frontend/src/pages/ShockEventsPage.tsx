/**
 * Shock Events page — trigger manual shock events and view history.
 */
import { useEffect, useState } from 'react'
import api from '../api'

interface ShockEvent {
  id: string
  scenario: string
  magnitude: number
  sectors: string[]
  vol_multiplier: number
  triggered_at: string
  status: string
}

const SCENARIOS = [
  { label: 'IT Sector Crash (-15%)', scenario: 'it_crash', magnitude: 0.15, sectors: ['IT'] },
  { label: 'Financials Shock (-12%)', scenario: 'financials_shock', magnitude: 0.12, sectors: ['Financials'] },
  { label: 'Energy Selloff (-10%)', scenario: 'energy_selloff', magnitude: 0.10, sectors: ['Energy'] },
  { label: 'Market-Wide Circuit (-20%)', scenario: 'market_circuit', magnitude: 0.20, sectors: [] },
  { label: 'Custom', scenario: '', magnitude: 0.10, sectors: [] },
]

export default function ShockEventsPage() {
  const [events, setEvents] = useState<ShockEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState(SCENARIOS[0])
  const [customScenario, setCustomScenario] = useState('')
  const [customMag, setCustomMag] = useState(0.10)
  const [customSectors, setCustomSectors] = useState('')

  const loadEvents = async () => {
    try {
      const { data } = await api.get('/api/events/shocks?limit=50')
      setEvents(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEvents() }, [])

  const trigger = async () => {
    setTriggering(true)
    setError(null)
    setResult(null)
    try {
      const isCustom = selected.scenario === ''
      const body = {
        scenario: isCustom ? (customScenario || 'custom') : selected.scenario,
        magnitude: isCustom ? customMag : selected.magnitude,
        sectors: isCustom
          ? customSectors.split(',').map(s => s.trim()).filter(Boolean)
          : selected.sectors,
        vol_multiplier: 1.5,
      }
      const { data } = await api.post('/api/events/shock', body)
      setResult(
        `✅ Run complete — ${data.portfolios_rebalanced} portfolios rebalanced, ` +
        `₹${data.losses_harvested_inr.toLocaleString()} harvested, ` +
        `₹${data.tax_saved_inr.toLocaleString()} tax saved`
      )
      loadEvents()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to trigger shock event'
      setError(msg)
    } finally {
      setTriggering(false)
    }
  }

  const isCustom = selected.scenario === ''

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Shock Events</div>
          <div className="page-subtitle">Trigger intraday shock scenarios and run tax-loss harvesting</div>
        </div>
      </div>

      {/* Trigger Panel */}
      <div className="shock-panel mb-6">
        <div className="shock-panel-title">⚡ Trigger Shock Event</div>

        {result && (
          <div style={{ background: 'var(--success-dim)', border: '1px solid var(--success)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--success)', marginBottom: 16 }}>
            {result}
          </div>
        )}
        {error && (
          <div style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Scenario</label>
            <select
              id="shock-scenario"
              className="form-select"
              value={selected.scenario}
              onChange={e => setSelected(SCENARIOS.find(s => s.scenario === e.target.value) ?? SCENARIOS[SCENARIOS.length - 1])}
            >
              {SCENARIOS.map(s => (
                <option key={s.scenario} value={s.scenario}>{s.label}</option>
              ))}
            </select>
          </div>
          {isCustom && (
            <div className="form-group">
              <label className="form-label">Scenario Name</label>
              <input
                id="shock-custom-name"
                className="form-input"
                value={customScenario}
                onChange={e => setCustomScenario(e.target.value)}
                placeholder="e.g. pharma_shock"
              />
            </div>
          )}
          {!isCustom && (
            <div className="form-group">
              <label className="form-label">Magnitude</label>
              <div style={{ padding: '9px 13px', background: 'rgba(13,20,32,0.8)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--danger)', fontWeight: 700 }}>
                -{(selected.magnitude * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>

        {isCustom && (
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Magnitude (%)</label>
              <input
                id="shock-custom-mag"
                className="form-input"
                type="number"
                step="0.01"
                min="0.01"
                max="0.50"
                value={customMag}
                onChange={e => setCustomMag(parseFloat(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sectors (comma-separated)</label>
              <input
                id="shock-custom-sectors"
                className="form-input"
                value={customSectors}
                onChange={e => setCustomSectors(e.target.value)}
                placeholder="IT, Financials, Energy"
              />
            </div>
          </div>
        )}

        <button
          id="shock-trigger-btn"
          className="btn btn-danger"
          onClick={trigger}
          disabled={triggering}
        >
          {triggering ? <><div className="spinner" style={{ width: 15, height: 15 }} /> Running…</> : '⚡ Trigger & Harvest'}
        </button>
      </div>

      {/* Events table */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Event History <span>{events.length} events</span></div>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /> Loading…</div>
        ) : events.length === 0 ? (
          <div className="loading-center" style={{ padding: 40, color: 'var(--text-muted)' }}>
            No shock events triggered yet.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Triggered</th>
                  <th>Scenario</th>
                  <th>Magnitude</th>
                  <th>Sectors</th>
                  <th>Vol Multiplier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id}>
                    <td className="mono">{new Date(ev.triggered_at).toLocaleString('en-IN')}</td>
                    <td className="font-bold">{ev.scenario}</td>
                    <td className="text-danger font-bold">-{(ev.magnitude * 100).toFixed(1)}%</td>
                    <td>{ev.sectors.length > 0 ? ev.sectors.join(', ') : <span className="text-muted">All</span>}</td>
                    <td>{ev.vol_multiplier}x</td>
                    <td>
                      <span className={`badge ${ev.status === 'complete' ? 'badge-green' : ev.status === 'triggered' ? 'badge-amber' : 'badge-gray'}`}>
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
