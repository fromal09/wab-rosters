'use client'
import { useState } from 'react'
import PlayerRow from './PlayerRow'
import { getKeeperPrice } from '@/lib/constants'

interface Player {
  player_name: string
  service_year: number
  salary: number
  slot_type: string
  is_franchise_player: boolean
  dead_money?: number | null
}

type SortKey = 'salary' | 'service_year' | 'name' | 'keeper'

interface Props {
  title: string
  players: Player[]
  accentColor?: string
  defaultOpen?: boolean
  onPlayerClick?: (name: string) => void
  showSort?: boolean
}

export default function RosterSection({ title, players, accentColor = '#1d4ed8', defaultOpen = true, onPlayerClick, showSort = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [sortKey, setSortKey] = useState<SortKey>('salary')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  if (players.length === 0) return null

  const totalSalary = players.reduce((acc, p) => {
    if (p.slot_type === 'dropped') return acc + (p.dead_money ?? Math.ceil(p.salary / 2))
    return acc + p.salary
  }, 0)

  function handleSort(key: SortKey) {
    if (sortKey === key) setDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc') }
  }
  function setDir(fn: (d: 'asc' | 'desc') => 'asc' | 'desc') {
    setSortDir(d => fn(d))
  }

  const sorted = [...players].sort((a, b) => {
    let av: number | string, bv: number | string
    if (sortKey === 'salary') { av = a.salary; bv = b.salary }
    else if (sortKey === 'service_year') { av = a.service_year; bv = b.service_year }
    else if (sortKey === 'keeper') { av = getKeeperPrice(a.salary); bv = getKeeperPrice(b.salary) }
    else { av = a.player_name.toLowerCase(); bv = b.player_name.toLowerCase() }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const isDroppedSection = players.length > 0 && players[0].slot_type === 'dropped'

  const SortIcon = ({ k }: { k: SortKey }) => sortKey !== k ? null : (
    <span style={{ marginLeft: 3, fontSize: '0.6rem', color: accentColor }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
  )

  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', width: '100%',
        padding: '5px 10px', background: '#f8f9fb',
        border: 'none', borderTop: '1px solid #e2e6eb',
        cursor: 'pointer', gap: 6, textAlign: 'left',
      }}>
        <span style={{ width: 3, height: 12, background: accentColor, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', flex: 1 }}>
          {title}
        </span>
        <span style={{ fontSize: '0.67rem', color: '#9ca3af', marginRight: 6 }}>
          {players.length} · ${totalSalary}
        </span>
        <span style={{ color: '#9ca3af', fontSize: '0.65rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <table className="roster-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: 3, padding: 0 }} />
              <th className={showSort ? 'sortable' : ''} onClick={showSort ? () => handleSort('name') : undefined}>
                Player <SortIcon k="name" />
              </th>
              <th className={showSort ? 'sortable' : ''} style={{ textAlign: 'center', width: 38 }} onClick={showSort ? () => handleSort('service_year') : undefined}>
                Svc Yr <SortIcon k="service_year" />
              </th>
              <th className={showSort ? 'sortable' : ''} style={{ textAlign: 'right', width: 52 }} onClick={showSort ? () => handleSort('salary') : undefined}>
                Salary <SortIcon k="salary" />
              </th>
              <th className={showSort ? 'sortable' : ''} style={{ textAlign: 'right', width: 56 }} onClick={showSort ? () => handleSort('keeper') : undefined}>
                {isDroppedSection ? 'Dead $' : 'KP'} <SortIcon k="keeper" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <PlayerRow
                key={`${p.player_name}-${i}`}
                name={p.player_name}
                serviceYear={p.service_year}
                salary={p.salary}
                slotType={p.slot_type as 'MLB' | 'MiLB' | 'IL' | 'dropped'}
                isFranchisePlayer={p.is_franchise_player}
                deadMoney={p.dead_money}
                onClick={onPlayerClick ? () => onPlayerClick(p.player_name) : undefined}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
