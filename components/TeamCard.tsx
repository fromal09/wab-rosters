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

export default function TeamCard({
  manager,
  budget,
  salary,
  cap_space,
  injured_count,
  dropped_count,
  ht_eligible_count,
}: Props) {
  const capPct = budget > 0 ? Math.min((salary / budget) * 100, 100) : 0
  const capColor = cap_space <= 0 ? '#f0614f' : cap_space <= 5 ? '#f0c040' : '#3ecf8e'

  return (
    <Link href={`/team/${manager.slug}`} style={{ textDecoration: 'none' }}>
      <div className="card team-card" style={{ padding: '16px 18px', transition: 'border-color 0.15s, background 0.15s', cursor: 'pointer' }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {manager.name}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Salary / Budget
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: capColor }}>
              ${cap_space} left
            </span>
          </div>
          <div style={{ height: 5, background: '#2e3347', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${capPct}%`, background: cap_space <= 0 ? '#f0614f' : cap_space <= 5 ? '#f0c040' : '#4f7ef0', borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>${salary} salary</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>${budget} budget</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'IL', value: injured_count, color: '#f0c040' },
            { label: 'Drops', value: dropped_count, color: '#f0614f' },
            { label: 'HT-Elig', value: ht_eligible_count, color: '#3ecf8e' },
          ].map(s => (
            <div key={s.label} style={{ background: '#13161f', border: '1px solid #2e3347', borderRadius: 5, padding: '3px 8px', display: 'flex', gap: 5, alignItems: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
