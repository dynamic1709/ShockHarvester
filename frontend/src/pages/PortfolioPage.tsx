import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  EyeOff, 
  Eye, 
  Info, 
  Scale, 
  Percent, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  CheckCircle2,
  DollarSign,
  Wallet
} from 'lucide-react'

interface PortfolioHolding {
  id: number
  symbol: string
  name: string
  quantity: number
  buyPrice: number
  currentPrice: number
  unrealizedPnL: number
  unrealizedPnLPct: number
  shockThresholdPct: number
  harvestable: boolean
}

export default function PortfolioPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'Overview' | 'Equity'>('Overview')
  const [hideWatchlist, setHideWatchlist] = useState(false)
  const [holdings] = useState<PortfolioHolding[]>([
    {
      id: 1,
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Ltd',
      quantity: 150,
      buyPrice: 1720.00,
      currentPrice: 1580.40,
      unrealizedPnL: -20940.00,
      unrealizedPnLPct: -8.12,
      shockThresholdPct: -7.0,
      harvestable: true,
    },
    {
      id: 2,
      symbol: 'INFY',
      name: 'Infosys Ltd',
      quantity: 80,
      buyPrice: 1940.00,
      currentPrice: 1785.20,
      unrealizedPnL: -12384.00,
      unrealizedPnLPct: -7.98,
      shockThresholdPct: -7.0,
      harvestable: true,
    },
    {
      id: 3,
      symbol: 'RELIANCE',
      name: 'Reliance Industries',
      quantity: 50,
      buyPrice: 2850.00,
      currentPrice: 2980.50,
      unrealizedPnL: 6525.00,
      unrealizedPnLPct: 4.58,
      shockThresholdPct: -8.0,
      harvestable: false,
    },
    {
      id: 4,
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      quantity: 40,
      buyPrice: 4250.00,
      currentPrice: 3950.00,
      unrealizedPnL: -12000.00,
      unrealizedPnLPct: -7.06,
      shockThresholdPct: -6.5,
      harvestable: true,
    },
  ])

  const [harvestToast, setHarvestToast] = useState<string | null>(null)

  const investedAmount = holdings.reduce((acc, h) => acc + h.buyPrice * h.quantity, 0)
  const currentValue = holdings.reduce((acc, h) => acc + h.currentPrice * h.quantity, 0)
  const overallGain = currentValue - investedAmount
  const overallGainPct = ((overallGain / investedAmount) * 100).toFixed(2)
  const harvestableLoss = holdings
    .filter(h => h.harvestable)
    .reduce((acc, h) => acc + Math.abs(h.unrealizedPnL), 0)

  const handleHarvest = (symbol: string, loss: number) => {
    setHarvestToast(`Harvesting initiated for ${symbol}! Realized tax loss ₹${Math.abs(loss).toLocaleString('en-IN')}. Proxy ETF assigned.`)
    setTimeout(() => setHarvestToast(null), 4000)
  }

  return (
    <div className="page-container">
      {/* Portfolio Header Bar (Screenshot 1) */}
      <div className="portfolio-header-bar">
        <div className="portfolio-tabs">
          <span 
            className={`subnav-tab ${activeTab === 'Overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('Overview')}
          >
            Overview
          </span>
          <span 
            className={`subnav-tab ${activeTab === 'Equity' ? 'active' : ''}`}
            onClick={() => setActiveTab('Equity')}
          >
            Equity
          </span>
        </div>

        <button 
          className="btn-hide-watchlist"
          onClick={() => {
            const sidebar = document.querySelector('.watchlist-sidebar')
            if (sidebar) sidebar.classList.toggle('collapsed')
            setHideWatchlist(!hideWatchlist)
          }}
        >
          {hideWatchlist ? <Eye size={14} /> : <EyeOff size={14} />}
          {hideWatchlist ? 'SHOW WATCHLIST' : 'HIDE WATCHLIST'}
        </button>
      </div>

      {/* 4 Summary Metric Cards (Screenshot 1) */}
      <div className="portfolio-summary-grid">
        <div className="metric-card">
          <div className="metric-icon-circle">
            <Wallet size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Invested Amount</span>
            <span className="metric-value">₹ {investedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-circle" style={{ color: '#00d09c', background: 'rgba(0, 208, 156, 0.1)' }}>
            <DollarSign size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Current Value</span>
            <span className="metric-value">₹ {currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="metric-card">
          <div 
            className="metric-icon-circle" 
            style={{ 
              color: overallGain >= 0 ? '#00d09c' : '#eb5b5b', 
              background: overallGain >= 0 ? 'rgba(0, 208, 156, 0.1)' : 'rgba(235, 91, 91, 0.1)' 
            }}
          >
            {overallGain >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
          </div>
          <div className="metric-content">
            <span className="metric-label">Overall Gain</span>
            <span 
              className="metric-value" 
              style={{ color: overallGain >= 0 ? 'var(--green)' : 'var(--red)' }}
            >
              ₹ {overallGain.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({overallGainPct}%)
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-circle" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
            <Zap size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Shock Harvestable Loss</span>
            <span className="metric-value" style={{ color: '#00d09c' }}>
              ₹ {harvestableLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Portfolio Breakup Section (Screenshot 1) */}
      <div style={{ marginBottom: 32 }}>
        <h2 className="section-title" style={{ marginBottom: 14 }}>Portfolio Breakup</h2>

        <div className="portfolio-alert-banner">
          <Info size={16} color="#387ed1" />
          <span>ShockHarvester is actively scanning your equity positions for sudden shock drops and tax harvesting opportunities.</span>
        </div>

        <div className="breakup-cards-grid">
          <div className="breakup-invest-card">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#ffffff' }}>Equity</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {holdings.length} Active Stock Holdings
              </div>
            </div>
            <button className="btn-invest-now" onClick={() => navigate('/tradeone')}>
              INVEST NOW
            </button>
          </div>

          <div className="breakup-invest-card">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#ffffff' }}>Mutual Funds</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                SIP & ELSS Tax Saving Portfolios
              </div>
            </div>
            <button className="btn-invest-now" onClick={() => navigate('/tradeone')}>
              INVEST NOW
            </button>
          </div>
        </div>

        {/* Live Holdings & Shock Harvesting Matrix */}
        <div className="table-card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#ffffff' }}>Active Holdings & Tax-Loss Opportunities</span>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Automated cooling-off & proxy switch enabled</div>
            </div>
            <button 
              className="btn-commodities"
              style={{ background: '#10b981' }}
              onClick={() => handleHarvest('All Harvestable Basket', harvestableLoss)}
            >
              HARVEST ALL ELIGIBLE LOSSES (₹{harvestableLoss.toLocaleString('en-IN')})
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Security</th>
                <th>Qty</th>
                <th>Avg Buy Price</th>
                <th>LTP</th>
                <th>Current Value</th>
                <th>Unrealized P&L</th>
                <th>Shock Drop</th>
                <th>Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const isLoss = h.unrealizedPnL < 0
                return (
                  <tr key={h.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{h.symbol}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{h.name}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{h.quantity}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{h.buyPrice.toFixed(2)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{h.currentPrice.toFixed(2)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{(h.currentPrice * h.quantity).toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: isLoss ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
                      {isLoss ? '-' : '+'}₹{Math.abs(h.unrealizedPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({h.unrealizedPnLPct.toFixed(2)}%)
                    </td>
                    <td>
                      <span className={`badge-tag ${h.harvestable ? 'badge-red' : 'badge-green'}`}>
                        {h.harvestable ? `Shock: ${h.unrealizedPnLPct.toFixed(1)}% (Threshold ${h.shockThresholdPct}%)` : 'Normal'}
                      </span>
                    </td>
                    <td>
                      {h.harvestable ? (
                        <button 
                          className="badge-tag badge-purple" 
                          style={{ cursor: 'pointer', padding: '4px 10px' }}
                          onClick={() => handleHarvest(h.symbol, h.unrealizedPnL)}
                        >
                          <Zap size={10} style={{ marginRight: 4 }} /> Harvest Loss
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No Action Needed</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pledging & Pay Later (MTF) (Screenshot 1) */}
      <div style={{ marginBottom: 36 }}>
        <h2 className="section-title" style={{ marginBottom: 14 }}>Pledging & Pay Later (MTF)</h2>

        <div className="mtf-cards-grid">
          <div className="mtf-card">
            <div className="mtf-icon">
              <Scale size={20} />
            </div>
            <div className="mtf-details">
              <span className="mtf-title">Pledge Holdings for Extra Margin</span>
              <span className="mtf-sub">Increase your trading balance</span>
            </div>
          </div>

          <div className="mtf-card">
            <div className="mtf-icon">
              <Percent size={20} />
            </div>
            <div className="mtf-details">
              <span className="mtf-title">Pay Later with MTF</span>
              <span className="mtf-sub">4x your buying power for MTF stocks</span>
            </div>
          </div>

          <div className="mtf-card">
            <div className="mtf-icon" style={{ color: '#f59e0b' }}>
              <Sparkles size={20} />
            </div>
            <div className="mtf-details">
              <span className="mtf-title">View Stock Recommendations</span>
              <span className="mtf-sub">Also available on F&O</span>
            </div>
          </div>
        </div>
      </div>

      {/* Join our Community Footer (Screenshot 1) */}
      <div className="community-footer">
        <span className="community-title">Join our Community</span>
        <div className="social-icons-row">
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-btn youtube" title="YouTube">▶</a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-btn instagram" title="Instagram">📸</a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-btn facebook" title="Facebook">f</a>
          <a href="https://x.com" target="_blank" rel="noreferrer" className="social-btn twitter" title="X / Twitter">𝕏</a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-btn linkedin" title="LinkedIn">in</a>
        </div>
      </div>

      {/* Toast Notification */}
      {harvestToast && (
        <div 
          style={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            background: '#10b981',
            color: '#000000',
            fontWeight: 700,
            padding: '12px 24px',
            borderRadius: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            zIndex: 1000,
          }}
        >
          <CheckCircle2 size={18} />
          {harvestToast}
        </div>
      )}
    </div>
  )
}
