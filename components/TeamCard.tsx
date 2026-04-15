'use client'
import Link from 'next/link'

interface Props {
  manager: { name: string; slug: string }
  budget: number; salary: number; cap_space: number
  injured_count: number; dropped_count: number; ht_eligible_count: number
  keeper_slots?: number
}

export default function TeamCard({ manager, budget, salary, cap_space, injured_count, dropped_count, ht_eligible_count, keeper_slots = 10 }: Props) {
  const capPct = budget > 0 ? Math.min((salary / budget) * 100, 100) : 0
  const capColor = cap_space <= 0 ? '#b91c1c' : cap_space <= 5 ? '#b45309' : '#166534'
  const barColor = cap_space <= 0 ? '#dc2626' : cap_space <= 5 ? '#d97706' : '#1a56db'

  return (
    <Link href={`/team/${manager.slug}`} style={{ textDecoration: 'none' }}>
      <div className="card team-card" style={{ padding: '13px 15px', transition: 'box-shadow 0.15s, border-color 0.15s', cursor: 'pointer' }}>
        {/* Manager name */}
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f1117', marginBottom: 10 }}>
          {manager.name}
        </div>

        {/* 3 hero numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
          {[
            { label: 'Budget',    value: `$${budget}`,    color: '#0f1117' },
            { label: 'Salary',    value: `$${salary}`,    color: '#374151' },
            { label: 'Cap',       value: `$${cap_space}`, color: capColor  },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '5px 3px', background: '#f6f7f9', borderRadius: 5, border: '1px solid #e4e7ec' }}>
              <div style={{ fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', fontWeight: 600, marginBottom: 1 }}>{s.label}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Cap bar */}
        <div style={{ height: 3, background: '#e4e7ec', borderRadius: 2, overflow: 'hidden', marginBottom: 9 }}>
          <div style={{ height: '100%', width: `${capPct}%`, background: barColor, borderRadius: 2 }} />
        </div>

        {/* Secondary stats */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[
            { label: 'IL',      value: injured_count,    color: '#b45309' },
            { label: 'Drops',   value: dropped_count,    color: '#b91c1c' },
            { label: 'HT',      value: ht_eligible_count,color: '#166534' },
            { label: 'KSlots',  value: keeper_slots,     color: keeper_slots === 0 ? '#b91c1c' : '#1a56db' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#f6f7f9', border: '1px solid #e4e7ec', borderRadius: 4, padding: '2px 6px' }}>
              <span style={{ fontSize: '0.58rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
