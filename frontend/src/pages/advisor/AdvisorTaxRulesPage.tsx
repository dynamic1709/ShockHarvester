import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Percent,
  Shield,
} from 'lucide-react'

interface TaxRulesData {
  financial_year: string
  stcg_rate: number
  ltcg_rate: number
  ltcg_annual_exemption_inr: number
  st_holding_threshold_days: number
  cooling_off_period_days: number
  stt_delivery_buy: number
  stt_delivery_sell: number
  brokerage_rate: number
  turnover_cap_per_asset: number
  lambda_tax: number
  lambda_harvest: number
  lambda_transaction: number
  set_off_matrix: Record<string, string>
}

export const AdvisorTaxRulesPage: React.FC = () => {
  const [rules, setRules] = useState<TaxRulesData | null>(null)

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('/api/advisor/tax-rules', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setRules(res.data)
      } catch (err) {
        console.error('Error fetching tax rules', err)
      }
    }
    fetchRules()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
          Indian Tax Law & Quantitative Engine Parameters
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
          Active statutory provisions under the Indian Income Tax Act (Finance Act 2024 amendments) governing automated harvesting.
        </p>
      </div>

      {/* ── Key Statutory Rules Cards ───────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>SHORT TERM CAPITAL GAIN (STCG)</span>
            <Percent size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>
            {rules ? `${(rules.stcg_rate * 100).toFixed(1)}%` : '20.0%'}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Applicable on equity held ≤ 365 days. Short term losses can offset both STCG and LTCG.
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>LONG TERM CAPITAL GAIN (LTCG)</span>
            <Percent size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8' }}>
            {rules ? `${(rules.ltcg_rate * 100).toFixed(1)}%` : '12.5%'}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Applicable on equity held &gt; 365 days. Long term losses offset LTCG only.
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#6ee7b7' }}>LTCG ANNUAL EXEMPTION</span>
            <Shield size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>
            ₹{rules ? (rules.ltcg_annual_exemption_inr / 100000).toFixed(2) : '1.25'} Lakh
          </div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '6px' }}>
            Tax-free threshold per financial year before 12.5% tax applies.
          </div>
        </div>
      </div>

      {/* ── Set-Off Matrix & Guardrails Parameters ───────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
      }}>
        {/* Set-off Rules Table */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: '0 0 14px' }}>
            Capital Loss Set-Off Rules
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '13px' }}>
                Short-Term Capital Loss (STCL)
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                Can be set off against <b>both STCG and LTCG</b> in the current assessment year.
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px' }}>
                Long-Term Capital Loss (LTCL)
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                Can <b>only be set off against LTCG</b>; cannot be used against STCG.
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: '13px' }}>
                Carry-Forward Provisions
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                Unabsorbed losses can be carried forward for up to <b>8 Assessment Years</b>.
              </div>
            </div>
          </div>
        </div>

        {/* Optimizer Weights & Friction */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: '0 0 14px' }}>
            Optimizer Weights & Transaction Friction
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ color: '#94a3b8' }}>30-Day Cooling Off Period:</span>
              <span style={{ color: '#f8fafc', fontWeight: 700 }}>{rules?.cooling_off_period_days || 30} Days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ color: '#94a3b8' }}>STT Delivery (Buy / Sell):</span>
              <span style={{ color: '#f8fafc', fontWeight: 700 }}>0.10% (Each Side)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ color: '#94a3b8' }}>Brokerage Rate:</span>
              <span style={{ color: '#f8fafc', fontWeight: 700 }}>0.03%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ color: '#94a3b8' }}>Max Turnover Cap Per Asset:</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{(rules?.turnover_cap_per_asset || 0.30) * 100}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: '#94a3b8' }}>Harvest Alpha Incentive (λ):</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{rules?.lambda_harvest || 0.40}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
