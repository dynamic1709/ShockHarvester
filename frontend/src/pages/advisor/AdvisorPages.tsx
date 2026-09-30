import React from 'react'

interface AdvisorPlaceholderProps {
  title: string
  subtitle: string
  badge?: string
}

export const AdvisorPagePlaceholder: React.FC<AdvisorPlaceholderProps> = ({ title, subtitle, badge = 'Advisor Console' }) => {
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '36px',
      minHeight: '420px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <div style={{
        background: 'rgba(56, 189, 248, 0.12)',
        color: '#38bdf8',
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
      <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '540px' }}>
        {subtitle}
      </p>
    </div>
  )
}

export const AdvisorCommandCenterPage = () => (
  <AdvisorPagePlaceholder
    title="Advisor Command Center"
    subtitle="Live NIFTY 50 telemetry, circuit monitoring, volatility gauges, and instant shock simulation trigger panel across 1,000+ client accounts."
  />
)

export const AdvisorClientsPage = () => (
  <AdvisorPagePlaceholder
    title="Client Directory (1,000 Accounts)"
    subtitle="Full directory with real-time risk drift indicators, harvestable alpha metrics, and instant 1-click View-As-Client preview mode."
  />
)

export const AdvisorRunsPage = () => (
  <AdvisorPagePlaceholder
    title="Rebalance Runs & Batch Execution"
    subtitle="Audit logs of all automated rebalances, sub-5-second execution timers, generated trades, and batch transaction status."
  />
)

export const AdvisorBacktestPage = () => (
  <AdvisorPagePlaceholder
    title="Backtest Studio"
    subtitle="Simulate historical crash events (COVID-19 2020, Election Day 2024) comparing ShockHarvester vs Calendar Rebalance vs Buy & Hold."
  />
)

export const AdvisorGuardrailsPage = () => (
  <AdvisorPagePlaceholder
    title="Guardrails & Circuit Violation Logs"
    subtitle="SEBI compliance audit, circuit band blocks (2%, 5%, 10%, 20%), 30-day cooling-off enforcement, and max turnover caps."
  />
)

export const AdvisorTaxRulesPage = () => (
  <AdvisorPagePlaceholder
    title="Tax & Regulatory Engine Parameters"
    subtitle="Indian Finance Act 2024 parameters: STCG (20%), LTCG (12.5%), ₹1.25L exemption, and quadratic optimizer loss weights."
  />
)

export const AdvisorSettingsPage = () => (
  <AdvisorPagePlaceholder
    title="System Settings & Demo Reset"
    subtitle="Simulation controls, market speed factor, API keys configuration, and instant 1-click Demo State Reset."
  />
)
