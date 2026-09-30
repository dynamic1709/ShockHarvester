import { useState } from 'react'

export default function PositionsPage() {
  const [positions] = useState([
    {
      symbol: 'NIFTY 22800 CE',
      product: 'NRML',
      qty: 75,
      avgPrice: 32.40,
      ltp: 34.50,
      pnl: 157.50,
      pnlPct: 6.48,
    },
    {
      symbol: 'BANKBEES (Proxy Hedge)',
      product: 'CNC',
      qty: 620,
      avgPrice: 382.10,
      ltp: 385.40,
      pnl: 2046.00,
      pnlPct: 0.86,
    },
    {
      symbol: 'ITBEES (Proxy Hedge)',
      product: 'CNC',
      qty: 310,
      avgPrice: 41.20,
      ltp: 41.90,
      pnl: 217.00,
      pnlPct: 1.70,
    },
  ])

  const totalPnL = positions.reduce((acc, p) => acc + p.pnl, 0)

  return (
    <div className="page-container">
      <div className="portfolio-header-bar">
        <div className="portfolio-tabs">
          <span className="subnav-tab active">Day Positions (3)</span>
          <span className="subnav-tab">Overnight F&O</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            Total MTM: <span style={{ color: totalPnL >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
              {totalPnL >= 0 ? '+' : '-'}₹{Math.abs(totalPnL).toFixed(2)}
            </span>
          </div>
          <button className="btn-commodities" style={{ background: '#eb5b5b' }}>
            Exit All Positions
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Product</th>
              <th>Net Qty</th>
              <th>Avg Buy Price</th>
              <th>LTP</th>
              <th>MTM P&L</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, idx) => {
              const isPos = p.pnl >= 0
              return (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{p.symbol}</td>
                  <td><span className="badge-tag badge-blue">{p.product}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{p.qty}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>₹{p.avgPrice.toFixed(2)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{p.ltp.toFixed(2)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isPos ? 'var(--green)' : 'var(--red)' }}>
                    {isPos ? '+' : '-'}₹{Math.abs(p.pnl).toFixed(2)} ({p.pnlPct.toFixed(2)}%)
                  </td>
                  <td>
                    <button className="badge-tag badge-red" style={{ cursor: 'pointer' }}>Square Off</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
