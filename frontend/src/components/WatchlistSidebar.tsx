import { useState } from 'react'
import { Settings, Maximize2, Search, SlidersHorizontal, Plus, ChevronRight } from 'lucide-react'

export interface WatchlistStock {
  symbol: string
  name: string
  exchange: string
  price: number
  change: number
  changePct: number
}

const INITIAL_WATCHLIST: WatchlistStock[] = [
  { symbol: 'KPIGREEN', name: 'KPI Green Energy Ltd', exchange: 'NSE', price: 374.45, change: 3.20, changePct: 0.86 },
  { symbol: 'BANKBARODA', name: 'Bank of Baroda', exchange: 'NSE', price: 235.26, change: 7.58, changePct: 3.33 },
  { symbol: 'DEVYANI', name: 'Devyani International', exchange: 'NSE', price: 131.20, change: 0.48, changePct: 0.37 },
  { symbol: 'TMPV', name: 'Tata Motors PV', exchange: 'NSE', price: 283.70, change: 2.75, changePct: 0.98 },
  { symbol: 'IOB', name: 'Indian Overseas Bank', exchange: 'NSE', price: 31.22, change: 0.27, changePct: 0.87 },
  { symbol: 'CCAVENUE', name: 'Infibeam Avenues', exchange: 'NSE', price: 15.31, change: -0.05, changePct: -0.33 },
  { symbol: 'IRFC', name: 'Indian Railway Finance', exchange: 'NSE', price: 80.95, change: 0.69, changePct: 0.86 },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', exchange: 'NSE', price: 430.70, change: 5.70, changePct: 1.34 },
  { symbol: 'IOC', name: 'Indian Oil Corporation', exchange: 'NSE', price: 135.01, change: 3.70, changePct: 2.82 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', exchange: 'NSE', price: 227.73, change: -2.27, changePct: -0.99 },
  { symbol: 'NTPC', name: 'NTPC Limited', exchange: 'NSE', price: 322.65, change: -0.85, changePct: -0.26 },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', exchange: 'NSE', price: 261.50, change: 0.00, changePct: 0.00 },
]

interface WatchlistSidebarProps {
  collapsed?: boolean
  selectedSymbol?: string
  onSelectStock?: (stock: WatchlistStock) => void
}

export default function WatchlistSidebar({
  collapsed = false,
  selectedSymbol = 'NIFTY',
  onSelectStock,
}: WatchlistSidebarProps) {
  const [activeTab, setActiveTab] = useState<'mywatchlist' | 'list 1' | 'Op'>('mywatchlist')
  const [searchQuery, setSearchQuery] = useState('')
  const [stocks] = useState<WatchlistStock[]>(INITIAL_WATCHLIST)

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside className={`watchlist-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="watchlist-header">
        <span className="watchlist-title">Watchlist</span>
        <div className="watchlist-actions">
          <button className="watchlist-icon-btn" title="Watchlist Settings">
            <Settings size={14} />
          </button>
          <button className="watchlist-icon-btn" title="Expand View">
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="watchlist-tabs">
        <span 
          className={`w-tab ${activeTab === 'mywatchlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('mywatchlist')}
        >
          mywatchlist
        </span>
        <span 
          className={`w-tab ${activeTab === 'list 1' ? 'active' : ''}`}
          onClick={() => setActiveTab('list 1')}
        >
          list 1
        </span>
        <span 
          className={`w-tab ${activeTab === 'Op' ? 'active' : ''}`}
          onClick={() => setActiveTab('Op')}
        >
          Op
        </span>
        <button className="watchlist-icon-btn" style={{ marginLeft: 'auto' }} title="Add Watchlist">
          <Plus size={14} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="watchlist-search">
        <div className="w-search-box">
          <Search size={13} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="watchlist-icon-btn" title="Filters">
          <SlidersHorizontal size={13} />
        </button>
      </div>

      {/* Stocks List */}
      <div className="watchlist-items-list">
        {filteredStocks.map((stock) => {
          const isPos = stock.change > 0
          const isNeg = stock.change < 0
          const isSelected = stock.symbol === selectedSymbol

          return (
            <div 
              key={stock.symbol} 
              className={`stock-row ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectStock && onSelectStock(stock)}
            >
              <div className="stock-left">
                <div className="stock-symbol-row">
                  <span className="stock-symbol">{stock.symbol}</span>
                  <span className="exchange-tag">{stock.exchange}</span>
                </div>
              </div>

              <div className="stock-right">
                <span className={`stock-price ${isPos ? 'positive' : isNeg ? 'negative' : 'neutral'}`}>
                  {stock.price.toFixed(2)} {isPos ? '▲' : isNeg ? '▼' : ''}
                </span>
                <span className={`stock-change ${isPos ? 'positive' : isNeg ? 'negative' : 'neutral'}`}>
                  {isPos ? `+${stock.change.toFixed(2)} (+${stock.changePct.toFixed(2)}%)` : 
                   isNeg ? `${stock.change.toFixed(2)} (${stock.changePct.toFixed(2)}%)` : 
                   '0.00 (0.00%)'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Footer Action */}
      <div className="watchlist-footer">
        <span>OPTIONS QUICK LIST</span>
        <ChevronRight size={14} />
      </div>
    </aside>
  )
}
