import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Search, Eye, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ClientItem {
  id: string
  name: string
  email: string
  risk_profile: string
  model_name: string
  portfolio_value_inr: number
  cash_balance_inr: number
  lots_count: number
  net_stcg_inr: number
  net_ltcg_inr: number
  is_active: boolean
}

interface ClientDetail {
  id: string
  name: string
  email: string
  risk_profile: string
  model_name: string
  portfolio_value_inr: number
  equity_value_inr: number
  cash_balance_inr: number
  target_weights: Record<string, number>
  tax_lots: Array<{
    id: string
    symbol: string
    name: string
    buy_date: string
    buy_price: number
    current_price: number
    original_qty: number
    remaining_qty: number
    current_value: number
    unrealized_gain_loss: number
    term: string
    substitute_symbol: string
  }>
  recent_trades: Array<{
    id: string
    symbol: string
    side: string
    qty: number
    price: number
    amount: number
    executed_at: string
  }>
}

export const AdvisorClientsPage: React.FC = () => {
  const [clients, setClients] = useState<ClientItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null)
  const navigate = useNavigate()

  const fetchClients = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params: any = { page, limit: 25 }
      if (search) params.search = search
      if (riskFilter) params.risk_profile = riskFilter

      const res = await axios.get('/api/advisor/clients', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      setClients(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      console.error('Error loading clients', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [page, search, riskFilter])

  const openClientDetail = async (clientId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`/api/advisor/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSelectedClient(res.data)
    } catch (err) {
      console.error('Error fetching client details', err)
    }
  }

  const handleViewAsClient = (_email: string) => {
    navigate('/app')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* ── Header & Search Toolbar ─────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Client Directory ({total.toLocaleString()} Accounts)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            Search and audit portfolio valuations, FIFO lots, and realized tax gains across all managed investors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            minWidth: '260px',
          }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '9px 12px 9px 36px',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Risk Profile Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value)
              setPage(1)
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '9px 14px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Risk Profiles</option>
            <option value="aggressive">Aggressive (70/30)</option>
            <option value="balanced">Balanced (60/40)</option>
            <option value="conservative">Conservative (40/60)</option>
          </select>
        </div>
      </div>

      {/* ── Clients Data Table ──────────────────────────────────────── */}
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
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>INVESTOR</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>RISK MODEL</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>PORTFOLIO VALUE</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>CASH (₹)</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>LOTS</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>REALIZED GAIN</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Loading accounts...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No matching clients found.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => openClientDetail(c.id)}
                    className="hover:bg-slate-800/40"
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{c.email}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          c.risk_profile === 'aggressive'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : c.risk_profile === 'conservative'
                            ? 'rgba(56, 189, 248, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color:
                          c.risk_profile === 'aggressive'
                            ? '#f87171'
                            : c.risk_profile === 'conservative'
                            ? '#38bdf8'
                            : '#34d399',
                        textTransform: 'uppercase',
                      }}>
                        {c.risk_profile}
                      </span>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{c.model_name}</div>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: '#f8fafc' }}>
                      ₹{c.portfolio_value_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', color: '#94a3b8' }}>
                      ₹{c.cash_balance_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center', color: '#cbd5e1' }}>
                      {c.lots_count}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <span style={{
                        color: c.net_stcg_inr + c.net_ltcg_inr >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: 700,
                      }}>
                        ₹{(c.net_stcg_inr + c.net_ltcg_inr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openClientDetail(c.id)
                        }}
                        style={{
                          background: 'rgba(56, 189, 248, 0.12)',
                          border: 'none',
                          color: '#38bdf8',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={13} /> Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#94a3b8',
        }}>
          <div>
            Showing {clients.length > 0 ? (page - 1) * 25 + 1 : 0} to {Math.min(page * 25, total)} of {total} accounts
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: page === 1 ? '#475569' : '#f8fafc',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 25 >= total}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: page * 25 >= total ? '#475569' : '#f8fafc',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: page * 25 >= total ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── Slide-Out Client Detail Drawer ──────────────────────────── */}
      {selectedClient && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '560px',
          maxWidth: '90vw',
          background: '#0b132b',
          borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.6)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                {selectedClient.name}
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedClient.email}</div>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94a3b8',
                padding: '6px',
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => handleViewAsClient(selectedClient.email)}
              style={{
                flex: 1,
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
              <Eye size={14} /> Open Live Client Portal View
            </button>
          </div>

          {/* Stats Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Portfolio Valuation</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                ₹{selectedClient.portfolio_value_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Risk Profile</span>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', textTransform: 'capitalize' }}>
                {selectedClient.risk_profile} ({selectedClient.model_name})
              </div>
            </div>
          </div>

          {/* Tax Lots Accordion */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Open FIFO Tax Lots ({selectedClient.tax_lots.length})
            </h4>
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedClient.tax_lots.map((lot) => (
                <div
                  key={lot.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{lot.symbol}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>
                      Bought: {lot.buy_date} · {lot.remaining_qty} shares @ ₹{lot.buy_price.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: lot.unrealized_gain_loss >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                      {lot.unrealized_gain_loss >= 0 ? '+' : ''}₹{lot.unrealized_gain_loss.toFixed(2)}
                    </div>
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: lot.term === 'LTCG' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: lot.term === 'LTCG' ? '#38bdf8' : '#f59e0b',
                    }}>
                      {lot.term}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trades */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Recent Executed Trades
            </h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedClient.recent_trades.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '12px' }}>No trades recorded yet.</div>
              ) : (
                selectedClient.recent_trades.map((tr) => (
                  <div
                    key={tr.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <span style={{
                        color: tr.side === 'BUY' ? '#10b981' : '#ef4444',
                        fontWeight: 800,
                        marginRight: '6px',
                      }}>
                        {tr.side}
                      </span>
                      <span style={{ color: '#f8fafc', fontWeight: 600 }}>{tr.symbol}</span>
                      <span style={{ color: '#64748b', marginLeft: '6px' }}>x {tr.qty}</span>
                    </div>
                    <div style={{ color: '#f8fafc', fontWeight: 700 }}>
                      ₹{tr.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
