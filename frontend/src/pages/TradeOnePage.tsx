import { useState } from 'react'
import { 
  CandlestickChart, 
  Layers, 
  Activity, 
  Settings, 
  Camera, 
  Maximize2, 
  Zap, 
  Plus, 
  Minus, 
  Undo, 
  Redo, 
  TrendingUp, 
  Slash, 
  PenTool, 
  Type, 
  Ruler, 
  Search, 
  Magnet, 
  Lock, 
  EyeOff, 
  Trash2, 
  BookOpen, 
  BarChart2, 
  ListOrdered,
  MoreVertical,
  CheckCircle2
} from 'lucide-react'

// Simulated Candlesticks for NIFTY 5m
const CANDLE_DATA = [
  { time: '13:00', open: 22850, high: 22875, low: 22840, close: 22865, volume: 420 },
  { time: '13:05', open: 22865, high: 22880, low: 22850, close: 22855, volume: 380 },
  { time: '13:10', open: 22855, high: 22860, low: 22820, close: 22830, volume: 550 },
  { time: '13:15', open: 22830, high: 22845, low: 22800, close: 22810, volume: 620 },
  { time: '13:20', open: 22810, high: 22825, low: 22770, close: 22780, volume: 780 },
  { time: '13:25', open: 22780, high: 22795, low: 22760, close: 22770, volume: 810 },
  { time: '13:30', open: 22770, high: 22810, low: 22765, close: 22805, volume: 490 },
  { time: '13:35', open: 22805, high: 22830, low: 22795, close: 22820, volume: 530 },
  { time: '13:40', open: 22820, high: 22840, low: 22810, close: 22835, volume: 410 },
  { time: '13:45', open: 22835, high: 22850, low: 22815, close: 22825, volume: 390 },
  { time: '13:50', open: 22825, high: 22835, low: 22780, close: 22790, volume: 670 },
  { time: '13:55', open: 22790, high: 22800, low: 22740, close: 22750, volume: 890 },
  { time: '14:00', open: 22750, high: 22770, low: 22710, close: 22720, volume: 920 },
  { time: '14:05', open: 22720, high: 22755, low: 22715, close: 22745, volume: 750 },
  { time: '14:10', open: 22745, high: 22780, low: 22740, close: 22770, volume: 640 },
  { time: '14:15', open: 22770, high: 22795, low: 22760, close: 22785, volume: 580 },
  { time: '14:20', open: 22785, high: 22810, low: 22775, close: 22800, volume: 520 },
  { time: '14:25', open: 22800, high: 22805, low: 22765, close: 22770, volume: 480 },
  { time: '14:30', open: 22770, high: 22790, low: 22755, close: 22780, volume: 510 },
  { time: '14:35', open: 22780, high: 22815, low: 22770, close: 22810, volume: 610 },
  { time: '14:40', open: 22810, high: 22830, low: 22790, close: 22820, volume: 540 },
  { time: '14:45', open: 22820, high: 22845, low: 22805, close: 22840, volume: 590 },
  { time: '14:50', open: 22840, high: 22860, low: 22820, close: 22855, volume: 660 },
  { time: '14:55', open: 22855, high: 22870, low: 22830, close: 22860, volume: 630 },
  { time: '15:00', open: 22860, high: 22880, low: 22845, close: 22870, volume: 710 },
  { time: '15:05', open: 22870, high: 22875, low: 22768, close: 22778.45, volume: 351 },
]

