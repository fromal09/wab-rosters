'use client'
import { useState } from 'react'
import PlayerRow from './PlayerRow'
import { getKeeperPrice } from '@/lib/constants'

interface Player {
  player_name: string; service_year: number; salary: number
  slot_type: string; is_franchise_player: boolean
  dead_money?: number | null; position?: string | null
}
type SortKey = 'salary' | 'service_year' | 'name' | 'keeper' | 'position'

interface Props {
  title: string; players: Player[]; accentColor?: string
  defaultOpen?: boolean; showFilter?: boolean
}

// Full position filter set
const FILTERS = [
  { label: 'All',      fn: null },
  // Pitchers
  { label: 'SP',       fn: (p: string|null) => !!p && p.split(',').some(x => x.trim()==='SP') },
  { label: 'RP',       fn: (p: string|null) => !!p && p.split(',').some(x => x.trim()==='RP') },
  { label: 'Pitchers', fn: (p: string|null) => !!p && p.split(',').some(x => ['SP','RP','P'].includes(x.trim())) },
  // Catchers
  { label: 'C',        fn: (p: string|null) => !!p && p.split(',').some(x => x.trim()==='C') },
  // Infield
  { label: '1B',       fn: (p: string|null) => !!p && p.split(',').some(x => x.trim()==='1B') },
  { label: '2B',       fn: (p: string|null) => !!p && p.split(',').some(x => x.trim()==='2B') },
  { label: '3B',       fn: (p: string|null) => !!p && p.split(',').some(x => x.trim()==='3B') },
  { label: 'SS',       fn: (p: string|null) => !!p && p.split(',').some(x => x.trim()==='SS') },
  { label: 'MI',       fn: (p: string|null) => !!p && p.split(',').some(x => ['2B','SS'].includes(x.trim())) },
  { label: 'CI',       fn: (p: string|null) => !!p && p.split(',').some(x => ['1B','3B'].includes(x.trim())) },
  // Outfield
  { label: 'LF',       fn: (p: string|null) => !!p && p.split(',').some(x => x.trim()==='LF') },
  { label: 'CF',       fn: (p: string|null) => !!p && p.split(',').some(x => x.trim()==='CF') },
  { label: 'RF',       fn: (p: string|null) => !!p && p.split(',').some(x => x.trim()==='RF') },
  { label: 'OF',       fn: (p: string|null) => !!p && p.split(',').some(x => ['LF','CF','RF','OF'].includes(x.trim())) },
  // Other
  { label: 'DH',       fn: (p: string|null) => !!p && p.split(',').some(x => x.trim()==='DH') },
  { label: 'Hitters',  fn: (p: string|null) => !!p && p.split(',').some(x => ['C','1B','2B','3B','SS','LF','CF','RF','OF','DH'].includes(x.trim())) },
]

