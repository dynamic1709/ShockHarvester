import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  CandlestickChart, 
  PieChart, 
  Layers, 
  Newspaper, 
  ChevronRight
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

const CHART_DATA_1D = [
  { time: '09:30', price: 22665 },
  { time: '09:45', price: 22710 },
  { time: '10:00', price: 22690 },
  { time: '10:15', price: 22740 },
  { time: '10:30', price: 22765 },
  { time: '10:45', price: 22715 },
  { time: '11:00', price: 22680 },
  { time: '11:15', price: 22730 },
  { time: '11:30', price: 22705 },
  { time: '11:45', price: 22695 },
  { time: '12:00', price: 22755 },
  { time: '12:15', price: 22740 },
  { time: '12:30', price: 22776 },
]

const CHART_DATA_1W = [
  { time: 'Mon', price: 23100 },
  { time: 'Tue', price: 22950 },
  { time: 'Wed', price: 22820 },
  { time: 'Thu', price: 22680 },
  { time: 'Fri', price: 22778 },
]

const CHART_DATA_1M = [
  { time: 'Week 1', price: 23400 },
  { time: 'Week 2', price: 23150 },
  { time: 'Week 3', price: 22900 },
  { time: 'Week 4', price: 22778 },
]

const CHART_DATA_1Y = [
  { time: 'Oct', price: 19800 },
  { time: 'Dec', price: 21500 },
  { time: 'Feb', price: 22100 },
  { time: 'Apr', price: 22500 },
  { time: 'Jun', price: 23600 },
  { time: 'Sep', price: 22778 },
]

