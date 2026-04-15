'use client'
import { useState } from 'react'
import PlayerRow from './PlayerRow'
import { getKeeperPrice, getTierForYear, SERVICE_TIERS, getServiceYearColor } from '@/lib/constants'

interface Player {
  player_name: string; service_year: number; salary: number
  slot_type: string; is_franchise_player: boolean; dead_money?: number | null
}
type SortKey = 'salary' | 'service_year' | 'name' | 'keeper'

interface Props {
  title: string; players: Player[]; accentColor?: string
  defaultOpen?: boolean; onPlayerClick?: (name: string) => void; showSort?: boolean
}

export default function RosterSection({ title, players, accentColor = '#1a56db', defaultOpen = true, onPlayerClick, showSort = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [sortKey, setSortKey] = useState<SortKey>('salary')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  if (players.length === 0) return null

  const isDroppedSection = players.length > 0 && players[0].slot_type === 'dropped'
  const totalSalary = players.reduce((acc, p) =>
    acc + (p.slot_type === 'dropped' ? (p.dead_money ?? Math.ceil(p.salary/2)) : p.salary), 0)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc') }
  }

  const sorted = [...players].sort((a, b) => {
    let av: number|string, bv: number|string
    if (sortKey === 'salary') { av=a.salary; bv=b.salary }
    else if (sortKey === 'service_year') { av=a.service_year; bv=b.service_year }
    else if (sortKey === 'keeper') { av=getKeeperPrice(a.salary); bv=getKeeperPrice(b.salary) }
    else { av=a.player_name.toLowerCase(); bv=b.player_name.toLowerCase() }
    if (av < bv) return sortDir==='asc' ? -1 : 1
    if (av > bv) return sortDir==='asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? null : <span style={{ marginLeft: 2, fontSize: '0.55rem', color: accentColor }}>{sortDir==='asc'?'▲':'▼'}</span>

  // Build rows with tier-break dividers
  const rows: Array<{type:'player';player:Player} | {type:'divider';label:string}> = []
  let lastTier = ''
  for (const p of sorted) {
    const tier = isDroppedSection ? '' : getTierForYear(p.service_year).label
    if (!isDroppedSection && tier !== lastTier && rows.length > 0) {
      rows.push({ type:'divider', label: tier })
      lastTier = tier
    } else if (!isDroppedSection && rows.length === 0) {
      lastTier = tier
    }
    rows.push({ type:'player', player: p })
  }

  return (
    <div>
      <button className="section-btn" onClick={() => setOpen(o => !o)}>
        <span style={{ width: 4, height: 12, background: accentColor, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b7280', flex: 1 }}>
          {title}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginRight: 6 }}>
          {players.length} · ${totalSalary}
        </span>
        <span style={{ color: '#9ca3af', fontSize: '0.6rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <table className="roster-table">
          <thead>
            <tr>
              <th style={{ width: 5, padding: 0 }} />
              <th className={showSort ? 'sortable' : ''} onClick={showSort ? () => handleSort('name') : undefined}>
                Player <SortIcon k="name" />
              </th>
              <th className={showSort ? 'sortable' : ''} style={{ textAlign: 'center', width: 36 }} onClick={showSort ? () => handleSort('service_year') : undefined}>
                Yr <SortIcon k="service_year" />
              </th>
              <th className={showSort ? 'sortable' : ''} style={{ textAlign: 'right', width: 48 }} onClick={showSort ? () => handleSort('salary') : undefined}>
                Salary <SortIcon k="salary" />
              </th>
              <th className={showSort ? 'sortable' : ''} style={{ textAlign: 'right', width: 52 }} onClick={showSort ? () => handleSort('keeper') : undefined}>
                {isDroppedSection ? 'Dead $' : 'KP'} <SortIcon k="keeper" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              if (row.type === 'divider') {
                const tierColor = getServiceYearColor(sorted.find(p => getTierForYear(p.service_year).label === row.label)?.service_year ?? 0)
                return (
                  <tr key={`div-${i}`}>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div className="tier-divider" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: tierColor, border: '1px solid rgba(0,0,0,0.1)', display: 'inline-block' }} />
                        {row.label}
                      </div>
                    </td>
                  </tr>
                )
              }
              const p = row.player
              return (
                <PlayerRow
                  key={`${p.player_name}-${i}`}
                  name={p.player_name} serviceYear={p.service_year} salary={p.salary}
                  slotType={p.slot_type as 'MLB'|'MiLB'|'IL'|'dropped'}
                  isFranchisePlayer={p.is_franchise_player} deadMoney={p.dead_money}
                  onClick={onPlayerClick ? () => onPlayerClick(p.player_name) : undefined}
                />
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
