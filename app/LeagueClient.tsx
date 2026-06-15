'use client'
import { useState, useEffect } from 'react'
import TeamCard from '@/components/TeamCard'
import RosterSection from '@/components/RosterSection'
import PlayerCard from '@/components/PlayerCard'
import { SVC_COLORS, CURRENT_YEAR } from '@/lib/constants'

type View = 'cards' | 'rosters' | 'finances'

interface TeamSummary {
  manager: { id: string; name: string; slug: string }
  budget: number; salary: number; active_salary: number
  pitcher_salary: number; hitter_salary: number; ohtani_salary: number
  dead_cap: number; cap_space: number
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

      {/* Stats bar — hidden in finances view */}
      {view !== 'finances' && (
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
      )}

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
        const sorted = [...teams].sort((a, b) => b.cap_space - a.cap_space)
        const L = {
          budget:   teams.reduce((a, t) => a + t.budget, 0),
          hitters:  teams.reduce((a, t) => a + t.hitter_salary, 0),
          pitchers: teams.reduce((a, t) => a + t.pitcher_salary, 0),
          ohtani:   teams.reduce((a, t) => a + t.ohtani_salary, 0),
          dead:     teams.reduce((a, t) => a + t.dead_cap, 0),
          space:    teams.reduce((a, t) => a + t.cap_space, 0),
        }
        const hasOhtani = L.ohtani > 0

        function p(val: number, budget: number) { return budget > 0 ? Math.round(val / budget * 100) : 0 }

        function SegBar({ budget, hitters, pitchers, ohtani, dead, space }: { budget: number; hitters: number; pitchers: number; ohtani: number; dead: number; space: number }) {
          return (
            <div style={{ height: 9, borderRadius: 4, overflow: 'hidden', background: '#f0f2f5', display: 'flex', width: '100%' }}>
              <div style={{ width: `${p(hitters,budget)}%`,  background: '#2563eb' }} />
              <div style={{ width: `${p(pitchers,budget)}%`, background: '#16a34a' }} />
              {ohtani > 0 && <div style={{ width: `${p(ohtani,budget)}%`, background: '#7c3aed' }} />}
              <div style={{ width: `${p(dead,budget)}%`,     background: '#b91c1c' }} />
              <div style={{ width: `${Math.max(p(space,budget),0)}%`, background: '#bbf7d0' }} />
            </div>
          )
        }

        // Stat tile used in both league and team rows
        function Tile({ label, value, pct, color, dark = false }: { label: string; value: string; pct: number; color: string; dark?: boolean }) {
          const labelColor = dark ? '#6b7280' : '#9ca3af'
          const pctColor   = dark ? color      : color
          return (
            <div>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: labelColor, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color, letterSpacing: '-0.01em' }}>{value}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: pctColor }}>{pct}% of budget</div>
            </div>
          )
        }

        const LEGEND = [
          ['#2563eb','Hitters'], ['#16a34a','Pitchers'],
          ...(hasOhtani ? [['#7c3aed','Ohtani']] : []),
          ['#b91c1c','Dead Cap'], ['#bbf7d0','Cap Space'],
        ]

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* League summary */}
            <div style={{ background: '#0f1117', borderRadius: 10, padding: '18px 22px', color: '#fff', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#6b7280' }}>League Total — {year}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Total Budget <strong style={{ color: '#fff', fontSize: '1rem' }}>${L.budget}</strong></div>
              </div>
              <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 14 }}>
                <Tile label="Hitters"  value={`$${L.hitters}`}  pct={p(L.hitters,L.budget)}  color="#60a5fa" dark />
                <Tile label="Pitchers" value={`$${L.pitchers}`} pct={p(L.pitchers,L.budget)} color="#4ade80" dark />
                {hasOhtani && <Tile label="Ohtani" value={`$${L.ohtani}`} pct={p(L.ohtani,L.budget)} color="#c4b5fd" dark />}
                <Tile label="Dead Cap" value={`$${L.dead}`}     pct={p(L.dead,L.budget)}     color="#f87171" dark />
                <Tile label="Cap Space" value={`$${L.space}`}   pct={p(L.space,L.budget)}    color={p(L.space,L.budget) >= 10 ? '#4ade80' : '#fbbf24'} dark />
              </div>
              <SegBar budget={L.budget} hitters={L.hitters} pitchers={L.pitchers} ohtani={L.ohtani} dead={L.dead} space={L.space} />
              <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                {LEGEND.map(([c,l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c, border: l === 'Cap Space' ? '1px solid #6b7280' : 'none' }} />
                    <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team rows */}
            {sorted.map((t, i) => {
              const teamHasOhtani = t.ohtani_salary > 0
              const spaceColor = p(t.cap_space,t.budget) >= 15 ? '#166534' : p(t.cap_space,t.budget) >= 5 ? '#854d0e' : '#b91c1c'
              const deadColor  = p(t.dead_cap,t.budget)  >= 20 ? '#b91c1c' : p(t.dead_cap,t.budget)  >= 10 ? '#854d0e' : '#6b7280'
              return (
                <div key={t.manager.id} style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', minWidth: 16 }}>#{i+1}</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f1117' }}>{t.manager.name}</span>
                    </div>
                    <span style={{ fontSize: '0.58rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
                      Budget <strong style={{ color: '#0f1117', fontSize: '1rem' }}>${t.budget}</strong>
                    </span>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <SegBar budget={t.budget} hitters={t.hitter_salary} pitchers={t.pitcher_salary} ohtani={t.ohtani_salary} dead={t.dead_cap} space={t.cap_space} />
                  </div>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <Tile label="Hitters"   value={`$${t.hitter_salary}`}  pct={p(t.hitter_salary,t.budget)}  color="#1d4ed8" />
                    <Tile label="Pitchers"  value={`$${t.pitcher_salary}`} pct={p(t.pitcher_salary,t.budget)} color="#15803d" />
                    {teamHasOhtani && <Tile label="Ohtani" value={`$${t.ohtani_salary}`} pct={p(t.ohtani_salary,t.budget)} color="#7c3aed" />}
                    <Tile label="Dead Cap"  value={`$${t.dead_cap}`}       pct={p(t.dead_cap,t.budget)}       color={deadColor} />
                    <Tile label="Cap Space" value={`$${t.cap_space}`}      pct={p(t.cap_space,t.budget)}      color={spaceColor} />
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
