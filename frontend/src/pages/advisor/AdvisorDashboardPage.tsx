import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Zap,
  RefreshCw,
  Activity,
  DollarSign,
  Users,
  Play,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react'
import { useLiveSocket } from '../../hooks/useLiveSocket'

interface AdvisorSummary {
  total_clients: number
  total_aum_inr: number
  equity_aum_inr: number
  cash_aum_inr: number
  total_rebalance_runs: number
  total_tax_alpha_saved_inr: number
  total_losses_harvested_inr: number
  total_guardrail_blocks: number
  active_shock: any
  model_distribution: Array<{
    id: string
    name: string
    description: string
    clients_count: number
    target_weights: Record<string, number>
  }>
}

interface RunResult {
  scenario: string
  run_id: string
  clients_checked: number
  clients_rebalanced: number
  trades_count: number
  tax_alpha_saved_inr: number
  execution_time_sec: number
  stage_timings_ms: Record<string, number>
}

export const AdvisorDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<AdvisorSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [customMag, setCustomMag] = useState(-15)
  const [isTriggering, setIsTriggering] = useState(false)
  const [lastRunResult, setLastRunResult] = useState<RunResult | null>(null)
  const { isConnected, activeShock, pipelineProgress } = useLiveSocket()

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/advisor/summary', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSummary(res.data)
    } catch (err) {
      console.error('Error loading advisor summary', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const handleTriggerShock = async (scenario: string, mag?: number) => {
    setIsTriggering(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post(
        '/api/advisor/shocks/trigger',
        {
          scenario_name: scenario,
          magnitude: mag !== undefined ? mag : (mag || -0.15),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLastRunResult(res.data)
      await fetchSummary()
    } catch (err) {
      console.error('Error triggering shock', err)
    } finally {
      setIsTriggering(false)
    }
  }

  const handleResetMarket = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/advisor/market/reset', {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setLastRunResult(null)
      await fetchSummary()
    } catch (err) {
      console.error('Error resetting market', err)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* ── Real-Time Shock Alert Banner ────────────────────────────── */}
      {activeShock && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.08) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'pulse 2s infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}>
              <Flame size={20} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fca5a5' }}>
                ACTIVE MARKET SHOCK: {activeShock.scenario.toUpperCase()} ({(activeShock.magnitude * 100).toFixed(1)}%)
              </div>
              <div style={{ fontSize: '12px', color: '#f87171' }}>
                All 1,000 portfolios rebalanced defensively with quadratic tracking optimization and FIFO loss harvesting.
              </div>
            </div>
          </div>
          <button
            onClick={handleResetMarket}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} /> Reset Market Baseline
          </button>
        </div>
      )}

      {/* ── Top Header & Live Telemetry ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Advisor Command Center
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '20px',
              background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isConnected ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isConnected ? '#10b981' : '#ef4444',
              }} />
              {isConnected ? 'LIVE FEED (1.5s)' : 'CONNECTING...'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            Automated SEBI-compliant shock protection, quadratic tracking rebalance, and tax alpha harvesting across 1,000 accounts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchSummary}
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
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* ── Key Metrics Scorecard ───────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '18px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>TOTAL PLATFORM AUM</span>
            <DollarSign size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
            ₹{summary ? (summary.total_aum_inr / 10000000).toFixed(2) : '0.00'} Cr
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            ₹{summary ? (summary.equity_aum_inr / 10000000).toFixed(2) : '0'} Cr Equity · ₹{summary ? (summary.cash_aum_inr / 10000000).toFixed(2) : '0'} Cr Cash
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '12px',
          padding: '18px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6ee7b7' }}>TOTAL TAX ALPHA SAVED</span>
            <Zap size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
            ₹{summary ? (summary.total_tax_alpha_saved_inr / 100000).toFixed(2) : '0.00'} L
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
            From ₹{summary ? (summary.total_losses_harvested_inr / 100000).toFixed(1) : '0'} L capital losses harvested
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '18px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>ACTIVE CLIENTS</span>
            <Users size={16} color="#a78bfa" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
            {summary?.total_clients.toLocaleString() || '1,000'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            100% compliant under FY 2024–25 tax rules
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '18px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>REBALANCE RUNS</span>
            <Activity size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
            {summary?.total_rebalance_runs || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {summary?.total_guardrail_blocks || 0} safety guardrail interventions
          </div>
        </div>
      </div>

      {/* ── Shock Simulator Action Bar ──────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '14px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Flame size={20} color="#f87171" />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Simulated Market Shock & Rebalance Trigger
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px' }}>
          Trigger real-time volatility shocks across all simulated tickers and execute parallel QP portfolio optimization in under 5 seconds.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          alignItems: 'stretch',
        }}>
          {/* Preset 1: COVID 2020 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fca5a5' }}>COVID-19 Crash Replay</span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>-25.0%</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px' }}>
                Replays the historic March 2020 market liquidity crunch with broad-market circuit breaches.
              </p>
            </div>
            <button
              onClick={() => handleTriggerShock('covid_2020', -0.25)}
              disabled={isTriggering}
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isTriggering ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Play size={14} /> Trigger COVID Shock (-25%)
            </button>
          </div>

          {/* Preset 2: Election 2024 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fcd34d' }}>Election Flash Dip Replay</span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>-6.0%</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px' }}>
                Simulates June 4, 2024 vote counting dip with PSU & Infrastructure sector volatility.
              </p>
            </div>
            <button
              onClick={() => handleTriggerShock('election_2024', -0.06)}
              disabled={isTriggering}
              style={{
                background: '#d97706',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isTriggering ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Play size={14} /> Trigger Election Dip (-6%)
            </button>
          </div>

          {/* Custom Magnitude Slider */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#7dd3fc' }}>Custom Shock Magnitude</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{customMag}%</span>
              </div>
              <input
                type="range"
                min="-40"
                max="-2"
                step="1"
                value={customMag}
                onChange={(e) => setCustomMag(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', marginBottom: '14px' }}
              />
            </div>
            <button
              onClick={() => handleTriggerShock('custom', customMag / 100.0)}
              disabled={isTriggering}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isTriggering ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Zap size={14} /> Execute Rebalance ({customMag}%)
            </button>
          </div>
        </div>

        {/* Real-Time Progress / Stopwatch */}
        {(isTriggering || pipelineProgress || lastRunResult) && (
          <div style={{
            marginTop: '20px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#38bdf8" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                  Execution Telemetry {lastRunResult ? `(Completed in ${lastRunResult.execution_time_sec}s)` : '(Running...)'}
                </span>
              </div>
              {lastRunResult && (
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> 1,000 Portfolios Optimized
                </span>
              )}
            </div>

            {lastRunResult && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                fontSize: '12px',
              }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Total Execution:</span>
                  <div style={{ color: '#38bdf8', fontWeight: 800 }}>{lastRunResult.execution_time_sec} s</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Rebalanced:</span>
                  <div style={{ color: '#10b981', fontWeight: 800 }}>{lastRunResult.clients_rebalanced} accounts</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Trades Filled:</span>
                  <div style={{ color: '#f8fafc', fontWeight: 800 }}>{lastRunResult.trades_count} orders</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Tax Alpha Saved:</span>
                  <div style={{ color: '#10b981', fontWeight: 800 }}>₹{lastRunResult.tax_alpha_saved_inr.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Model Portfolios Distribution ──────────────────────────── */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '20px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: '0 0 16px' }}>
          Model Portfolio Architectures & Target Allocation
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {summary?.model_distribution.map((model) => (
            <div
              key={model.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>{model.name}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                  {model.clients_count} Clients
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px' }}>
                {model.description || 'Target asset allocation model.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Object.entries(model.target_weights || {}).map(([sym, weight]) => (
                  <span
                    key={sym}
                    style={{
                      fontSize: '11px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#cbd5e1',
                    }}
                  >
                    {sym}: {(Number(weight) * 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
