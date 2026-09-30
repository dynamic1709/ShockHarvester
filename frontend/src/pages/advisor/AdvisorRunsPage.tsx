import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  CheckCircle2,
  Eye,
  X,
} from 'lucide-react'

interface RunSummary {
  id: string
  scenario_name: string
  magnitude: number
  status: string
  portfolios_checked: number
  portfolios_rebalanced: number
  blocked_trades: number
  duration_ms: number
  tax_saved_inr: number
  losses_harvested_inr: number
  stage_timings: Record<string, number>
  created_at: string
}

interface RunDetail extends RunSummary {
  sample_trades: Array<{
    id: string
    client_name: string
    symbol: string
    side: string
    qty: number
    price: number
    amount: number
  }>
  guardrail_violations: Array<{
    id: string
    client_name: string
    symbol: string
    rule: string
    detail: string
  }>
}

export const AdvisorRunsPage: React.FC = () => {
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null)

  const fetchRuns = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/advisor/runs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setRuns(res.data)
    } catch (err) {
      console.error('Error loading runs', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRuns()
  }, [])

  const openRunDetail = async (runId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`/api/advisor/runs/${runId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSelectedRun(res.data)
    } catch (err) {
      console.error('Error fetching run detail', err)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
          Rebalance Runs & Batch Execution Log
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
          Real-time audit records of automated defensive portfolio optimizations, duration metrics, and tax alpha generated.
        </p>
      </div>

      {/* ── Runs Table ──────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>TRIGGER SCENARIO</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>STATUS</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>CLIENTS</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>EXECUTION TIME</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>TAX ALPHA SAVED</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>BLOCKED TRADES</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Loading execution history...
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No rebalance runs recorded yet. Trigger a shock in the Command Center to run optimization.
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                    }}
                    onClick={() => openRunDetail(r.id)}
                    className="hover:bg-slate-800/40"
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{r.scenario_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        textTransform: 'uppercase',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <CheckCircle2 size={12} /> {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center', color: '#f8fafc', fontWeight: 700 }}>
                      {r.portfolios_rebalanced} / {r.portfolios_checked}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                      {(r.duration_ms / 1000.0).toFixed(2)} s
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                      ₹{r.tax_saved_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', color: r.blocked_trades > 0 ? '#f59e0b' : '#64748b' }}>
                      {r.blocked_trades}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openRunDetail(r.id)
                        }}
                        style={{
                          background: 'rgba(56, 189, 248, 0.12)',
                          border: 'none',
                          color: '#38bdf8',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={13} /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Slide-Out Run Detail Drawer ─────────────────────────────── */}
      {selectedRun && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '560px',
          maxWidth: '90vw',
          background: '#0b132b',
          borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.6)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                {selectedRun.scenario_name}
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Run ID: {selectedRun.id} · {selectedRun.created_at ? new Date(selectedRun.created_at).toLocaleString() : 'N/A'}
              </div>
            </div>
            <button
              onClick={() => setSelectedRun(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94a3b8',
                padding: '6px',
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Key Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Execution Time</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>
                {(selectedRun.duration_ms / 1000.0).toFixed(3)} s
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tax Alpha Generated</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
                ₹{selectedRun.tax_saved_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Stage Timings Breakdown */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Pipeline Stage Timings (ms)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(selectedRun.stage_timings || {}).map(([stage, ms]) => (
                <div
                  key={stage}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>
                    {stage.replace('_', ' ')}
                  </span>
                  <span style={{ color: '#f8fafc', fontWeight: 700 }}>
                    {Number(ms).toFixed(2)} ms
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Executed Orders */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Sample Executed Orders ({selectedRun.sample_trades.length})
            </h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedRun.sample_trades.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: t.side === 'BUY' ? '#10b981' : '#ef4444', fontWeight: 800, marginRight: '6px' }}>
                      {t.side}
                    </span>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>{t.symbol}</span>
                    <span style={{ color: '#64748b', marginLeft: '6px' }}>x {t.qty}</span>
                  </div>
                  <div style={{ color: '#94a3b8' }}>{t.client_name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Guardrail Violations */}
          {selectedRun.guardrail_violations.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fca5a5', marginBottom: '10px' }}>
                Safety Guardrail Blocks ({selectedRun.guardrail_violations.length})
              </h4>
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedRun.guardrail_violations.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#ef4444' }}>
                      <span>{v.rule}</span>
                      <span>{v.symbol}</span>
                    </div>
                    <div style={{ color: '#94a3b8', marginTop: '2px' }}>{v.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
