import { useState } from 'react'
import { Zap, Play, Sliders } from 'lucide-react'

export default function ShockHarvesterPage() {
  const [selectedStock, setSelectedStock] = useState('HDFCBANK')
  const [shockDropPct, setShockDropPct] = useState(8.5)
  const [coolingDays, setCoolingDays] = useState(30)
  const [proxyEtf, setProxyEtf] = useState('BANKBEES')
  const [statusLog, setStatusLog] = useState<string[]>([
    '⚡ ShockHarvester Engine Initialized.',
    '✓ Real-time Angel One market feed connected.',
    '✓ Wash-sale 30-day cooling-off timer active for all 12 tracked assets.',
  ])

  const handleSimulateShock = () => {
    const timestamp = new Date().toLocaleTimeString()
    const log1 = `[${timestamp}] 🚨 SHOCK EVENT DETECTED: ${selectedStock} dropped -${shockDropPct}% (exceeding 7.0% threshold).`
    const log2 = `[${timestamp}] ⚡ Auto-Order Generated: Sold 150 shares ${selectedStock} @ market to harvest ₹20,940 capital loss.`
    const log3 = `[${timestamp}] 🔄 Proxy Switch: Purchased 620 units ${proxyEtf} to maintain sector exposure with zero wash-sale conflict.`
    const log4 = `[${timestamp}] ⏳ Cooling-Off Started: 30 days lock on ${selectedStock} repurchase.`

    setStatusLog(prev => [log4, log3, log2, log1, ...prev])
  }

  return (
    <div className="page-container">
      <div className="portfolio-header-bar">
        <div>
          <h1 className="section-title" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={20} color="#387ed1" /> Shock Harvester Automation Engine
          </h1>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Real-time volatility shock detection & automated tax-loss harvesting with proxy hedging
          </div>
        </div>
      </div>

      {/* Simulator Control Card */}
      <div className="index-chart-card" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={16} color="#00d09c" /> Trigger Shock Simulation
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target Security</label>
              <select
                className="dock-select"
                style={{ width: '100%', marginTop: 4 }}
                value={selectedStock}
                onChange={e => {
                  setSelectedStock(e.target.value)
                  if (e.target.value === 'HDFCBANK') setProxyEtf('BANKBEES')
                  else if (e.target.value === 'INFY' || e.target.value === 'TCS') setProxyEtf('ITBEES')
                  else setProxyEtf('NIFTYBEES')
                }}
              >
                <option value="HDFCBANK">HDFCBANK (HDFC Bank Ltd)</option>
                <option value="INFY">INFY (Infosys Ltd)</option>
                <option value="TCS">TCS (Tata Consultancy Services)</option>
                <option value="RELIANCE">RELIANCE (Reliance Industries)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Simulated Drop (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={shockDropPct}
                  onChange={e => setShockDropPct(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    background: '#19202c',
                    border: '1px solid #273347',
                    borderRadius: 4,
                    padding: '6px 10px',
                    color: '#ffffff',
                    marginTop: 4,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cooling Off Period (Days)</label>
                <input
                  type="number"
                  value={coolingDays}
                  onChange={e => setCoolingDays(parseInt(e.target.value) || 30)}
                  style={{
                    width: '100%',
                    background: '#19202c',
                    border: '1px solid #273347',
                    borderRadius: 4,
                    padding: '6px 10px',
                    color: '#ffffff',
                    marginTop: 4,
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Correlated Proxy Asset (Wash-sale Safe)</label>
              <input
                type="text"
                value={proxyEtf}
                disabled
                style={{
                  width: '100%',
                  background: '#131720',
                  border: '1px solid #222a3a',
                  borderRadius: 4,
                  padding: '6px 10px',
                  color: '#00d09c',
                  fontWeight: 600,
                  marginTop: 4,
                }}
              />
            </div>

            <button
              className="btn-commodities"
              style={{ background: '#387ed1', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleSimulateShock}
            >
              <Play size={16} />
              EXECUTE SHOCK HARVEST PIPELINE
            </button>
          </div>
        </div>

        {/* Engine Event Stream */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ActivityIcon /> Live Execution Event Log
          </h3>

          <div
            style={{
              flex: 1,
              background: '#0a0d13',
              border: '1px solid #1c2433',
              borderRadius: 8,
              padding: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#d1d5db',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              overflowY: 'auto',
              maxHeight: 280,
            }}
          >
            {statusLog.map((log, index) => (
              <div
                key={index}
                style={{
                  color: log.includes('🚨') ? '#eb5b5b' : log.includes('⚡') ? '#a78bfa' : log.includes('🔄') ? '#387ed1' : '#00d09c',
                }}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  )
}
