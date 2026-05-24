/**
 * RuleBuilder — visual if/and/or block editor
 *
 * Rule tree shape:
 *   Group: { op: "AND"|"OR", conditions: [Condition | Group, ...] }
 *   Condition: { indicator: string, operator: string, value: number }
 */
import { useState } from 'react'
import { Plus, Trash2, ChevronDown } from 'lucide-react'

const OPERATORS = [
  { value: '<',            label: '<  less than' },
  { value: '>',            label: '>  greater than' },
  { value: '<=',           label: '≤  less than or equal' },
  { value: '>=',           label: '≥  greater than or equal' },
  { value: '==',           label: '=  equals' },
  { value: 'crosses_above', label: '↑  crosses above' },
  { value: 'crosses_below', label: '↓  crosses below' },
]

const DEFAULT_INDICATORS = [
  'price','open','high','low','volume','volume_ratio',
  'rsi','macd','macd_signal','macd_hist',
  'sma_20','sma_50','sma_200','ema_12','ema_26',
  'bb_upper','bb_mid','bb_lower',
  'mmbm_sweep','mmbm_mss','mmbm_signal',
  'mmsm_sweep','mmsm_mss','mmsm_signal',
  'sks_ratio','sks_signal',
]

function Select({ value, onChange, options, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-surface border border-border rounded-lg px-3 py-1.5 text-sm pr-7 focus:outline-none focus:border-accent"
      >
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
    </div>
  )
}

function ConditionRow({ condition, onChange, onDelete, indicatorMeta }) {
  const indLabels = Object.entries(indicatorMeta || {})
    .filter(([, v]) => v !== null && typeof v === 'object')
    .map(([k, v]) => ({ value: k, label: v.label || k }))
  // Fall back to defaults if meta not loaded
  const indOptions = indLabels.length > 0
    ? indLabels
    : DEFAULT_INDICATORS.map(k => ({ value: k, label: k }))

  return (
    <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
      <Select
        value={condition.indicator}
        onChange={v => onChange({ ...condition, indicator: v })}
        options={indOptions}
        className="flex-1 min-w-0"
      />
      <Select
        value={condition.operator}
        onChange={v => onChange({ ...condition, operator: v })}
        options={OPERATORS}
        className="w-44"
      />
      <input
        type="number"
        step="any"
        value={condition.value}
        onChange={e => onChange({ ...condition, value: parseFloat(e.target.value) || 0 })}
        className="w-24 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mono focus:outline-none focus:border-accent"
      />
      <button onClick={onDelete} className="text-muted hover:text-red-400 transition-colors p-1">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function GroupBlock({ group, onChange, onDelete, depth = 0, indicatorMeta }) {
  const isRoot = depth === 0

  const addCondition = () => {
    onChange({
      ...group,
      conditions: [
        ...group.conditions,
        { indicator: 'rsi', operator: '<', value: 30 },
      ],
    })
  }

  const addGroup = () => {
    onChange({
      ...group,
      conditions: [
        ...group.conditions,
        { op: 'AND', conditions: [] },
      ],
    })
  }

  const updateChild = (idx, updated) => {
    const next = [...group.conditions]
    next[idx] = updated
    onChange({ ...group, conditions: next })
  }

  const deleteChild = (idx) => {
    const next = group.conditions.filter((_, i) => i !== idx)
    onChange({ ...group, conditions: next })
  }

  const borderColor = depth === 0
    ? 'border-accent/30'
    : depth === 1
    ? 'border-purple-500/30'
    : 'border-yellow-500/30'

  return (
    <div className={`border ${borderColor} rounded-xl p-3 space-y-2`}>
      {/* Group header */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-medium uppercase tracking-wider">
          {isRoot ? 'If' : 'Group'}
        </span>
        <div className="flex rounded-lg overflow-hidden border border-border text-xs">
          {['AND', 'OR'].map(op => (
            <button
              key={op}
              onClick={() => onChange({ ...group, op })}
              className={`px-3 py-1 font-medium transition-colors ${
                group.op === op
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">all of the following are true</span>
        {!isRoot && (
          <button onClick={onDelete} className="ml-auto text-muted hover:text-red-400 p-1">
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Children */}
      <div className="space-y-2 pl-2">
        {group.conditions.length === 0 && (
          <p className="text-xs text-muted py-2 text-center">No conditions yet — add one below</p>
        )}
        {group.conditions.map((child, i) =>
          child.op !== undefined ? (
            <GroupBlock
              key={i}
              group={child}
              onChange={updated => updateChild(i, updated)}
              onDelete={() => deleteChild(i)}
              depth={depth + 1}
              indicatorMeta={indicatorMeta}
            />
          ) : (
            <ConditionRow
              key={i}
              condition={child}
              onChange={updated => updateChild(i, updated)}
              onDelete={() => deleteChild(i)}
              indicatorMeta={indicatorMeta}
            />
          )
        )}
      </div>

      {/* Add buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={addCondition}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-slate-200 hover:bg-white/5 px-2 py-1 rounded-lg transition-colors"
        >
          <Plus size={12} /> Add condition
        </button>
        <button
          onClick={addGroup}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-slate-200 hover:bg-white/5 px-2 py-1 rounded-lg transition-colors"
        >
          <Plus size={12} /> Add group
        </button>
      </div>
    </div>
  )
}

export default function RuleBuilder({ value, onChange, indicatorMeta }) {
  // value is a RuleGroup dict
  const tree = value || { op: 'AND', conditions: [] }

  return (
    <GroupBlock
      group={tree}
      onChange={onChange}
      onDelete={() => {}}
      depth={0}
      indicatorMeta={indicatorMeta}
    />
  )
}
