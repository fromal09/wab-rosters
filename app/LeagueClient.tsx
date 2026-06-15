'use client'
import { useState, useEffect } from 'react'
import TeamCard from '@/components/TeamCard'
import RosterSection from '@/components/RosterSection'
import PlayerCard from '@/components/PlayerCard'
import { SVC_COLORS, CURRENT_YEAR } from '@/lib/constants'

type View = 'cards' | 'rosters' | 'finances'

interface TeamSummary {
  manager: { id: string; name: string; slug: string }
  budget: number; salary: number; cap_space: number
  injured_count: number; dropped_count: number; ht_eligible_count: number
  keeper_slots: number
  notes: { id: string; note: string }[]
}
interface Player { player_name: string; service_year: number; salary: number; slot_type: string; is_franchise_player: boolean; dead_money?: number | null; position?: string | null }
interface TeamRoster { slug: string; roster: Player[]; loading: boolean }

export default function LeagueClient({ teams, year }: { teams: TeamSummary[]; year: number }) {
  const [view, setView] = useState<View>('cards')
  const [rosters, setRosters] = useState<Record<string, TeamRoster>>({})
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  useEffect(() => {
    if (view !== 'rosters') return
    teams.forEach(t => {
      if (rosters[t.manager.slug]) return
      setRosters(r => ({ ...r, [t.manager.slug]: { slug: t.manager.slug, roster: [], loading: true } }))
      fetch(`/api/team/${t.manager.slug}?year=${year}`).then(r => r.json())
        .then(d => setRosters(r => ({ ...r, [t.manager.slug]: { slug: t.manager.slug, roster: d.roster ?? [], loading: false } })))
    })
  }, [view, teams, year, rosters])

  const totalSalary = teams.reduce((a, t) => a + t.salary, 0)
  const avgCap = Math.round(teams.reduce((a, t) => a + t.cap_space, 0) / teams.length)

  const SERVICE_TIER_LABELS = [
    { label: 'Pre-Service', min: 0, max: 0 },
    { label: '1st Year',    min: 1, max: 1 },
    { label: '2nd Year',    min: 2, max: 2 },
    { label: 'Established', min: 3, max: 4 },
    { label: 'Veteran',     min: 5, max: 6 },
    { label: 'Franchise Core', min: 7, max: 99 },
  ]

  return (
    <>
      <PlayerCard playerName={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f1117', letterSpacing: '-0.02em' }}>{year} WAB Rosters</h1>
          <p style={{ marginTop: 2, color: '#9ca3af', fontSize: '0.78rem' }}>Westminster Auction Baseball · 10 teams</p>
        </div>
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #e4e7ec', borderRadius: 7, padding: 3, gap: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          {([['cards','⊞ Cards'],['rosters','☰ Rosters'],['finances','$ Finances']] as [View,string][]).map(([v,label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 12px', borderRadius: 5, border: 'none',
              background: view === v ? '#1a56db' : 'transparent',
              color: view === v ? '#fff' : '#6b7280',
              cursor: 'pointer', fontWeight: view === v ? 700 : 500,
              fontSize: '0.78rem', transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: '10px 16px', background: '#fff', border: '1px solid #e4e7ec', borderRadius: 8, flexWrap: 'wrap' }}>
        {[
          { label: 'Season', value: String(year) },
          { label: 'Teams', value: '10' },
          { label: 'League Salary', value: `$${totalSalary.toLocaleString()}` },
          { label: 'Avg Cap', value: `$${avgCap}` },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f1117', letterSpacing: '-0.02em' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* CARDS VIEW */}
      {view === 'cards' && (
        <>
          <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
            {teams.map(t => <TeamCard key={t.manager.id} {...t} />)}
          </div>

          {/* Service year legend */}
          <div style={{ marginTop: 20, padding: '12px 14px', background: '#fff', border: '1px solid #e4e7ec', borderRadius: 8 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 8 }}>Service Year Legend</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {SERVICE_TIER_LABELS.map(tier => {
                const color = SVC_COLORS[Math.min(tier.min, 11)]
                const range = tier.min === tier.max ? `Yr ${tier.min}` : tier.max > 90 ? `Yr ${tier.min}+` : `Yr ${tier.min}–${tier.max}`
                return (
                  <div key={tier.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: color + '22', border: `1px solid ${color}88`, borderRadius: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, border: '1px solid rgba(0,0,0,0.12)', display: 'inline-block' }} />
                    <span style={{ fontSize: '0.65rem', color: '#374151', fontWeight: 600 }}>{tier.label}</span>
                    <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{range}</span>
                  </div>
                )
              })}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6, borderLeft: '1px solid #e4e7ec', paddingLeft: 8 }}>
                <span style={{ fontSize: '0.65rem', color: '#1a56db' }}>★</span>
                <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontStyle: 'italic' }}>Franchise player</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ROSTERS VIEW */}
      {view === 'rosters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {teams.map(t => {
            const rd = rosters[t.manager.slug]
            const mlb     = rd?.roster.filter(p => p.slot_type === 'MLB') ?? []
            const milb    = rd?.roster.filter(p => p.slot_type === 'MiLB') ?? []
            const il      = rd?.roster.filter(p => p.slot_type === 'IL') ?? []
            const dropped = rd?.roster.filter(p => p.slot_type === 'dropped') ?? []
            const capColor = t.cap_space <= 0 ? '#b91c1c' : t.cap_space <= 5 ? '#b45309' : '#166534'
            const deadMoney = dropped.reduce((a, p) => a + (p.dead_money ?? Math.ceil(p.salary / 2)), 0)

            return (
              <div key={t.manager.slug} className="card" style={{ overflow: 'hidden' }}>
                {/* Team header */}
                <div style={{ padding: '10px 14px', background: '#f6f7f9', borderBottom: '1px solid #e4e7ec' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: t.notes.length > 0 ? 8 : 0 }}>
                    <a href={`/team/${t.manager.slug}`} style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f1117', textDecoration: 'none' }}>{t.manager.name}</a>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Budget', value: `$${t.budget}`,      color: '#0f1117' },
                        { label: 'Salary', value: `$${t.salary}`,      color: '#374151' },
                        { label: 'Cap',    value: `$${t.cap_space}`,   color: capColor },
                        { label: 'IL',     value: t.injured_count,     color: '#b45309' },
                        { label: 'Dead',   value: `$${deadMoney}`,     color: '#b91c1c' },
                        { label: 'Slots',  value: t.keeper_slots,      color: '#1a56db' },
                      ].map(s => (
                        <div key={s.label} style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', fontWeight: 600 }}>{s.label}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: s.color }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {t.notes.length > 0 && (
                    <div style={{ padding: '6px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 5 }}>
                      {t.notes.map(n => (
                        <div key={n.id} style={{ fontSize: '0.75rem', color: '#374151', lineHeight: 1.5 }}>{n.note}</div>
                      ))}
                    </div>
                  )}
                </div>

                {rd?.loading && <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>Loading…</div>}
                {!rd?.loading && rd && (
                  <div className="roster-col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>
                    <div style={{ borderRight: '1px solid #f0f2f5' }}>
                      <RosterSection showFilter title={`MLB (${mlb.length})`}  players={mlb}  accentColor="#166534" defaultOpen onPlayerClick={setSelectedPlayer} />
                    </div>
                    <div style={{ borderRight: '1px solid #f0f2f5' }}>
                      <RosterSection showFilter title={`MiLB (${milb.length})`} players={milb} accentColor="#1a56db" defaultOpen onPlayerClick={setSelectedPlayer} />
                      <RosterSection showFilter title={`IL (${il.length})`}     players={il}   accentColor="#b45309" defaultOpen onPlayerClick={setSelectedPlayer} />
                    </div>
                    <div>
                      <RosterSection
                        title={`Dropped — $${deadMoney} dead (${dropped.length})`}
                        players={dropped} accentColor="#b91c1c" defaultOpen onPlayerClick={setSelectedPlayer}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {view === 'finances' && (() => {
        const leagueBudget = teams.reduce((a, t) => a + t.budget, 0)
        const leagueSalary = teams.reduce((a, t) => a + t.salary, 0)
        const leagueDead   = teams.reduce((a, t) => a + (t.salary > t.budget ? 0 : 0), 0) // computed below per team
        const sorted = [...teams].sort((a, b) => (b.budget - b.salary) - (a.budget - a.salary))

        // Compute dead cap per team from rosters view data if loaded, else estimate from TeamSummary
        function deadCap(t: TeamSummary): number {
          const rd = rosters[t.manager.slug]
          if (rd?.roster?.length) {
            return rd.roster
              .filter(p => p.slot_type === 'dropped')
              .reduce((a, p) => a + (p.dead_money ?? Math.ceil(p.salary / 2)), 0)
          }
          return 0
        }

        const totalDead = sorted.reduce((a, t) => a + deadCap(t), 0)
        const totalCapSpace = leagueBudget - leagueSalary

        function pctBar(activePct: number, deadPct: number, spacePct: number) {
          return (
            <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: '#f0f2f5', display: 'flex', width: '100%' }}>
              <div style={{ width: `${activePct}%`, background: '#1a56db' }} />
              <div style={{ width: `${deadPct}%`,   background: '#b91c1c' }} />
              <div style={{ width: `${Math.max(spacePct,0)}%`, background: '#86efac' }} />
            </div>
          )
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* League summary */}
            <div style={{ background: '#0f1117', borderRadius: 10, padding: '18px 22px', color: '#fff', marginBottom: 6 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#6b7280', marginBottom: 12 }}>
                League Total — {year}
              </div>
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'Total Budget',  value: `$${leagueBudget}`, color: '#fff' },
                  { label: 'Active Salary', value: `$${leagueSalary}`, pct: Math.round(leagueSalary/leagueBudget*100), color: '#60a5fa' },
                  { label: 'Cap Space',     value: `$${totalCapSpace}`, pct: Math.round(totalCapSpace/leagueBudget*100), color: totalCapSpace/leagueBudget > 0.1 ? '#4ade80' : '#fbbf24' },
                  { label: 'Dead Cap',      value: `$${totalDead}`,    pct: Math.round(totalDead/leagueBudget*100),    color: '#f87171' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: '0.58rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    {'pct' in s && <div style={{ fontSize: '0.68rem', color: s.color, marginTop: 1 }}>{s.pct}% of budget</div>}
                  </div>
                ))}
              </div>
              {pctBar(
                Math.round(leagueSalary/leagueBudget*100),
                Math.round(totalDead/leagueBudget*100),
                Math.round(totalCapSpace/leagueBudget*100),
              )}
              <div style={{ display: 'flex', gap: 14, marginTop: 7 }}>
                {[['#3b82f6','Active'],['#ef4444','Dead Cap'],['#86efac','Cap Space']].map(([c,l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                    <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team rows */}
            {sorted.map((t, i) => {
              const dead     = deadCap(t)
              const capSpace = t.budget - t.salary
              const activePct = Math.round(t.salary  / t.budget * 100)
              const deadPct   = Math.round(dead      / t.budget * 100)
              const spacePct  = Math.round(capSpace  / t.budget * 100)
              const spaceColor = spacePct >= 15 ? '#166534' : spacePct >= 5 ? '#854d0e' : '#b91c1c'
              const deadColor  = deadPct  >= 20 ? '#b91c1c' : deadPct  >= 10 ? '#854d0e' : '#6b7280'
              return (
                <div key={t.manager.id} style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', minWidth: 16 }}>#{i+1}</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f1117' }}>{t.manager.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: '0.58rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Budget</span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f1117' }}>${t.budget}</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>{pctBar(activePct, deadPct, spacePct)}</div>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Active Salary', value: `$${t.salary}`,  pct: activePct, color: '#374151' },
                      { label: 'Cap Space',      value: `$${capSpace}`, pct: spacePct,  color: spaceColor },
                      { label: 'Dead Cap',       value: `$${dead}`,     pct: deadPct,   color: deadColor },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.68rem', color: s.color, fontWeight: 600 }}>{s.pct}% of budget</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}
    </>
  )
}
