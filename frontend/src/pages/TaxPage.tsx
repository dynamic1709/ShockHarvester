/**
 * Tax page — tax lots overview and cooling-off periods.
 */
import { useEffect, useState } from 'react'
import api from '../api'

interface CoolingEntry {
  id: string
  client_id: string
  security_id: string
  unblock_date: string
}

export default function TaxPage() {
  const [cooling, setCooling] = useState<CoolingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/tax/cooling-off').then(({ data }) => setCooling(data)).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tax & Cooling-Off</div>
          <div className="page-subtitle">Securities blocked from repurchase after harvesting</div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div className="section-title">Active Cooling-Off Periods <span>{cooling.length} entries</span></div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /> Loading…</div>
        ) : cooling.length === 0 ? (
          <div className="loading-center" style={{ padding: 48, flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 32 }}>✅</div>
            <div style={{ color: 'var(--text-muted)' }}>No securities currently in cooling-off period.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Security ID</th>
                  <th>Unblock Date</th>
                  <th>Days Remaining</th>
                </tr>
              </thead>
              <tbody>
                {cooling.map(c => {
                  const daysLeft = Math.ceil(
                    (new Date(c.unblock_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <tr key={c.id}>
                      <td className="mono text-muted">{c.client_id.slice(0, 8)}…</td>
                      <td className="mono text-muted">{c.security_id.slice(0, 8)}…</td>
                      <td className="mono">{c.unblock_date}</td>
                      <td>
                        <span className={`badge ${daysLeft <= 7 ? 'badge-amber' : 'badge-blue'}`}>
                          {daysLeft}d
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
