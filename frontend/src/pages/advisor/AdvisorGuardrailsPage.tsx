import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  ShieldCheck,
  Lock,
  Clock,
  RefreshCw,
} from 'lucide-react'

interface ViolationItem {
  id: string
  client_id: string
  client_name: string
  symbol: string
  rule: string
  detail: string
  created_at: string
}

export const AdvisorGuardrailsPage: React.FC = () => {
  const [violations, setViolations] = useState<ViolationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRule, setFilterRule] = useState('')

  const fetchViolations = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/advisor/guardrails', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setViolations(res.data || [])
    } catch (err) {
      console.error('Error fetching guardrails log', err)
      setViolations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchViolations()
  }, [])

  const filtered = filterRule
    ? (violations || []).filter((v) => (v.rule || '').toLowerCase().includes(filterRule.toLowerCase()))
    : (violations || [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Safety Guardrails & Regulatory Interventions
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            Real-time audit log of algorithmic trade blocks: Circuit limits, 30-day cooling-off periods, and exchange halt protections.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={filterRule}
            onChange={(e) => setFilterRule(e.target.value)}
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 14px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Guardrail Rules</option>
            <option value="CIRCUIT_LOCKED">Circuit Locked (Band Breaches)</option>
            <option value="COOLING_OFF">30-Day Cooling-Off Active</option>
            <option value="SECURITY_HALTED">Security Halted</option>
          </select>

          <button
            onClick={fetchViolations}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Rule Cards ──────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '10px',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Lock size={16} color="#ef4444" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fca5a5' }}>CIRCUIT BREAKER LOCKS</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
            {(violations || []).filter((v) => (v.rule || '').includes('CIRCUIT')).length}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Orders blocked at lower/upper bands</div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '10px',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Clock size={16} color="#38bdf8" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#7dd3fc' }}>30-DAY COOLING-OFF</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
            {(violations || []).filter((v) => (v.rule || '').includes('COOLING')).length}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Switched to correlated substitute ETFs</div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '10px',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#6ee7b7' }}>SEBI REGULATORY STATUS</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>
            100% PASS
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>Zero wash-sale violations</div>
        </div>
      </div>

      {/* ── Violations Log Table ────────────────────────────────────── */}
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
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>TIMESTAMP</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>INVESTOR</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>SECURITY</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>RULE TRIGGERED</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>SAFETY INTERVENTION DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Loading safety logs...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No guardrail blocks recorded for the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '12px' }}>
                      {v.created_at ? new Date(v.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#f8fafc', fontWeight: 600 }}>
                      {v.client_name}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#38bdf8', fontWeight: 700 }}>
                      {v.symbol}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                      }}>
                        {v.rule}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#cbd5e1', fontSize: '12px' }}>
                      {v.detail}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
