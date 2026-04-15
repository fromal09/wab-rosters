'use client'
import { useState } from 'react'
import PlayerRow from './PlayerRow'
import { getKeeperPrice } from '@/lib/constants'

interface Player {
  player_name: string; service_year: number; salary: number
  slot_type: string; is_franchise_player: boolean; dead_money?: number | null
}
type SortKey = 'salary' | 'service_year' | 'name' | 'keeper'

interface Props {
  title: string; players: Player[]; accentColor?: string; defaultOpen?: boolean
}

export default function RosterSection({ title, players, accentColor = '#1a56db', defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [sortKey, setSortKey] = useState<SortKey>('salary')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  if (players.length === 0) return null

  const isDropped = players[0].slot_type === 'dropped'
  const totalSalary = players.reduce((acc, p) =>
    acc + (p.slot_type === 'dropped' ? (p.dead_money ?? Math.ceil(p.salary/2)) : p.salary), 0)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc') }
  }

  const sorted = [...players].sort((a, b) => {
    let av: number|string, bv: number|string
    if (sortKey === 'salary')            { av = a.salary;                    bv = b.salary }
    else if (sortKey === 'service_year') { av = a.service_year;              bv = b.service_year }
    else if (sortKey === 'keeper')       { av = getKeeperPrice(a.salary);    bv = getKeeperPrice(b.salary) }
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
        <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginRight: 6 }}>{players.length} · ${totalSalary}</span>
        <span style={{ color: '#9ca3af', fontSize: '0.6rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <table className="roster-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: 5, padding: 0, background: '#f6f7f9', borderBottom: '1px solid #e4e7ec' }} />
              <th style={thStyle('left')} onClick={() => handleSort('name')}>Player <Arr k="name" /></th>
              <th style={thStyle('center', 44)} onClick={() => handleSort('service_year')}>Svc Yr <Arr k="service_year" /></th>
              <th style={thStyle('right', 54)} onClick={() => handleSort('salary')}>Salary <Arr k="salary" /></th>
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
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