export default function TradeOnePage() {
  const [activeTab, setActiveTab] = useState<'Chart' | 'Overview' | 'Option Chain' | 'Stock Composition'>('Chart')
  const [activeTimeframe, setActiveTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('5m')
  const [instantOrders, setInstantOrders] = useState(false)
  const [activeDrawingTool, setActiveDrawingTool] = useState<string>('crosshair')
  const [activeRightDock, setActiveRightDock] = useState<'watchlist' | 'positions' | 'orders' | 'depth' | 'chain'>('watchlist')

  // Scalper Dock state
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY')
  const [optionType, setOptionType] = useState<'CALL' | 'PUT'>('CALL')
  const [strikeType, setStrikeType] = useState<'ATM' | 'ITM' | 'OTM'>('ATM')
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT')
  const [lots, setLots] = useState(1)
  const [limitPrice, setLimitPrice] = useState('22763.10')
  const [orderSuccessToast, setOrderSuccessToast] = useState<string | null>(null)
  const [slModal, setSlModal] = useState(false)

  const handleExecuteOrder = () => {
    const msg = `Instant ${orderSide} Order Placed: ${lots} Lot(s) NIFTY ${strikeType} ${optionType} @ ₹${limitPrice}`
    setOrderSuccessToast(msg)
    setTimeout(() => setOrderSuccessToast(null), 3500)
  }

  const minPrice = 22700
  const maxPrice = 22900
  const priceRange = maxPrice - minPrice

  return (
    <div className="tradeone-container">
      {/* Top Subbar (Screenshot 4) */}
      <div className="tradeone-subbar">
        <div className="tradeone-tabs">
          {(['Chart', 'Overview', 'Option Chain', 'Stock Composition'] as const).map((tab) => (
            <span
              key={tab}
              className={`to-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </span>
          ))}
        </div>

        <div className="tradeone-subbar-right">
          <button className="btn-scalper-mode">
            <Zap size={13} />
            SCALPER MODE
          </button>
          <button className="watchlist-icon-btn" title="Fullscreen">
            <Maximize2 size={13} />
          </button>
          <button className="watchlist-icon-btn" title="Save Layout">
            <span style={{ fontSize: 11, fontWeight: 600 }}>Save</span>
          </button>
          <button className="watchlist-icon-btn" title="Chart Settings">
            <Settings size={13} />
          </button>
          <button className="watchlist-icon-btn" title="Screenshot">
            <Camera size={13} />
          </button>
        </div>
      </div>

      {/* Chart Toolbar (Screenshot 4) */}
      <div className="tradeone-chart-toolbar">
        <div className="chart-toolbar-left">
          {/* Timeframes */}
          <div className="timeframe-group">
            {(['1m', '5m', '15m', '1h', '1D'] as const).map((tf) => (
              <button
                key={tf}
                className={`tf-btn ${activeTimeframe === tf ? 'active' : ''}`}
                onClick={() => setActiveTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 16, background: '#222b3b' }} />

          {/* Candle Type */}
          <button className="watchlist-icon-btn" title="Candles">
            <CandlestickChart size={14} color="#387ed1" />
          </button>

          {/* Indicators */}
          <button className="nav-link-btn" style={{ padding: '2px 8px', fontSize: 11 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>fx</span>
            <span>Indicators</span>
          </button>

          <div style={{ width: 1, height: 16, background: '#222b3b' }} />

          {/* Instant Orders Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Instant Orders</span>
            <input 
              type="checkbox" 
              checked={instantOrders} 
              onChange={(e) => setInstantOrders(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
          </div>

          {/* Undo / Redo */}
          <div style={{ display: 'flex', gap: 2 }}>
            <button className="watchlist-icon-btn"><Undo size={12} /></button>
            <button className="watchlist-icon-btn"><Redo size={12} /></button>
          </div>
        </div>

        {/* OHLC Summary for Active Symbol */}
        <div className="symbol-ohlc-summary">
          <div className="symbol-name-badge">
            <span>NIFTY • 5 • NSE</span>
            <span style={{ color: '#00d09c' }}>●</span>
          </div>
          <div className="symbol-ohlc-numbers">
            O 22768.20 H 22778.75 L 22768.20 C 22778.45 +10.30 (+0.05%)
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Volume <span style={{ color: '#387ed1' }}>351</span>
          </div>
        </div>
      </div>

      {/* Main Trading Workspace */}
      <div className="tradeone-workspace">
        {/* Left Drawing Tools Toolbar (Screenshot 4) */}
        <div className="drawing-toolbar">
          <button 
            className={`tool-icon-btn ${activeDrawingTool === 'crosshair' ? 'active' : ''}`}
            onClick={() => setActiveDrawingTool('crosshair')}
            title="Crosshair"
          >
            <Plus size={15} />
          </button>

          <button 
            className={`tool-icon-btn ${activeDrawingTool === 'line' ? 'active' : ''}`}
            onClick={() => setActiveDrawingTool('line')}
            title="Trend Line"
          >
            <Slash size={15} />
          </button>

          <button 
            className={`tool-icon-btn ${activeDrawingTool === 'fib' ? 'active' : ''}`}
            onClick={() => setActiveDrawingTool('fib')}
            title="Pitchfork / Fib Retracement"
          >
            <TrendingUp size={15} />
          </button>

          <button 
            className={`tool-icon-btn ${activeDrawingTool === 'brush' ? 'active' : ''}`}
            onClick={() => setActiveDrawingTool('brush')}
            title="Brush / Highlighter"
          >
            <PenTool size={15} />
          </button>

          <button 
            className={`tool-icon-btn ${activeDrawingTool === 'text' ? 'active' : ''}`}
            onClick={() => setActiveDrawingTool('text')}
            title="Text Note"
          >
            <Type size={15} />
          </button>

          <button 
            className={`tool-icon-btn ${activeDrawingTool === 'measure' ? 'active' : ''}`}
            onClick={() => setActiveDrawingTool('measure')}
            title="Measure Range"
          >
            <Ruler size={15} />
          </button>

          <button 
            className={`tool-icon-btn ${activeDrawingTool === 'zoom' ? 'active' : ''}`}
            onClick={() => setActiveDrawingTool('zoom')}
            title="Zoom In"
          >
            <Search size={15} />
          </button>

          <div style={{ width: 24, height: 1, background: '#1c2433' }} />

          <button className="tool-icon-btn" title="Magnet Mode"><Magnet size={15} /></button>
          <button className="tool-icon-btn" title="Lock All Tools"><Lock size={15} /></button>
          <button className="tool-icon-btn" title="Hide Drawings"><EyeOff size={15} /></button>
          <button className="tool-icon-btn" title="Delete Drawings"><Trash2 size={15} /></button>
        </div>

        {/* Candlestick Interactive Canvas */}
        <div className="chart-viewport">
          <svg width="100%" height="100%" style={{ background: '#08090d' }}>
            {/* Price Grid Lines */}
            {[22875, 22850, 22825, 22800, 22778.45, 22750, 22725].map((price) => {
              const yPct = ((maxPrice - price) / priceRange) * 75 + 10
              const isCurrent = price === 22778.45
              return (
                <g key={price}>
                  <line
                    x1="0"
                    y1={`${yPct}%`}
                    x2="92%"
                    y2={`${yPct}%`}
                    stroke={isCurrent ? '#00d09c' : '#171d2b'}
                    strokeDasharray={isCurrent ? '4 4' : 'none'}
                    strokeWidth={isCurrent ? 1.5 : 1}
                  />
                  {/* Price Label on Right Axis */}
                  <rect
                    x="92%"
                    y={`calc(${yPct}% - 10px)`}
                    width="65"
                    height="20"
                    fill={isCurrent ? '#00d09c' : '#11151f'}
                    rx="3"
                  />
                  <text
                    x="94%"
                    y={`calc(${yPct}% + 4px)`}
                    fill={isCurrent ? '#000000' : '#8c9bb3'}
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    fontWeight={isCurrent ? '700' : '500'}
                  >
                    {price.toFixed(2)}
                  </text>
                </g>
              )
            })}

            {/* Candlesticks & Volume Bars */}
            {CANDLE_DATA.map((c, i) => {
              const totalCandles = CANDLE_DATA.length
              const xPct = (i / (totalCandles + 2)) * 88 + 3
              const isGreen = c.close >= c.open
              const color = isGreen ? '#00d09c' : '#eb5b5b'

              const highY = ((maxPrice - c.high) / priceRange) * 75 + 10
              const lowY = ((maxPrice - c.low) / priceRange) * 75 + 10
              const openY = ((maxPrice - c.open) / priceRange) * 75 + 10
              const closeY = ((maxPrice - c.close) / priceRange) * 75 + 10

              const bodyTop = Math.min(openY, closeY)
              const bodyHeight = Math.max(Math.abs(openY - closeY), 0.5)

              // Volume bar at bottom
              const volHeight = (c.volume / 1000) * 15

              return (
                <g key={i}>
                  {/* Wick */}
                  <line
                    x1={`${xPct}%`}
                    y1={`${highY}%`}
                    x2={`${xPct}%`}
                    y2={`${lowY}%`}
                    stroke={color}
                    strokeWidth="1.5"
                  />
                  {/* Candle Body */}
                  <rect
                    x={`calc(${xPct}% - 7px)`}
                    y={`${bodyTop}%`}
                    width="14"
                    height={`${bodyHeight}%`}
                    fill={color}
                    rx="1"
                  />
                  {/* Volume Bar */}
                  <rect
                    x={`calc(${xPct}% - 6px)`}
                    y={`${95 - volHeight}%`}
                    width="12"
                    height={`${volHeight}%`}
                    fill={color}
                    opacity="0.3"
                  />
                </g>
              )
            })}
          </svg>

          {/* Floating Scalper Order Dock (Screenshot 4) */}
          <div className="scalper-dock">
            <div className="dock-symbol-info">
              <span className="dock-sym">NIFTY</span>
              <span className="dock-price">22,778.45 ▲ +62.25 (+0.27%)</span>
            </div>

            {/* Buy / Sell Buttons */}
            <div className="bs-toggle-group">
              <button 
                className={`bs-btn buy ${orderSide === 'BUY' ? 'active' : ''}`}
                onClick={() => setOrderSide('BUY')}
              >
                B
              </button>
              <button 
                className={`bs-btn sell ${orderSide === 'SELL' ? 'active' : ''}`}
                onClick={() => setOrderSide('SELL')}
              >
                S
              </button>
            </div>

            {/* Call / Put */}
            <select 
              className="dock-select" 
              value={optionType} 
              onChange={(e) => setOptionType(e.target.value as 'CALL' | 'PUT')}
            >
              <option value="CALL">CALL</option>
              <option value="PUT">PUT</option>
            </select>

            {/* Strike: ATM / ITM / OTM */}
            <select 
              className="dock-select" 
              value={strikeType} 
              onChange={(e) => setStrikeType(e.target.value as 'ATM' | 'ITM' | 'OTM')}
            >
              <option value="ATM">ATM (22800)</option>
              <option value="ITM">ITM (22700)</option>
              <option value="OTM">OTM (22900)</option>
            </select>

            {/* Lots Input */}
            <div className="dock-input-box">
              <button className="watchlist-icon-btn" onClick={() => setLots(Math.max(1, lots - 1))}>
                <Minus size={11} />
              </button>
              <input 
                type="number" 
                value={lots} 
                onChange={(e) => setLots(parseInt(e.target.value) || 1)} 
              />
              <button className="watchlist-icon-btn" onClick={() => setLots(lots + 1)}>
                <Plus size={11} />
              </button>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Lots</span>
            </div>

            {/* Limit / Market & Price */}
            <select 
              className="dock-select" 
              value={orderType} 
              onChange={(e) => setOrderType(e.target.value as 'LIMIT' | 'MARKET')}
            >
              <option value="LIMIT">LIMIT</option>
              <option value="MARKET">MARKET</option>
            </select>

            <div className="dock-input-box">
              <input 
                type="text" 
                value={limitPrice} 
                onChange={(e) => setLimitPrice(e.target.value)} 
              />
            </div>

            {/* Execute Buy/Sell Button */}
            <button 
              className={orderSide === 'BUY' ? 'btn-dock-buy' : 'btn-dock-sell'}
              onClick={handleExecuteOrder}
            >
              {orderSide} @ {limitPrice}
            </button>

            {/* Set SL/TGT */}
            <button className="btn-dock-sltgt" onClick={() => setSlModal(!slModal)}>
              <Settings size={12} />
              SET SL/TGT
            </button>
          </div>

          {/* Toast Notification */}
          {orderSuccessToast && (
            <div 
              style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#00d09c',
                color: '#000000',
                fontWeight: 700,
                padding: '10px 20px',
                borderRadius: 8,
                boxShadow: '0 10px 30px rgba(0, 208, 156, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 200,
              }}
            >
              <CheckCircle2 size={16} />
              {orderSuccessToast}
            </div>
          )}
        </div>

        {/* Right Collapsed Side Dock Tabs (Screenshot 4) */}
        <div className="terminal-right-dock">
          <div 
            className={`right-dock-item ${activeRightDock === 'watchlist' ? 'active' : ''}`}
            onClick={() => setActiveRightDock('watchlist')}
            title="Watchlist"
          >
            <BookOpen size={16} />
            <span className="right-dock-label">Watchlist</span>
          </div>

          <div 
            className={`right-dock-item ${activeRightDock === 'positions' ? 'active' : ''}`}
            onClick={() => setActiveRightDock('positions')}
            title="Positions"
          >
            <Activity size={16} />
            <span className="right-dock-label">Positions</span>
          </div>

          <div 
            className={`right-dock-item ${activeRightDock === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveRightDock('orders')}
            title="Orders"
          >
            <ListOrdered size={16} />
            <span className="right-dock-label">Orders</span>
          </div>

          <div 
            className={`right-dock-item ${activeRightDock === 'depth' ? 'active' : ''}`}
            onClick={() => setActiveRightDock('depth')}
            title="Market Depth"
          >
            <BarChart2 size={16} />
            <span className="right-dock-label">Depth</span>
          </div>

          <div 
            className={`right-dock-item ${activeRightDock === 'chain' ? 'active' : ''}`}
            onClick={() => setActiveRightDock('chain')}
            title="Option Chain"
          >
            <Layers size={16} />
            <span className="right-dock-label">Chain</span>
          </div>

          <div className="right-dock-item" title="More Options">
            <MoreVertical size={16} />
            <span className="right-dock-label">More</span>
          </div>
        </div>
      </div>

      {/* Terminal Bottom Status Bar (Screenshot 4) */}
      <div className="tradeone-bottom-bar">
        <div style={{ display: 'flex', gap: 16 }}>
          <span>1D  5D  1M  3M  6M  1Y  5Y</span>
          <span>12:37:25 (UTC+5:30)</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <span>%</span>
          <span>log</span>
          <span style={{ color: '#387ed1', fontWeight: 600 }}>auto</span>
        </div>
      </div>
    </div>
  )
}
