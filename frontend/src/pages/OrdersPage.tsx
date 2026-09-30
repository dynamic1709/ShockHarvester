import { useState } from 'react'

export default function OrdersPage() {
  const [tab, setTab] = useState<'Open' | 'Executed' | 'GTT' | 'Shock Harvester Auto-Orders'>('Open')

  const orders = [
    {
      id: 'ORD-98214',
      time: '14:32:10',
      symbol: 'NIFTY 22800 CE',
      type: 'LIMIT',
      side: 'BUY',
      qty: 75,
      price: 34.50,
      status: 'OPEN',
      trigger: 'Manual',
    },
    {
      id: 'ORD-98212',
      time: '13:45:00',
      symbol: 'HDFCBANK',
      type: 'MARKET',
      side: 'SELL',
      qty: 150,
      price: 1580.40,
      status: 'EXECUTED',
      trigger: '⚡ Shock Harvester Tax-Loss Trigger (-8.12%)',
    },
    {
      id: 'ORD-98213',
      time: '13:45:02',
      symbol: 'BANKBEES',
      type: 'MARKET',
      side: 'BUY',
      qty: 620,
      price: 382.10,
      status: 'EXECUTED',
      trigger: '⚡ Proxy Asset Re-investment (Wash-sale safe)',
    },
    {
      id: 'ORD-98201',
      time: '11:15:22',
      symbol: 'TCS',
      type: 'LIMIT',
      side: 'BUY',
      qty: 40,
      price: 3920.00,
      status: 'CANCELLED',
      trigger: 'Manual',
    },
  ]

  const filteredOrders = orders.filter(o => {
    if (tab === 'Open') return o.status === 'OPEN'
    if (tab === 'Executed') return o.status === 'EXECUTED'
    if (tab === 'Shock Harvester Auto-Orders') return o.trigger.includes('Shock Harvester')
    return true
  })

  return (
    <div className="page-container">
      <div className="portfolio-header-bar">
        <div className="portfolio-tabs">
          {(['Open', 'Executed', 'GTT', 'Shock Harvester Auto-Orders'] as const).map(t => (
            <span
              key={t}
              className={`subnav-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID / Time</th>
              <th>Instrument</th>
              <th>Type</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Status</th>
              <th>Trigger Reason</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(o => (
              <tr key={o.id}>
                <td>
                  <div style={{ fontWeight: 600, color: '#ffffff' }}>{o.id}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{o.time}</div>
                </td>
                <td style={{ fontWeight: 700 }}>{o.symbol}</td>
                <td><span className="badge-tag badge-blue">{o.type}</span></td>
                <td>
                  <span className={`badge-tag ${o.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                    {o.side}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{o.qty}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{o.price.toFixed(2)}</td>
                <td>
                  <span className={`badge-tag ${o.status === 'EXECUTED' ? 'badge-green' : o.status === 'OPEN' ? 'badge-amber' : 'badge-red'}`}>
                    {o.status}
                  </span>
                </td>
                <td style={{ fontSize: 11, color: o.trigger.includes('Shock') ? '#a78bfa' : 'var(--text-secondary)' }}>
                  {o.trigger}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
