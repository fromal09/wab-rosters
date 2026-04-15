'use client'
import { useState, useEffect } from 'react'
import TeamCard from '@/components/TeamCard'
import PlayerModal from '@/components/PlayerModal'
import RosterSection from '@/components/RosterSection'
import { getServiceYearColor, CURRENT_YEAR } from '@/lib/constants'

type View = 'cards' | 'rosters'

interface TeamSummary {
  manager: { id: string; name: string; slug: string }
  budget: number; salary: number; cap_space: number
  injured_count: number; dropped_count: number; ht_eligible_count: number
}

interface Player {
  player_name: string; service_year: number; salary: number
  slot_type: string; is_franchise_player: boolean; dead_money?: number | null
}

interface TeamRoster {
  slug: string
  roster: Player[]
  loading: boolean
}

export default function LeagueClient({ teams, year }: { teams: TeamSummary[]; year: number }) {
  const [view, setView] = useState<View>('cards')
  const [rosters, setRosters] = useState<Record<string, TeamRoster>>({})
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  useEffect(() => {
    if (view !== 'rosters') return
    teams.forEach(t => {
      if (rosters[t.manager.slug]) return
      setRosters(r => ({ ...r, [t.manager.slug]: { slug: t.manager.slug, roster: [], loading: true } }))
      fetch(`/api/team/${t.manager.slug}?year=${year}`)
        .then(r => r.json())
        .then(d => setRosters(r => ({ ...r, [t.manager.slug]: { slug: t.manager.slug, roster: d.roster ?? [], loading: false } })))
    })
  }, [view, teams, year, rosters])

  const totalSalary = teams.reduce((a, t) => a + t.salary, 0)
  const avgCap = Math.round(teams.reduce((a, t) => a + t.cap_space, 0) / teams.length)

  return (
    <>
      <PlayerModal playerName={selectedPlayer} onClose={() => setSelectedPlayer(null)} />

      {/* Page header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            {year} WAB Rosters
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.84rem' }}>
            Westminster Auction Baseball · 10 teams
          </p>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e6eb', borderRadius: 7, padding: 3, gap: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {(['cards', 'rosters'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 14px', borderRadius: 5, border: 'none',
              background: view === v ? '#1d4ed8' : 'transparent',
              color: view === v ? '#fff' : '#6b7280',
              cursor: 'pointer', fontWeight: view === v ? 700 : 500,
              fontSize: '0.8rem', transition: 'all 0.15s', textTransform: 'capitalize',
            }}>
              {v === 'cards' ? '⊞ Cards' : '☰ Rosters'}
            </button>
          ))}
        </div>
      </div>

      {/* League stats bar */}
      <div style={{
        display: 'flex', gap: 20, marginBottom: 24, padding: '12px 20px',
        background: '#fff', border: '1px solid #e2e6eb', borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexWrap: 'wrap',
      }}>
        {[
          { label: 'Season', value: String(year) },
          { label: 'Teams', value: '10' },
          { label: 'League Salary', value: `$${totalSalary.toLocaleString()}` },
          { label: 'Avg Cap Space', value: `$${avgCap}` },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* CARDS VIEW */}
      {view === 'cards' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {teams.map(t => <TeamCard key={t.manager.id} {...t} />)}
          </div>
          {/* Legend */}
          <div style={{ marginTop: 28, padding: '12px 16px', background: '#fff', border: '1px solid #e2e6eb', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 8 }}>
              Service Year Legend
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(yr => (
                <div key={yr} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '1.35rem', height: '1.35rem', borderRadius: 4,
                    background: getServiceYearColor(yr), color: '#1f2937',
                    fontSize: '0.63rem', fontWeight: 700, border: '1px solid rgba(0,0,0,0.1)',
                  }}>{yr}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, borderLeft: '1px solid #e2e6eb', paddingLeft: 8 }}>
                <span style={{ fontSize: '0.65rem', color: '#1d4ed8' }}>★</span>
                <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontStyle: 'italic' }}>Franchise player</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ROSTERS VIEW */}
      {view === 'rosters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {teams.map(t => {
            const rdata = rosters[t.manager.slug]
            const mlb = rdata?.roster.filter(p => p.slot_type === 'MLB') ?? []
            const milb = rdata?.roster.filter(p => p.slot_type === 'MiLB') ?? []
            const il = rdata?.roster.filter(p => p.slot_type === 'IL') ?? []
            const dropped = rdata?.roster.filter(p => p.slot_type === 'dropped') ?? []
            const capColor = t.cap_space <= 0 ? '#dc2626' : t.cap_space <= 5 ? '#d97706' : '#15803d'

            return (
              <div key={t.manager.slug} className="card" style={{ overflow: 'hidden' }}>
                {/* Team header */}
                <div style={{ padding: '12px 16px', background: '#fafbfc', borderBottom: '1px solid #e2e6eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <a href={`/team/${t.manager.slug}`} style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', textDecoration: 'none', letterSpacing: '-0.01em' }}>
                    {t.manager.name}
                  </a>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Budget', value: `$${t.budget}`, color: '#111827' },
                      { label: 'Salary', value: `$${t.salary}`, color: '#374151' },
                      { label: 'Cap', value: `$${t.cap_space}`, color: capColor },
                      { label: 'IL', value: t.injured_count, color: '#d97706' },
                      { label: 'Drops', value: t.dropped_count, color: '#dc2626' },
                    ].map(s => (
                      <div key={s.label} style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                        <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', fontWeight: 600 }}>{s.label}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: s.color, letterSpacing: '-0.01em' }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {rdata?.loading && (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.83rem' }}>Loading…</div>
                )}

                {!rdata?.loading && rdata && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 0 }}>
                    {/* MLB */}
                    <div style={{ borderRight: '1px solid #f0f2f5' }}>
                      <RosterSection title={`MLB (${mlb.length})`} players={mlb} accentColor="#15803d" defaultOpen onPlayerClick={setSelectedPlayer} />
                    </div>
                    {/* MiLB + IL */}
                    <div style={{ borderRight: '1px solid #f0f2f5' }}>
                      <RosterSection title={`MiLB (${milb.length})`} players={milb} accentColor="#1d4ed8" defaultOpen onPlayerClick={setSelectedPlayer} />
                      <RosterSection title={`IL (${il.length})`} players={il} accentColor="#d97706" defaultOpen onPlayerClick={setSelectedPlayer} />
                    </div>
                    {/* Dropped */}
                    <div>
                      <RosterSection title={`Dropped (${dropped.length})`} players={dropped} accentColor="#dc2626" defaultOpen={false} onPlayerClick={setSelectedPlayer} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
