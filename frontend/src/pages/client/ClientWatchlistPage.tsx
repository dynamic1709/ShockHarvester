import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { formatINR, formatPct } from '../../utils/formatters'
import {
  Search,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

export const ClientWatchlistPage: React.FC = () => {
  const navigate = useNavigate()
  const [securities, setSecurities] = useState<any[]>([])
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all')
  const [search, setSearch] = useState('')
  const [selectedSector, setSelectedSector] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [secRes, wlRes] = await Promise.all([
        api.get('/api/market/securities'),
        api.get('/api/me/watchlist').catch(() => ({ data: [] })),
      ])
      setSecurities(secRes.data)
      const ids = new Set<string>(wlRes.data.map((item: any) => item.symbol))
      setWatchlistIds(ids)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px', color: '#94a3b8' }}>Loading market securities & watchlist...</div>
  }

  const toggleWatchlist = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const isSaved = watchlistIds.has(symbol)
    try {
      if (isSaved) {
        await api.delete(`/api/me/watchlist/${symbol}`)
        setWatchlistIds(prev => {
          const next = new Set(prev)
          next.delete(symbol)
          return next
        })
      } else {
        await api.post('/api/me/watchlist', { symbol })
        setWatchlistIds(prev => new Set(prev).add(symbol))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const sectors = ['all', ...Array.from(new Set(securities.map(s => s.sector).filter(Boolean)))]

  const filteredSecurities = securities.filter(s => {
    const matchSearch = s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())
    const matchSector = selectedSector === 'all' || s.sector === selectedSector
    const matchTab = activeTab === 'all' || watchlistIds.has(s.symbol)
    return matchSearch && matchSector && matchTab
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
            Market Watchlist & Securities
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Live NIFTY 50 equities, ETF pairs, and circuit band limits.
          </p>
        </div>

        {/* Tab Filter */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '6px 16px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              background: activeTab === 'all' ? '#10b981' : 'transparent',
              color: activeTab === 'all' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            All Securities ({securities.length})
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            style={{
              padding: '6px 16px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              background: activeTab === 'watchlist' ? '#10b981' : 'transparent',
              color: activeTab === 'watchlist' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Saved Watchlist ({watchlistIds.size})
          </button>
        </div>
      </div>

      {/* Search & Sector Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by stock symbol or company name (e.g. RELIANCE, TCS)..."
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '10px 14px 10px 40px',
              color: '#ffffff',
              fontSize: '13px',
            }}
          />
        </div>

        {/* Sector Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {sectors.map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedSector === sec ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                background: selectedSector === sec ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                color: selectedSector === sec ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textTransform: 'capitalize',
              }}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Securities Table */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(10, 14, 23, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 16px' }}>Instrument</th>
                <th style={{ padding: '14px 16px' }}>Sector / Type</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>LTP (Price)</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Day Change</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Circuit Band</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Lower / Upper</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSecurities.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No securities matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredSecurities.map((sec) => {
                  const isPos = sec.change >= 0
                  const isSaved = watchlistIds.has(sec.symbol)

                  return (
                    <tr
                      key={sec.id}
                      onClick={() => navigate(`/app/stocks/${sec.symbol}`)}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>{sec.symbol}</span>
                          {sec.symbol === 'SUZLON' && (
                            <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              5% BAND
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{sec.name}</div>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#94a3b8',
                          fontWeight: 600,
                        }}>
                          {sec.sector || sec.asset_class}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>
                        {formatINR(sec.ltp)}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 700,
                          color: isPos ? '#10b981' : '#f43f5e',
                        }}>
                          {isPos ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          {formatPct(sec.change_pct)}
                        </span>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {isPos ? `+${formatINR(sec.change)}` : formatINR(sec.change)}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: sec.circuit_band_pct <= 0.05 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.12)',
                          color: sec.circuit_band_pct <= 0.05 ? '#fbbf24' : '#38bdf8',
                        }}>
                          ±{(sec.circuit_band_pct * 100).toFixed(0)}%
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
                        <span style={{ color: '#f43f5e' }}>{formatINR(sec.lower_circuit)}</span>
                        <span style={{ margin: '0 4px', color: '#475569' }}>/</span>
                        <span style={{ color: '#10b981' }}>{formatINR(sec.upper_circuit)}</span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => toggleWatchlist(sec.symbol, e)}
                          title={isSaved ? "Remove from watchlist" : "Add to watchlist"}
                          style={{
                            background: isSaved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid',
                            borderColor: isSaved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            color: isSaved ? '#10b981' : '#94a3b8',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                          }}
                        >
                          {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                          <span>{isSaved ? 'Saved' : 'Watch'}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ClientWatchlistPage
