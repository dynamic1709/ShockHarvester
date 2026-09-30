import { useState } from 'react'
import { Sparkles, X, Send, Zap, TrendingUp, AlertTriangle } from 'lucide-react'

export default function AskAngelModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am Angel AI & ShockHarvester Assistant. Ask me about tax harvesting opportunities, portfolio risk analysis, or market momentum for your active securities.',
    },
  ])
  const [inputVal, setInputVal] = useState('')

  const handleSend = () => {
    if (!inputVal.trim()) return
    const q = inputVal
    setMessages((prev) => [...prev, { sender: 'user', text: q }])
    setInputVal('')

    setTimeout(() => {
      let reply = "Analyzing market depth and tax-loss opportunities... Currently 3 securities in your basket are near optimal shock harvest thresholds (HDFCBANK, TCS, INFY). You could realize ₹42,500 in harvestable capital losses while replacing them with correlated proxy ETFs."
      if (q.toLowerCase().includes('nifty')) {
        reply = "NIFTY is trading at 22,778.45 (+0.27%). Support is at 22,650 and Resistance is at 22,850. Shock volatility is currently moderate."
      } else if (q.toLowerCase().includes('tax') || q.toLowerCase().includes('harvest')) {
        reply = "Under Section 112A / STCG rules, realized short-term capital losses can offset both STCG and LTCG. Ensure a 30-day cooling-off period before repurchasing identical scrips to prevent wash-sale disallowance."
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }])
    }, 600)
  }

  return (
    <>
      {/* Floating Pill Button */}
      <div className="ask-angel-pill" onClick={() => setIsOpen(true)}>
        <Sparkles size={16} />
        <span>Ask Angel</span>
      </div>

      {/* Slide-in Modal Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            width: 380,
            height: 500,
            background: '#151923',
            border: '1px solid #273145',
            borderRadius: 14,
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              background: '#10141c',
              borderBottom: '1px solid #232c3d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #387ed1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Sparkles size={15} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff' }}>Ask Angel AI</div>
                <div style={{ fontSize: 10, color: '#00d09c' }}>● Shock Harvester Intelligence Active</div>
              </div>
            </div>
            <button className="watchlist-icon-btn" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Quick Prompts */}
          <div style={{ padding: '8px 12px', background: '#121621', display: 'flex', gap: 6, overflowX: 'auto' }}>
            <button
              style={{
                fontSize: 10,
                background: '#1a2233',
                color: '#387ed1',
                padding: '4px 8px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}
              onClick={() => setInputVal('Check tax harvestable losses')}
            >
              <Zap size={10} style={{ display: 'inline', marginRight: 3 }} /> Tax Harvest
            </button>
            <button
              style={{
                fontSize: 10,
                background: '#1a2233',
                color: '#00d09c',
                padding: '4px 8px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}
              onClick={() => setInputVal('NIFTY market outlook')}
            >
              <TrendingUp size={10} style={{ display: 'inline', marginRight: 3 }} /> NIFTY Trend
            </button>
            <button
              style={{
                fontSize: 10,
                background: '#1a2233',
                color: '#f59e0b',
                padding: '4px 8px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}
              onClick={() => setInputVal('Wash-sale cooling off rules')}
            >
              <AlertTriangle size={10} style={{ display: 'inline', marginRight: 3 }} /> Cooling Off
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.sender === 'user' ? '#2563eb' : '#1e2638',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: 10, borderTop: '1px solid #232c3d', background: '#10141c', display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Ask about stocks, F&O, tax harvesting..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                background: '#1b202c',
                border: '1px solid #283347',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                color: '#ffffff',
              }}
            />
            <button
              onClick={handleSend}
              style={{
                background: '#387ed1',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
