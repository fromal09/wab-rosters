'use client'
import Link from 'next/link'

interface Props {
  manager: { name: string; slug: string }
  budget: number; salary: number; cap_space: number
  injured_count: number; dropped_count: number; ht_eligible_count: number
  keeper_slots?: number
  notes?: { id: string; note: string }[]
}

export default function TeamCard({ manager, budget, salary, cap_space, injured_count, dropped_count, ht_eligible_count, keeper_slots = 10, notes = [] }: Props) {
  const capPct = budget > 0 ? Math.min((salary / budget) * 100, 100) : 0
  const capColor = cap_space <= 0 ? '#b91c1c' : cap_space <= 5 ? '#b45309' : '#166534'
  const barColor = cap_space <= 0 ? '#dc2626' : cap_space <= 5 ? '#d97706' : '#1a56db'
  const slotColor = keeper_slots <= 2 ? '#b91c1c' : keeper_slots <= 5 ? '#b45309' : '#1a56db'

  return (
    <Link href={`/team/${manager.slug}`} style={{ textDecoration: 'none' }}>
      <div className="card team-card" style={{ padding: '12px 14px', transition: 'box-shadow 0.15s, border-color 0.15s', cursor: 'pointer' }}>
        {/* Manager name */}
        <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#0f1117', marginBottom: 9 }}>
          {manager.name}
        </div>

        {/* 4 primary numbers — equal sizing */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 5, marginBottom: 9 }}>
          {[
            { label: 'Budget',  value: `$${budget}`,       color: '#0f1117' },
            { label: 'Salary',  value: `$${salary}`,       color: '#374151' },
            { label: 'Cap',     value: `$${cap_space}`,    color: capColor  },
            { label: 'Slots',   value: String(keeper_slots), color: slotColor },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '5px 2px', background: '#f6f7f9', borderRadius: 5, border: '1px solid #e4e7ec' }}>
              <div style={{ fontSize: '0.54rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', fontWeight: 600, marginBottom: 1 }}>{s.label}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Cap bar */}
        <div style={{ height: 3, background: '#e4e7ec', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${capPct}%`, background: barColor, borderRadius: 2 }} />
        </div>

        {/* Secondary stats */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[
            { label: 'IL',    value: injured_count,     color: '#b45309' },
            { label: 'Drops', value: dropped_count,     color: '#b91c1c' },
            { label: 'HT',    value: ht_eligible_count, color: '#166534' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#f6f7f9', border: '1px solid #e4e7ec', borderRadius: 4, padding: '2px 6px' }}>
              <span style={{ fontSize: '0.57rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
          {notes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 4, padding: '2px 6px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.57rem', color: '#92400e', fontWeight: 700 }}>📝 {notes.length}</span>
            </div>
          )}
        </div>

        {/* Notes preview */}
        {notes.length > 0 && (
          <div style={{ marginTop: 7, paddingTop: 7, borderTop: '1px solid #f0f2f5' }}>
            {notes.map(n => (
              <div key={n.id} style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.4, marginBottom: 2 }}>
                {n.note}
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
