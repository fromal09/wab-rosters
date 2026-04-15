'use client'
import { useState } from 'react'
import PlayerRow from './PlayerRow'

interface Player {
  player_name: string
  service_year: number
  salary: number
  slot_type: string
  is_franchise_player: boolean
  dead_money?: number | null
}

interface Props {
  title: string
  players: Player[]
  accentColor?: string
  defaultOpen?: boolean
  onPlayerClick?: (name: string) => void
}

export default function RosterSection({
  title,
  players,
  accentColor = '#4f7ef0',
  defaultOpen = true,
  onPlayerClick,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  if (players.length === 0) return null

  const totalSalary = players.reduce((acc, p) => {
    if (p.slot_type === 'dropped') return acc + (p.dead_money ?? Math.ceil(p.salary / 2))
    return acc + p.salary
  }, 0)

  return (
    <div style={{ marginBottom: 0 }}>
      {/* Section header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '7px 12px',
          background: '#1a1d2a',
          border: 'none',
          borderTop: `1px solid var(--border)`,
          cursor: 'pointer',
          gap: 8,
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 3,
            height: 14,
            background: accentColor,
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', flex: 1 }}>
          {title}
        </span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginRight: 8 }}>
          {players.length} · ${totalSalary}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <table className="roster-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: 4, padding: 0 }} />
              <th>Player</th>
              <th style={{ textAlign: 'center' }}>Yr</th>
              <th style={{ textAlign: 'right' }}>{title === 'Dropped' ? 'Dead $' : 'Salary'}</th>
              <th style={{ textAlign: 'right' }}>{title === 'Dropped' ? '' : 'Keeper'}</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
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
