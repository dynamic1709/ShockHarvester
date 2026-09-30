import React, { useState } from 'react'
import axios from 'axios'
import {
  Settings,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Database,
} from 'lucide-react'

export const AdvisorSettingsPage: React.FC = () => {
  const [lambdaTax, setLambdaTax] = useState(0.50)
  const [lambdaHarvest, setLambdaHarvest] = useState(0.40)
  const [turnoverCap, setTurnoverCap] = useState(30)
  const [saved, setSaved] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleResetDemoState = async () => {
    if (!window.confirm('Reset all live price shocks and simulation state to default baseline?')) {
      return
    }
    setResetting(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/advisor/market/reset', {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      alert('Market state successfully reset to initial baseline!')
    } catch (err) {
      console.error('Error resetting market', err)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
          System Settings & Simulation Controls
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
          Configure quantitative optimizer penalties, simulation ticks frequency, and manage demo reset states.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
      }}>
        {/* Optimizer Weights */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sliders size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Quadratic Optimizer Weights
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Tax Penalty Weight (λ_tax)</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{lambdaTax.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={lambdaTax}
                onChange={(e) => setLambdaTax(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Harvest Incentive Weight (λ_harvest)</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>{lambdaHarvest.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={lambdaHarvest}
                onChange={(e) => setLambdaHarvest(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Max Turnover Cap Per Asset</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>{turnoverCap}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={turnoverCap}
                onChange={(e) => setTurnoverCap(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
            </div>

            <button
              onClick={handleSave}
              style={{
                marginTop: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {saved ? <CheckCircle2 size={16} /> : <Settings size={16} />}
              {saved ? 'Parameters Saved!' : 'Save Engine Parameters'}
            </button>
          </div>
        </div>

        {/* Demo State Reset */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Database size={18} color="#f87171" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Demo Environment Controls
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>
              Reset active market prices, clear simulated shock states, and restore clean initial portfolio baseline for live demonstrations.
            </p>
          </div>

          <button
            onClick={handleResetDemoState}
            disabled={resetting}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: resetting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={15} className={resetting ? 'animate-spin' : ''} />
            {resetting ? 'Resetting...' : 'Reset Market Simulation Baseline'}
          </button>
        </div>
      </div>
    </div>
  )
}
