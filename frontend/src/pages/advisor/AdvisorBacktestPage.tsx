import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Play } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ScenarioConfig {
  key: string
  title: string
  description: string
  start_date: string
  end_date: string
  benchmark_drop: number
}

interface StrategyMetrics {
  total_return_pct: number
  after_tax_return_pct: number
  tax_alpha_inr: number
  max_drawdown_pct: number
  sharpe_ratio: number
  turnover_pct: number
  rebalance_events_count: number
  final_value_inr: number
}

interface BacktestOutput {
  scenario_name: string
  scenario_title: string
  start_date: string
  end_date: string
  initial_capital_inr: number
  shock_harvester: StrategyMetrics
  quarterly_rebalance: StrategyMetrics
  buy_and_hold: StrategyMetrics
  time_series: Array<{
    date: string
    shock_harvester: number
    quarterly_rebalance: number
    buy_and_hold: number
    tax_alpha_accumulated: number
  }>
}

export const AdvisorBacktestPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>([])
  const [selectedScenario, setSelectedScenario] = useState('covid_2020')
  const initialCapital = 10000000
  const equityWeight = 0.70
  const [result, setResult] = useState<BacktestOutput | null>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('/api/advisor/backtest/scenarios', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setScenarios(res.data)
      } catch (err) {
        console.error('Error loading scenarios', err)
      }
    }
    fetchScenarios()
    handleRunBacktest('covid_2020')
  }, [])

  const handleRunBacktest = async (scenKey = selectedScenario) => {
    setRunning(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post(
        '/api/advisor/backtest/run',
        {
          scenario: scenKey,
          initial_capital: initialCapital,
          equity_weight: equityWeight,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setResult(res.data)
    } catch (err) {
      console.error('Error running backtest', err)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
          Backtest Studio — Multi-Strategy Benchmark
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
          Simulate and compare ShockHarvester against Quarterly Calendar Rebalancing and Buy & Hold across historical Indian market regimes.
        </p>
      </div>

      {/* ── Scenario Selection & Configuration Bar ─────────────────── */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {scenarios.map((scen) => (
            <button
              key={scen.key}
              onClick={() => {
                setSelectedScenario(scen.key)
                handleRunBacktest(scen.key)
              }}
              style={{
                background: selectedScenario === scen.key ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${selectedScenario === scen.key ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                color: selectedScenario === scen.key ? '#38bdf8' : '#cbd5e1',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>{scen.title}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Benchmark Drop: {scen.benchmark_drop}%
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => handleRunBacktest()}
          disabled={running}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#fff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: running ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Play size={15} /> {running ? 'Simulating...' : 'Re-Run Backtest'}
        </button>
      </div>

      {/* ── Multi-Strategy Performance Chart ────────────────────────── */}
      {result && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Portfolio Equity Growth Trajectory (₹)
            </h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 700 }}>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }} /> ShockHarvester
              </span>
              <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', background: '#38bdf8', borderRadius: '50%' }} /> Quarterly Rebalance
              </span>
              <span style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', background: '#a78bfa', borderRadius: '50%' }} /> Buy & Hold
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '360px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.time_series} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0b132b',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '']}
                />
                <Line
                  type="monotone"
                  dataKey="shock_harvester"
                  name="ShockHarvester"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="quarterly_rebalance"
                  name="Quarterly Rebalance"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="buy_and_hold"
                  name="Buy & Hold"
                  stroke="#a78bfa"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Comparative Metrics Matrix ──────────────────────────────── */}
      {result && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {/* ShockHarvester Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>SHOCKHARVESTER</span>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                OPTIMAL
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>After-Tax Return:</span>
                <span style={{ color: '#10b981', fontWeight: 800 }}>+{result.shock_harvester.after_tax_return_pct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Tax Alpha Harvested:</span>
                <span style={{ color: '#10b981', fontWeight: 800 }}>₹{(result.shock_harvester?.tax_alpha_inr || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Max Drawdown:</span>
                <span style={{ color: '#f8fafc', fontWeight: 700 }}>-{result.shock_harvester.max_drawdown_pct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Sharpe Ratio:</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{result.shock_harvester.sharpe_ratio}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Rebalance Events:</span>
                <span style={{ color: '#f8fafc', fontWeight: 700 }}>{result.shock_harvester.rebalance_events_count} triggers</span>
              </div>
            </div>
          </div>

          {/* Quarterly Rebalance Card */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>QUARTERLY REBALANCE</span>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                STANDARD
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Total Return:</span>
                <span style={{ color: '#f8fafc', fontWeight: 800 }}>+{result.quarterly_rebalance.total_return_pct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Tax Alpha Harvested:</span>
                <span style={{ color: '#64748b' }}>₹0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Max Drawdown:</span>
                <span style={{ color: '#f8fafc', fontWeight: 700 }}>-{result.quarterly_rebalance.max_drawdown_pct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Sharpe Ratio:</span>
                <span style={{ color: '#cbd5e1', fontWeight: 700 }}>{result.quarterly_rebalance.sharpe_ratio}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Turnover:</span>
                <span style={{ color: '#cbd5e1', fontWeight: 700 }}>{result.quarterly_rebalance.turnover_pct}%</span>
              </div>
            </div>
          </div>

          {/* Buy & Hold Card */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#a78bfa' }}>BUY & HOLD</span>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa' }}>
                STATIC
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Total Return:</span>
                <span style={{ color: '#f8fafc', fontWeight: 800 }}>+{result.buy_and_hold.total_return_pct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Tax Alpha Harvested:</span>
                <span style={{ color: '#64748b' }}>₹0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Max Drawdown:</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>-{result.buy_and_hold.max_drawdown_pct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Sharpe Ratio:</span>
                <span style={{ color: '#cbd5e1', fontWeight: 700 }}>{result.buy_and_hold.sharpe_ratio}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Turnover:</span>
                <span style={{ color: '#cbd5e1', fontWeight: 700 }}>0.0%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