export default function MarketsPage() {
  const navigate = useNavigate()
  const [subTab, setSubTab] = useState<'Stock Discovery' | 'Index F&O' | 'Stocks F&O' | 'Commodities' | 'All Indices' | 'News'>('Stock Discovery')
  const [selectedIndex, setSelectedIndex] = useState('NIFTY')
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1D')
  const [activeSector, setActiveSector] = useState('Banking')

  const getChartData = () => {
    switch(timeframe) {
      case '1W': return CHART_DATA_1W
      case '1M': return CHART_DATA_1M
      case '1Y':
      case 'ALL': return CHART_DATA_1Y
      default: return CHART_DATA_1D
    }
  }

  return (
    <div className="page-container">
      {/* Sub Navigation Bar (Screenshot 3) */}
      <div className="subnav-tabs">
        {(['Stock Discovery', 'Index F&O', 'Stocks F&O', 'Commodities', 'All Indices', 'News'] as const).map((tab) => (
          <span 
            key={tab} 
            className={`subnav-tab ${subTab === tab ? 'active' : ''}`}
            onClick={() => setSubTab(tab)}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Live Market Status Banner (Screenshot 2) */}
      <div className="live-market-banner">
        <div className="live-badge-wrap">
          <span className="live-pill">((•)) LIVE</span>
          <span>Commodities market is open (till 11:30 PM)</span>
        </div>
        <button className="btn-commodities" onClick={() => setSubTab('Commodities')}>
          VIEW COMMODITIES
        </button>
      </div>

      {/* Index Overview Section (Screenshot 3) */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-header">
          <span className="section-title">Index Overview</span>
          <span className="section-view-all" onClick={() => setSubTab('All Indices')}>
            VIEW ALL <ChevronRight size={14} />
          </span>
        </div>

        {/* Indices Ticker Track */}
        <div className="indices-ticker-bar">
          <div className="indices-track">
            <div 
              className={`index-summary-item ${selectedIndex === 'NIFTY' ? 'active' : ''}`}
              onClick={() => setSelectedIndex('NIFTY')}
            >
              <span className="idx-name">NIFTY</span>
              <div className="idx-row">
                <span className="idx-val">22,773.60</span>
                <span className="idx-chg" style={{ color: 'var(--green)' }}>▲ +57.40 (+0.25%)</span>
              </div>
            </div>

            <div 
              className={`index-summary-item ${selectedIndex === 'SENSEX' ? 'active' : ''}`}
              onClick={() => setSelectedIndex('SENSEX')}
            >
              <span className="idx-name">SENSEX</span>
              <div className="idx-row">
                <span className="idx-val">72,939.05</span>
                <span className="idx-chg" style={{ color: 'var(--green)' }}>▲ +409.98 (+0.57%)</span>
              </div>
            </div>

            <div 
              className={`index-summary-item ${selectedIndex === 'BANKNIFTY' ? 'active' : ''}`}
              onClick={() => setSelectedIndex('BANKNIFTY')}
            >
              <span className="idx-name">BANKNIFTY</span>
              <div className="idx-row">
                <span className="idx-val">55,035.85</span>
                <span className="idx-chg" style={{ color: 'var(--green)' }}>▲ +775.90 (+1.43%)</span>
              </div>
            </div>

            <div 
              className={`index-summary-item ${selectedIndex === 'FINNIFTY' ? 'active' : ''}`}
              onClick={() => setSelectedIndex('FINNIFTY')}
            >
              <span className="idx-name">FINNIFTY</span>
              <div className="idx-row">
                <span className="idx-val">24,811.00</span>
                <span className="idx-chg" style={{ color: 'var(--green)' }}>▲ +162.50 (+0.66%)</span>
              </div>
            </div>

            <div 
              className={`index-summary-item ${selectedIndex === 'MIDCPNIFTY' ? 'active' : ''}`}
              onClick={() => setSelectedIndex('MIDCPNIFTY')}
            >
              <span className="idx-name">MIDCPNIFTY</span>
              <div className="idx-row">
                <span className="idx-val">13,768.10</span>
                <span className="idx-chg" style={{ color: 'var(--green)' }}>▲ +93.95 (+0.69%)</span>
              </div>
            </div>

            <div 
              className={`index-summary-item ${selectedIndex === 'INDIA VIX' ? 'active' : ''}`}
              onClick={() => setSelectedIndex('INDIA VIX')}
            >
              <span className="idx-name">INDIA VIX</span>
              <div className="idx-row">
                <span className="idx-val">13.06</span>
                <span className="idx-chg" style={{ color: 'var(--red)' }}>▼ -0.35 (-2.61%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Index Interactive Chart Card (Screenshot 3) */}
        <div className="index-chart-card">
          {/* Left Stats Panel */}
          <div className="chart-stats-panel">
            <div className="range-slider-section">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Day's High/Low</span>
              <div className="range-bar-track">
                <div className="range-indicator-pin" style={{ left: '92%' }} />
              </div>
              <div className="range-labels">
                <div>
                  <div style={{ color: 'var(--text-white)' }}>22659.80</div>
                  <div style={{ color: 'var(--text-muted)' }}>Low</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-white)' }}>22776.40</div>
                  <div style={{ color: 'var(--text-muted)' }}>High</div>
                </div>
              </div>
            </div>

            <div className="ohlc-grid">
              <div className="ohlc-item">
                <span className="ohlc-label">Open</span>
                <span className="ohlc-val">22,665.00</span>
              </div>
              <div className="ohlc-item">
                <span className="ohlc-label">High</span>
                <span className="ohlc-val">22,776.40</span>
              </div>
              <div className="ohlc-item">
                <span className="ohlc-label">Low</span>
                <span className="ohlc-val">22,659.80</span>
              </div>
              <div className="ohlc-item">
                <span className="ohlc-label">Close</span>
                <span className="ohlc-val">22,716.20</span>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button 
                className="btn-commodities" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => navigate('/tradeone')}
              >
                <CandlestickChart size={14} />
                OPEN IN TRADEONE TERMINAL
              </button>
            </div>
          </div>

          {/* Right Chart Display Panel */}
          <div className="chart-display-panel">
            <div className="chart-controls-row">
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  className={`time-pill-btn ${timeframe === '1D' ? 'active' : ''}`}
                  onClick={() => setTimeframe('1D')}
                >
                  1D +0.26%
                </button>
                <button 
                  className={`time-pill-btn ${timeframe === '1W' ? 'active' : ''}`}
                  onClick={() => setTimeframe('1W')}
                >
                  1W -2.87%
                </button>
                <button 
                  className={`time-pill-btn ${timeframe === '1M' ? 'active' : ''}`}
                  onClick={() => setTimeframe('1M')}
                >
                  1M -5.42%
                </button>
                <button 
                  className={`time-pill-btn ${timeframe === '1Y' ? 'active' : ''}`}
                  onClick={() => setTimeframe('1Y')}
                >
                  1Y -7.46%
                </button>
                <button 
                  className={`time-pill-btn ${timeframe === 'ALL' ? 'active' : ''}`}
                  onClick={() => setTimeframe('ALL')}
                >
                  All
                </button>
              </div>
            </div>

            <div style={{ height: 210, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getChartData()}>
                  <defs>
                    <linearGradient id="indexChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d09c" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#00d09c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    stroke="#4b5563" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: '#252d3d' }} 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="#4b5563" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: '#252d3d' }} 
                    orientation="right"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#161b24', 
                      borderColor: '#2d3748', 
                      borderRadius: 6, 
                      fontSize: 11,
                      color: '#ffffff'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#00d09c" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#indexChartGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* What are you looking for today? (Screenshot 2) */}
      <div style={{ marginBottom: 28 }}>
        <h2 className="section-title" style={{ marginBottom: 14 }}>What are you looking for today?</h2>
        <div className="discovery-grid">
          <div className="discovery-card" onClick={() => navigate('/tradeone')}>
            <div className="disc-icon-box" style={{ color: '#eb5b5b' }}>
              <CandlestickChart size={20} />
            </div>
            <span className="disc-label">Stock Discovery</span>
          </div>

          <div className="discovery-card" onClick={() => navigate('/portfolio')}>
            <div className="disc-icon-box" style={{ color: '#f59e0b' }}>
              <PieChart size={20} />
            </div>
            <span className="disc-label">Mutual Funds</span>
          </div>

          <div className="discovery-card" onClick={() => navigate('/tradeone')}>
            <div className="disc-icon-box" style={{ color: '#00d09c' }}>
              <TrendingUp size={20} />
            </div>
            <span className="disc-label">Futures & Options</span>
          </div>

          <div className="discovery-card" onClick={() => navigate('/securities')}>
            <div className="disc-icon-box" style={{ color: '#387ed1' }}>
              <Layers size={20} />
            </div>
            <span className="disc-label">ETF Discovery</span>
          </div>

          <div className="discovery-card" onClick={() => setSubTab('News')}>
            <div className="disc-icon-box" style={{ color: '#a78bfa' }}>
              <Newspaper size={20} />
            </div>
            <span className="disc-label">News Discovery</span>
          </div>
        </div>
      </div>

      {/* Invest in Latest IPOs (Screenshot 2) */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-header">
          <span className="section-title">Invest in Latest IPOs</span>
          <span className="section-view-all">
            VIEW ALL OPEN & UPCOMING IPO <ChevronRight size={14} />
          </span>
        </div>

        <div className="ipo-grid">
          <div className="ipo-card">
            <div className="ipo-top">
              <div className="ipo-company">
                <div className="ipo-logo-badge">SRIT</div>
                <div>
                  <div className="ipo-name">SRIT INDIA LTD</div>
                  <span className="ipo-board-tag">MAINBOARD</span>
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>

            <div className="ipo-stats-row">
              <div className="ipo-stat-item">
                <span className="ipo-stat-label">Closes On</span>
                <span className="ipo-stat-val">30 Sep 26</span>
              </div>
              <div className="ipo-stat-item" style={{ textAlign: 'right' }}>
                <span className="ipo-stat-label">Min. Investment</span>
                <span className="ipo-stat-val">₹14,145</span>
              </div>
            </div>

            <div className="ipo-subs-row">
              <span style={{ color: 'var(--text-secondary)' }}>Overall Subscription</span>
              <span className="ipo-subs-val" style={{ color: '#00d09c' }}>16.03x</span>
            </div>
          </div>

          <div className="ipo-card">
            <div className="ipo-top">
              <div className="ipo-company">
                <div className="ipo-logo-badge" style={{ color: '#00d09c' }}>SIH</div>
                <div>
                  <div className="ipo-name">SHAH INVESTOR'S HOME LTD</div>
                  <span className="ipo-board-tag">MAINBOARD</span>
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>

            <div className="ipo-stats-row">
              <div className="ipo-stat-item">
                <span className="ipo-stat-label">Closes On</span>
                <span className="ipo-stat-val">30 Sep 26</span>
              </div>
              <div className="ipo-stat-item" style={{ textAlign: 'right' }}>
                <span className="ipo-stat-label">Min. Investment</span>
                <span className="ipo-stat-val">₹13,515</span>
              </div>
            </div>

            <div className="ipo-subs-row">
              <span style={{ color: 'var(--text-secondary)' }}>Overall Subscription</span>
              <span className="ipo-subs-val" style={{ color: '#00d09c' }}>3.17x</span>
            </div>
          </div>

          <div className="ipo-card">
            <div className="ipo-top">
              <div className="ipo-company">
                <div className="ipo-logo-badge" style={{ color: '#eb5b5b' }}>VN</div>
                <div>
                  <div className="ipo-name">VISHAL NIRMITI LTD</div>
                  <span className="ipo-board-tag">MAINBOARD</span>
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>

            <div className="ipo-stats-row">
              <div className="ipo-stat-item">
                <span className="ipo-stat-label">Closes On</span>
                <span className="ipo-stat-val">05 Oct 26</span>
              </div>
              <div className="ipo-stat-item" style={{ textAlign: 'right' }}>
                <span className="ipo-stat-label">Min. Investment</span>
                <span className="ipo-stat-val">₹14,144</span>
              </div>
            </div>

            <div className="ipo-subs-row">
              <span style={{ color: 'var(--text-secondary)' }}>Overall Subscription</span>
              <span className="ipo-subs-val">0.02x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Most Bought Stocks (Screenshot 3) */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-header">
          <span className="section-title">Most Bought Stocks</span>
          <span className="section-view-all">
            VIEW ALL <ChevronRight size={14} />
          </span>
        </div>

        <div className="most-bought-grid">
          <div className="bought-card" onClick={() => navigate('/tradeone')}>
            <div className="bought-top">
              <div className="bought-avatar" style={{ background: '#e11d48', color: '#fff' }}>VI</div>
              <div>
                <div className="bought-symbol">IDEA</div>
                <div className="bought-desc">VODAFONE IDEA LIMITED</div>
              </div>
            </div>
            <div className="bought-price-row">
              <span className="bought-ltp">₹13.18</span>
              <span className="bought-chg" style={{ color: 'var(--red)' }}>▼ -0.38 (-2.80%)</span>
            </div>
          </div>

          <div className="bought-card" onClick={() => navigate('/tradeone')}>
            <div className="bought-top">
              <div className="bought-avatar" style={{ background: '#f8fafc', color: '#0f172a' }}>PCJ</div>
              <div>
                <div className="bought-symbol">PCJEWELLER</div>
                <div className="bought-desc">PC JEWELLER LTD</div>
              </div>
            </div>
            <div className="bought-price-row">
              <span className="bought-ltp">₹13.50</span>
              <span className="bought-chg" style={{ color: 'var(--green)' }}>▲ +0.27 (+2.04%)</span>
            </div>
          </div>

          <div className="bought-card" onClick={() => navigate('/tradeone')}>
            <div className="bought-top">
              <div className="bought-avatar" style={{ background: '#059669', color: '#fff' }}>R</div>
              <div>
                <div className="bought-symbol">RTNPOWER</div>
                <div className="bought-desc">RATTANINDIA POWER LI..</div>
              </div>
            </div>
            <div className="bought-price-row">
              <span className="bought-ltp">₹6.96</span>
              <span className="bought-chg" style={{ color: 'var(--green)' }}>▲ +0.09 (+1.31%)</span>
            </div>
          </div>

          <div className="bought-card" onClick={() => navigate('/tradeone')}>
            <div className="bought-top">
              <div className="bought-avatar" style={{ background: '#2563eb', color: '#fff' }}>A</div>
              <div>
                <div className="bought-symbol">ALOKINDS</div>
                <div className="bought-desc">ALOK INDUSTRIES LIMIT..</div>
              </div>
            </div>
            <div className="bought-price-row">
              <span className="bought-ltp">₹7.20</span>
              <span className="bought-chg" style={{ color: 'var(--green)' }}>▲ +0.14 (+1.98%)</span>
            </div>
          </div>

          <div className="bought-card" onClick={() => navigate('/tradeone')}>
            <div className="bought-top">
              <div className="bought-avatar" style={{ background: '#0284c7', color: '#fff' }}>H</div>
              <div>
                <div className="bought-symbol">HATHWAY</div>
                <div className="bought-desc">HATHWAY CABLE & DAT..</div>
              </div>
            </div>
            <div className="bought-price-row">
              <span className="bought-ltp">₹9.52</span>
              <span className="bought-chg" style={{ color: 'var(--green)' }}>▲ +0.03 (+0.32%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trade in Futures & Options (Screenshot 2) */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-header">
          <span className="section-title">Trade in Futures & Options</span>
          <span className="section-view-all">
            VIEW ALL STOCK F&O <ChevronRight size={14} />
          </span>
        </div>

        {/* Sector Pills */}
        <div className="fo-sector-row">
          <button 
            className={`sector-pill-btn ${activeSector === 'Banking' ? 'active' : ''}`}
            onClick={() => setActiveSector('Banking')}
          >
            <span className="sector-name">Banking</span>
            <span className="sector-pct">+1.12%</span>
          </button>

          <button 
            className={`sector-pill-btn ${activeSector === 'PSE' ? 'active' : ''}`}
            onClick={() => setActiveSector('PSE')}
          >
            <span className="sector-name">PSE</span>
            <span className="sector-pct">+0.68%</span>
          </button>

          <button 
            className={`sector-pill-btn ${activeSector === 'PSU Bank' ? 'active' : ''}`}
            onClick={() => setActiveSector('PSU Bank')}
          >
            <span className="sector-name">PSU Bank</span>
            <span className="sector-pct">+0.64%</span>
          </button>

          <button 
            className={`sector-pill-btn ${activeSector === 'Services' ? 'active' : ''}`}
            onClick={() => setActiveSector('Services')}
          >
            <span className="sector-name">Services</span>
            <span className="sector-pct">+0.59%</span>
          </button>

          <button 
            className={`sector-pill-btn ${activeSector === 'Metal' ? 'active' : ''}`}
            onClick={() => setActiveSector('Metal')}
          >
            <span className="sector-name">Metal</span>
            <span className="sector-pct">+0.48%</span>
          </button>
        </div>

        {/* F&O Table */}
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>F&O Scrips</th>
                <th>LTP</th>
                <th>LTP Change (%)</th>
                <th>Open Interest</th>
                <th>OI Change (%)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>HDFCBANK 30OCT26 1650 CE</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>₹34.50</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>▲ +12.4%</td>
                <td>4.2M</td>
                <td style={{ color: 'var(--green)' }}>+8.5%</td>
                <td>
                  <button className="badge-tag badge-blue" onClick={() => navigate('/tradeone')}>Trade</button>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>ICICIBANK 30OCT26 1220 CE</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>₹22.10</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>▲ +9.2%</td>
                <td>3.1M</td>
                <td style={{ color: 'var(--green)' }}>+5.1%</td>
                <td>
                  <button className="badge-tag badge-blue" onClick={() => navigate('/tradeone')}>Trade</button>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>SBIN 30OCT26 820 PE</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>₹14.80</td>
                <td style={{ color: 'var(--red)', fontWeight: 600 }}>▼ -6.3%</td>
                <td>2.8M</td>
                <td style={{ color: 'var(--red)' }}>-3.2%</td>
                <td>
                  <button className="badge-tag badge-blue" onClick={() => navigate('/tradeone')}>Trade</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
