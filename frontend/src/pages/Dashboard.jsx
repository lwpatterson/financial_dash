import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import { Plus, RefreshCw, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function IndicatorBadge({ label, value, unit = '' }) {
  if (value === null || value === undefined) return null
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted">{label}</span>
      <span className="mono text-sm font-medium">
        {unit === '$' ? '$' : ''}{typeof value === 'number' ? value.toFixed(2) : value}{unit !== '$' ? unit : ''}
      </span>
    </div>
  )
}

function PatternBadge({ label, active }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${active ? 'badge-green' : 'badge-muted'}`}>
      {label} {active ? '✓' : '—'}
    </span>
  )
}

function TickerCard({ ticker, onRemove, onRefresh }) {
  const [chart, setChart] = useState([])
  const [loading, setLoading] = useState(false)
  const ind = ticker.indicators || {}
  const price = ind.price
  const change = price && ind.open ? ((price - ind.open) / ind.open * 100) : null

  useEffect(() => {
    // Fetch full indicators with history for chart
    api.getIndicators(ticker.symbol).then(data => {
      if (data.history) setChart(data.history)
    }).catch(() => {})
  }, [ticker.symbol])

  const refresh = async () => {
    setLoading(true)
    await onRefresh(ticker.symbol)
    setLoading(false)
  }

  const changeColor = change === null ? 'text-muted' : change >= 0 ? 'text-green-400' : 'text-red-400'
  const ChangeIcon = change === null ? Minus : change >= 0 ? TrendingUp : TrendingDown

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold mono">{ticker.symbol}</h2>
            <span className={`flex items-center gap-1 text-sm ${changeColor}`}>
              <ChangeIcon size={14} />
              {change !== null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
            </span>
          </div>
          <p className="text-muted text-xs mt-0.5">
            {ticker.cache_age_minutes !== null
              ? `Updated ${ticker.cache_age_minutes}m ago`
              : 'Not yet fetched'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading}
            className="p-1.5 rounded-lg text-muted hover:text-slate-200 hover:bg-white/5 transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => onRemove(ticker.symbol)}
            className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/5 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Price */}
      {price && (
        <div className="mono text-3xl font-semibold">
          ${price.toFixed(2)}
        </div>
      )}

      {/* Mini chart */}
      {chart.length > 0 && (
        <div className="h-24 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <Line
                type="monotone"
                dataKey="close"
                stroke={change >= 0 ? '#22c55e' : '#ef4444'}
                dot={false}
                strokeWidth={1.5}
              />
              <XAxis dataKey="date" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                contentStyle={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#64748b' }}
                formatter={(v) => [`$${v.toFixed(2)}`, 'Close']}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Indicators grid */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
        <IndicatorBadge label="RSI 14"   value={ind.rsi}         />
        <IndicatorBadge label="MACD"     value={ind.macd}        />
        <IndicatorBadge label="Vol ×"    value={ind.volume_ratio} unit="x" />
        <IndicatorBadge label="SMA 50"   value={ind.sma_50}      unit="$" />
        <IndicatorBadge label="SMA 200"  value={ind.sma_200}     unit="$" />
        <IndicatorBadge label="BB Upper" value={ind.bb_upper}    unit="$" />
      </div>

      {/* Pattern badges */}
      <div className="flex flex-wrap gap-2">
        <PatternBadge label="MMBM Sweep"  active={ind.mmbm_sweep}  />
        <PatternBadge label="MMBM Signal" active={ind.mmbm_signal} />
        <PatternBadge label="MMSM Sweep"  active={ind.mmsm_sweep}  />
        <PatternBadge label="MMSM Signal" active={ind.mmsm_signal} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [tickers, setTickers] = useState([])
  const [symbol, setSymbol] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    const data = await api.getTickers()
    setTickers(data)
  }, [])

  useEffect(() => { load() }, [load])

  const addTicker = async () => {
    if (!symbol.trim()) return
    setAdding(true)
    setError('')
    try {
      await api.addTicker({ symbol: symbol.trim().toUpperCase() })
      setSymbol('')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setAdding(false)
    }
  }

  const removeTicker = async (sym) => {
    await api.removeTicker(sym)
    await load()
  }

  const refreshTicker = async (sym) => {
    await api.getIndicators(sym)
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Watchlist</h1>
        {/* Add ticker */}
        <div className="flex items-center gap-2">
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && addTicker()}
            placeholder="AAPL"
            className="bg-panel border border-border rounded-lg px-3 py-1.5 text-sm mono w-28 focus:outline-none focus:border-accent"
          />
          <button
            onClick={addTicker}
            disabled={adding}
            className="flex items-center gap-1.5 bg-accent/10 text-accent border border-accent/20 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50"
          >
            <Plus size={14} />
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {error && (
        <div className="badge-red px-3 py-2 rounded-lg text-sm">{error}</div>
      )}

      {tickers.length === 0 ? (
        <div className="card text-center py-16 text-muted">
          <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
          <p>No tickers yet. Add one above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tickers.map(t => (
            <TickerCard
              key={t.symbol}
              ticker={t}
              onRemove={removeTicker}
              onRefresh={refreshTicker}
            />
          ))}
        </div>
      )}
    </div>
  )
}