export default function RosterSection({ title, players, accentColor = '#1a56db', defaultOpen = true, showFilter = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [sortKey, setSortKey] = useState<SortKey>('salary')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [activeFilter, setActiveFilter] = useState('All')

  if (players.length === 0) return null

  const isDropped = players[0].slot_type === 'dropped'
  const totalSalary = players.reduce((acc, p) =>
    acc + (p.slot_type === 'dropped' ? (p.dead_money ?? Math.ceil(p.salary/2)) : p.salary), 0)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'name' || key === 'position' ? 'asc' : 'desc') }
  }

  const filterFn = FILTERS.find(f => f.label === activeFilter)?.fn ?? null
  const filtered = filterFn ? players.filter(p => filterFn(p.position ?? null)) : players

  const sorted = [...filtered].sort((a, b) => {
    let av: number|string, bv: number|string
    if (sortKey === 'salary')            { av = a.salary;                    bv = b.salary }
    else if (sortKey === 'service_year') { av = a.service_year;              bv = b.service_year }
    else if (sortKey === 'keeper')       { av = getKeeperPrice(a.salary);    bv = getKeeperPrice(b.salary) }
    else if (sortKey === 'position')     { av = (a.position ?? 'zzz').toLowerCase(); bv = (b.position ?? 'zzz').toLowerCase() }
    else                                 { av = a.player_name.toLowerCase(); bv = b.player_name.toLowerCase() }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const Arr = ({ k }: { k: SortKey }) =>
    sortKey !== k
      ? <span style={{ color: '#d1d5db', fontSize: '0.55rem' }}>⇅</span>
      : <span style={{ color: accentColor, fontSize: '0.55rem' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>

  const thStyle = (align: 'left'|'right'|'center' = 'left', w?: number): React.CSSProperties => ({
    padding: '5px 8px', textAlign: align, fontSize: '0.62rem', textTransform: 'uppercase',
    letterSpacing: '0.06em', color: '#9ca3af', fontWeight: 600,
    borderBottom: '1px solid #e4e7ec', background: '#f6f7f9',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    ...(w ? { width: w } : {}),
  })

  return (
    <div>
      <button className="section-btn" onClick={() => setOpen(o => !o)}>
        <span style={{ width: 4, height: 12, background: accentColor, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b7280', flex: 1 }}>
          {title}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginRight: 6 }}>
          {filtered.length !== players.length ? `${filtered.length}/${players.length}` : players.length} · ${totalSalary}
        </span>
        <span style={{ color: '#9ca3af', fontSize: '0.6rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Position filter pills — only on non-dropped sections when showFilter=true */}
      {open && showFilter && !isDropped && (
        <div style={{ display: 'flex', gap: 3, padding: '6px 10px', background: '#f6f7f9', borderBottom: '1px solid #e4e7ec', flexWrap: 'wrap', alignItems: 'center' }}>
          {FILTERS.map((f, i) => {
            const count = f.fn ? players.filter(p => f.fn!(p.position ?? null)).length : players.length
            const active = activeFilter === f.label
            // Add visual separator before groups
            const sep = [1, 3, 4, 9, 11, 15, 16].includes(i)
            return (
              <span key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {sep && <span style={{ width: 1, height: 12, background: '#d1d5db', margin: '0 2px' }} />}
                <button onClick={() => setActiveFilter(f.label)} style={{
                  padding: '2px 7px', borderRadius: 4, border: '1px solid',
                  borderColor: active ? accentColor : '#e4e7ec',
                  background: active ? accentColor : '#fff',
                  color: active ? '#fff' : '#6b7280',
                  fontSize: '0.62rem', fontWeight: active ? 700 : 500,
                  cursor: 'pointer', lineHeight: '1.6', whiteSpace: 'nowrap',
                }}>
                  {f.label}{!active && count > 0 && <span style={{ color: active ? '#fff' : '#9ca3af', marginLeft: 2 }}>({count})</span>}
                </button>
              </span>
            )
          })}
        </div>
      )}

      {open && (
        <table className="roster-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: 5, padding: 0, background: '#f6f7f9', borderBottom: '1px solid #e4e7ec' }} />
              <th style={thStyle('left')} onClick={() => handleSort('name')}>Player <Arr k="name" /></th>
              <th style={thStyle('center', 64)} onClick={() => handleSort('position')}>Pos <Arr k="position" /></th>
              <th style={thStyle('center', 36)} onClick={() => handleSort('service_year')}>Yr <Arr k="service_year" /></th>
              <th style={thStyle('right', 52)} onClick={() => handleSort('salary')}>Salary <Arr k="salary" /></th>
              <th style={thStyle('right', 60)} onClick={() => handleSort('keeper')}>
                {isDropped ? 'Dead $' : 'Keeper $'} <Arr k="keeper" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <PlayerRow
                key={`${p.player_name}-${i}`}
                name={p.player_name} serviceYear={p.service_year} salary={p.salary}
                slotType={p.slot_type as 'MLB'|'MiLB'|'IL'|'dropped'}
                isFranchisePlayer={p.is_franchise_player} deadMoney={p.dead_money}
                position={p.position}
              />
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '12px 10px', textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>No players match this filter.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
