'use client'
import Link from 'next/link'

interface Props {
  manager: { name: string; slug: string }
  budget: number
  salary: number
  cap_space: number
  injured_count: number
  dropped_count: number
  ht_eligible_count: number
}

export default function TeamCard({ manager, budget, salary, cap_space, injured_count, dropped_count, ht_eligible_count }: Props) {
  const capPct = budget > 0 ? Math.min((salary / budget) * 100, 100) : 0
  const capColor = cap_space <= 0 ? '#dc2626' : cap_space <= 5 ? '#d97706' : '#15803d'
  const barColor = cap_space <= 0 ? '#dc2626' : cap_space <= 5 ? '#d97706' : '#1d4ed8'

  return (
    <Link href={`/team/${manager.slug}`} style={{ textDecoration: 'none' }}>
      <div className="card team-card" style={{ padding: '16px 18px', transition: 'box-shadow 0.15s, border-color 0.15s', cursor: 'pointer' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 14 }}>
          {manager.name}
        </div>

        {/* Three hero numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Budget', value: `$${budget}`, color: '#111827' },
            { label: 'Salary', value: `$${salary}`, color: '#374151' },
            { label: 'Cap Space', value: `$${cap_space}`, color: capColor },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '7px 4px', background: '#f4f5f7', borderRadius: 6, border: '1px solid #e2e6eb' }}>
              <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Cap usage bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ height: 4, background: '#e2e6eb', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${capPct}%`, background: barColor, borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Secondary stats */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'IL', value: injured_count, color: '#d97706' },
            { label: 'Drops', value: dropped_count, color: '#dc2626' },
            { label: 'HT-Elig', value: ht_eligible_count, color: '#15803d' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f4f5f7', border: '1px solid #e2e6eb', borderRadius: 4, padding: '2px 7px' }}>
              <span style={{ fontSize: '0.6rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
