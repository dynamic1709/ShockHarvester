import React from 'react'

interface PlaceholderProps {
  title: string
  subtitle: string
  badge?: string
}

export const ClientPagePlaceholder: React.FC<PlaceholderProps> = ({ title, subtitle, badge = 'Client View' }) => {
  return (
    <div style={{
      background: 'rgba(18, 24, 38, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '32px',
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <div style={{
        background: 'rgba(16, 185, 129, 0.12)',
        color: '#34d399',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 700,
        marginBottom: '16px',
        textTransform: 'uppercase',
      }}>
        {badge}
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
        {title}
      </h1>
      <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '500px' }}>
        {subtitle}
      </p>
    </div>
  )
}

export const ClientHomePage = () => (
  <ClientPagePlaceholder
    title="Portfolio & Shock Protection Home"
    subtitle="Live asset allocation donut, model drift tracker, current harvestable losses, and real-time shield telemetry."
  />
)

export const ClientWatchlistPage = () => (
  <ClientPagePlaceholder
    title="Market Watchlist"
    subtitle="Track NIFTY 50 securities, ETF pairs, live LTP with green/red flash, circuit limits, and volatility status."
  />
)

export const ClientStockDetailPage = () => (
  <ClientPagePlaceholder
    title="Stock Detail & FIFO Tax Lots"
    subtitle="High-definition TradingView candlestick charts, individual tax lot holding breakdown, and substitute pair recommendations."
  />
)

export const ClientPortfolioPage = () => (
  <ClientPagePlaceholder
    title="Portfolio & Asset Holdings"
    subtitle="Equity, debt, and gold weights, target drift comparison, and individual asset allocation."
  />
)

export const ClientTaxPage = () => (
  <ClientPagePlaceholder
    title="Tax Center (FY 2024-25)"
    subtitle="Short-Term & Long-Term Capital Gains tracking, ₹1.25L exemption utilization, harvestable loss lots, and 30-day cooling-off timer."
  />
)

export const ClientActivityPage = () => (
  <ClientPagePlaceholder
    title="Activity & Rebalance Logs"
    subtitle="Real-time execution feed, defensive trade tickets, AI plain-English commentary, and downloadable PDF audit reports."
  />
)

export const ClientProfilePage = () => (
  <ClientPagePlaceholder
    title="Investor Profile & Risk Parameters"
    subtitle="Configured risk tolerance (Conservative / Balanced / Aggressive), maximum drawdown limit, and notification preferences."
  />
)
