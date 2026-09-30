/**
 * Dashboard page — advisor's command center.
 * Shows KPI cards, recent rebalance runs, and shock event history.
 */
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import api from '../api'

interface DashboardSummary {
  total_clients: number
  total_aum_inr: number
  active_shock_events: number
  ytd_tax_saved_inr: number
  ytd_losses_harvested_inr: number
  last_run_at: string | null
}

interface RebalanceRun {
  id: string
  shock_event_id: string | null
  portfolios_checked: number
  portfolios_rebalanced: number
  tax_saved_inr: number
  losses_harvested_inr: number
  duration_ms: number | null
  status: string
  created_at: string
}

function fmt(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toFixed(0)}`
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'complete' ? 'badge-green' :
    status === 'running'  ? 'badge-blue' : 'badge-red'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [runs, setRuns] = useState<RebalanceRun[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [sumRes, runsRes] = await Promise.all([
        api.get('/api/events/dashboard'),
        api.get('/api/events/runs?limit=20'),
      ])
      setSummary(sumRes.data)
      setRuns(runsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Build chart data from runs (harvest over time)
  const chartData = [...runs]
    .reverse()
    .slice(-10)
    .map((r) => ({
      date: new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      harvested: Math.round(r.losses_harvested_inr / 1000),
      saved: Math.round(r.tax_saved_inr / 1000),
    }))

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        Loading dashboard…
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">
            {summary?.last_run_at
              ? `Last rebalance: ${new Date(summary.last_run_at).toLocaleString('en-IN')}`
              : 'No rebalance runs yet'}
          </div>
        </div>
        <button id="dash-refresh" className="btn btn-outline btn-sm" onClick={load}>
          ↺ Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Clients</div>
          <div className="stat-value blue">{summary?.total_clients ?? 0}</div>
          <div className="stat-sub">Managed accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total AUM</div>
          <div className="stat-value">{fmt(summary?.total_aum_inr ?? 0)}</div>
          <div className="stat-sub">Cash + holdings</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">YTD Tax Saved</div>
          <div className="stat-value green">{fmt(summary?.ytd_tax_saved_inr ?? 0)}</div>
          <div className="stat-sub">This financial year</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Losses Harvested</div>
          <div className="stat-value amber">{fmt(summary?.ytd_losses_harvested_inr ?? 0)}</div>
          <div className="stat-sub">YTD realized losses</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Shock Events</div>
          <div className={`stat-value ${(summary?.active_shock_events ?? 0) > 0 ? 'red' : 'green'}`}>
            {summary?.active_shock_events ?? 0}
          </div>
          <div className="stat-sub">Currently triggered</div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card mb-6">
          <div className="section-header">
            <div className="section-title">Harvest Activity <span>Last {chartData.length} runs</span></div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="harvestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="savedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,95,163,0.15)" />
                <XAxis dataKey="date" tick={{ fill: '#8899aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}K`} />
                <Tooltip
                  contentStyle={{ background: '#0d1420', border: '1px solid rgba(56,95,163,0.3)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any, name: any) => [`₹${v}K`, name === 'harvested' ? 'Losses Harvested' : 'Tax Saved']}
                />
                <Area type="monotone" dataKey="harvested" stroke="#f59e0b" strokeWidth={2} fill="url(#harvestGrad)" />
                <Area type="monotone" dataKey="saved" stroke="#10b981" strokeWidth={2} fill="url(#savedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Runs Table */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Recent Rebalance Runs <span>{runs.length} total</span></div>
        </div>
        {runs.length === 0 ? (
          <div className="loading-center" style={{ padding: 40 }}>
            <div style={{ color: 'var(--text-muted)' }}>No rebalance runs yet. Trigger a shock event to begin.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Clients Checked</th>
                  <th>Rebalanced</th>
                  <th>Losses Harvested</th>
                  <th>Tax Saved</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.id}>
                    <td className="mono">{new Date(r.created_at).toLocaleString('en-IN')}</td>
                    <td>{r.portfolios_checked}</td>
                    <td className="text-accent font-bold">{r.portfolios_rebalanced}</td>
                    <td className="text-success font-bold">{fmt(r.losses_harvested_inr)}</td>
                    <td className="text-success">{fmt(r.tax_saved_inr)}</td>
                    <td className="mono text-muted">{r.duration_ms ? `${r.duration_ms}ms` : '—'}</td>
                    <td><StatusBadge status={r.status} /></td>
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
