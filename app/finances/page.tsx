'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TeamFinances {
  id: string; name: string; slug: string
  budget: number; activeSalary: number; deadCap: number; capSpace: number
  activePct: number; deadPct: number; spacePct: number
}
interface LeagueFinances {
  budget: number; activeSalary: number; deadCap: number; capSpace: number
  activePct: number; deadPct: number; spacePct: number
}

function pctColor(pct: number, type: 'active' | 'dead' | 'space') {
  if (type === 'space') return pct >= 15 ? '#166534' : pct >= 5 ? '#854d0e' : '#b91c1c'
  if (type === 'dead')  return pct >= 20 ? '#b91c1c' : pct >= 10 ? '#854d0e' : '#6b7280'
  return '#374151'
}

function Bar({ activePct, deadPct, spacePct }: { activePct: number; deadPct: number; spacePct: number }) {
  return (
    <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: '#f0f2f5', display: 'flex', width: '100%' }}>
      <div style={{ width: `${activePct}%`, background: '#1a56db', transition: 'width 0.5s ease' }} />
      <div style={{ width: `${deadPct}%`,   background: '#b91c1c', transition: 'width 0.5s ease' }} />
      <div style={{ width: `${Math.max(spacePct, 0)}%`, background: '#dcfce7', transition: 'width 0.5s ease' }} />
    </div>
  )
}

function Pill({ label, value, pct, type }: { label: string; value: string; pct: number; type: 'active' | 'dead' | 'space' }) {
  const color = pctColor(pct, type)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 90 }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color }}>
        {pct}% of budget
      </div>
    </div>
  )
}

function TeamRow({ t, rank }: { t: TeamFinances; rank: number }) {
  return (
    <Link href={`/team/${t.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff', border: '1px solid #e4e7ec', borderRadius: 10,
        padding: '16px 20px', cursor: 'pointer', transition: 'box-shadow 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        {/* Team name + budget */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', minWidth: 18 }}>#{rank}</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f1117' }}>{t.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Budget</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f1117' }}>${t.budget}</span>
          </div>
        </div>

        {/* Bar */}
        <div style={{ marginBottom: 14 }}>
          <Bar activePct={t.activePct} deadPct={t.deadPct} spacePct={t.spacePct} />
          <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#1a56db' }} />
              <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>Active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#b91c1c' }} />
              <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>Dead</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#dcfce7', border: '1px solid #bbf7d0' }} />
              <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>Cap Space</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Pill label="Active Salary" value={`$${t.activeSalary}`} pct={t.activePct} type="active" />
          <Pill label="Cap Space"     value={`$${t.capSpace}`}     pct={t.spacePct}  type="space" />
          <Pill label="Dead Cap"      value={`$${t.deadCap}`}      pct={t.deadPct}   type="dead" />
        </div>
      </div>
    </Link>
  )
}

export default function FinancesPage() {
  const [data, setData] = useState<{ teams: TeamFinances[]; league: LeagueFinances; year: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'name' | 'capSpace' | 'activeSalary' | 'deadCap' | 'budget'>('capSpace')

  useEffect(() => {
    fetch('/api/finances').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading…</div>
  if (!data) return null

  const sorted = [...data.teams].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'capSpace')     return b.capSpace     - a.capSpace
    if (sort === 'activeSalary') return b.activeSalary - a.activeSalary
    if (sort === 'deadCap')      return b.deadCap      - a.deadCap
    return b.budget - a.budget
  })

  const l = data.league

  const sortBtn = (key: typeof sort, label: string) => (
    <button onClick={() => setSort(key)} style={{
      padding: '4px 12px', borderRadius: 5, border: '1px solid',
      borderColor: sort === key ? '#1a56db' : '#e4e7ec',
      background: sort === key ? '#eff6ff' : '#fff',
      color: sort === key ? '#1a56db' : '#6b7280',
      fontSize: '0.75rem', fontWeight: sort === key ? 700 : 400, cursor: 'pointer',
    }}>{label}</button>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 18, fontSize: '0.8rem', color: '#9ca3af' }}>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>League</Link>
        <span style={{ margin: '0 6px', color: '#d1d5db' }}>›</span>
        <span style={{ color: '#374151', fontWeight: 500 }}>Finances</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f1117', letterSpacing: '-0.02em', margin: 0 }}>
            {data.year} League Finances
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Westminster Auction Baseball · 10 teams</p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginRight: 4 }}>Sort by</span>
          {sortBtn('capSpace', 'Cap Space')}
          {sortBtn('activeSalary', 'Active Salary')}
          {sortBtn('deadCap', 'Dead Cap')}
          {sortBtn('budget', 'Budget')}
          {sortBtn('name', 'Name')}
        </div>
      </div>

      {/* League summary card */}
      <div style={{ background: '#0f1117', borderRadius: 12, padding: '20px 24px', marginBottom: 24, color: '#fff' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9ca3af', marginBottom: 14 }}>
          League Total — {data.year}
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Total Budget',      value: `$${l.budget}`,       color: '#fff',    pct: null },
            { label: 'Active Salary',     value: `$${l.activeSalary}`, color: '#60a5fa', pct: l.activePct },
            { label: 'Cap Space',         value: `$${l.capSpace}`,     color: l.spacePct >= 10 ? '#4ade80' : '#fbbf24', pct: l.spacePct },
            { label: 'Dead Cap',          value: `$${l.deadCap}`,      color: '#f87171', pct: l.deadPct },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              {s.pct != null && <div style={{ fontSize: '0.7rem', color: s.color, marginTop: 2 }}>{s.pct}% of budget</div>}
            </div>
          ))}
        </div>
        {/* League bar */}
        <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', background: '#374151', display: 'flex' }}>
          <div style={{ width: `${l.activePct}%`, background: '#3b82f6' }} />
          <div style={{ width: `${l.deadPct}%`,   background: '#ef4444' }} />
          <div style={{ width: `${Math.max(l.spacePct, 0)}%`, background: '#22c55e', opacity: 0.7 }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {[['#3b82f6','Active'], ['#ef4444','Dead Cap'], ['#22c55e','Cap Space']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Team cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((t, i) => <TeamRow key={t.id} t={t} rank={i + 1} />)}
      </div>
    </div>
  )
}
