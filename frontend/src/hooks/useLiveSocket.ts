import { useEffect, useRef, useState, useCallback } from 'react'

export interface LivePriceItem {
  symbol: string
  price: number
  change: number
  change_pct: number
  high?: number
  low?: number
  volume?: number
  is_halted?: boolean
}

export interface ShockAlert {
  scenario: string
  magnitude: number
  sectors: string[]
  triggered_at: string
}

export interface PipelineProgress {
  type: string
  run_id?: string
  stage?: string
  progress_pct?: number
  message?: string
  duration_sec?: number
  clients_rebalanced?: number
  total_trades?: number
  tax_alpha_saved?: number
}

export function useLiveSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [livePrices, setLivePrices] = useState<Record<string, LivePriceItem>>({})
  const [flashes, setFlashes] = useState<Record<string, 'up' | 'down'>>({})
  const [activeShock, setActiveShock] = useState<ShockAlert | null>(null)
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const flashTimeoutRef = useRef<Record<string, number>>({})

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host
    const wsUrl = `${protocol}//${host}/ws/live?token=${encodeURIComponent(token)}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'market_ticks' && Array.isArray(data.ticks)) {
          setLivePrices((prev) => {
            const next = { ...prev }
            const newFlashes: Record<string, 'up' | 'down'> = {}

            data.ticks.forEach((tick: LivePriceItem) => {
              const old = prev[tick.symbol]
              if (old && tick.price !== old.price) {
                newFlashes[tick.symbol] = tick.price > old.price ? 'up' : 'down'
              }
              next[tick.symbol] = { ...old, ...tick }
            })

            if (Object.keys(newFlashes).length > 0) {
              setFlashes((f) => ({ ...f, ...newFlashes }))
              // Clear flash after 800ms
              Object.keys(newFlashes).forEach((sym) => {
                if (flashTimeoutRef.current[sym]) {
                  window.clearTimeout(flashTimeoutRef.current[sym])
                }
                flashTimeoutRef.current[sym] = window.setTimeout(() => {
                  setFlashes((f) => {
                    const copy = { ...f }
                    delete copy[sym]
                    return copy
                  })
                }, 800)
              })
            }

            return next
          })
        } else if (data.type === 'shock_triggered') {
          setActiveShock(data.shock)
        } else if (data.type === 'market_reset') {
          setActiveShock(null)
          setPipelineProgress(null)
        } else if (data.type === 'rebalance_progress' || data.type === 'rebalance_completed') {
          setPipelineProgress(data)
          if (data.type === 'rebalance_completed') {
            setTimeout(() => {
              setPipelineProgress(null)
            }, 6000)
          }
        }
      } catch (err) {
        console.warn('WS parse error', err)
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  const ping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
    }
  }, [])

  return {
    isConnected,
    livePrices,
    flashes,
    activeShock,
    pipelineProgress,
    ping,
  }
}
