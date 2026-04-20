'use client'
import { useEffect, useState, useCallback } from 'react'

interface Props { playerName: string | null; onClose: () => void }

// Percentile color — Savant already inverts for "bad" stats so high = good
function pctColor(pct: number | null | undefined): string {
  if (pct == null) return '#9ca3af'
  if (pct >= 70) return '#166534'
  if (pct >= 40) return '#854d0e'
  return '#b91c1c'
}
function pctBg(pct: number | null | undefined): string {
  if (pct == null) return '#f6f7f9'
  if (pct >= 70) return '#dcfce7'
  if (pct >= 40) return '#fef9c3'
  return '#fee2e2'
}

function PercentileBar({ label, pct, value }: { label: string; pct: number | null; value?: string }) {
  const color = pctColor(pct)
  const bg = pctBg(pct)
  const w = pct != null ? `${pct}%` : '0%'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <div style={{ width: 100, fontSize: '0.75rem', color: '#374151', fontWeight: 500, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 22, background: '#f0f2f5', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: w, background: color, borderRadius: 4, transition: 'width 0.5s ease', opacity: 0.85 }} />
        {pct != null && (
          <span style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.68rem', fontWeight: 800, color,
          }}>
            {pct}
          </span>
        )}
      </div>
      <div style={{ width: 48, textAlign: 'right', fontSize: '0.75rem', color: '#6b7280', flexShrink: 0 }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

function StatBox({ label, value, subLabel }: { label: string; value: string | number; subLabel?: string }) {
  return (
    <div style={{
      background: '#f6f7f9', borderRadius: 6, border: '1px solid #e4e7ec',
      padding: '8px 10px', textAlign: 'center', minWidth: 62,
    }}>
      <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f1117', letterSpacing: '-0.02em' }}>{value}</div>
      {subLabel && <div style={{ fontSize: '0.58rem', color: '#9ca3af', marginTop: 1 }}>{subLabel}</div>}
    </div>
  )
}

function fmt(v: unknown, dec = 0): string {
  if (v == null || v === '') return '—'
  const n = parseFloat(String(v))
  if (isNaN(n)) return '—'
  return dec > 0 ? n.toFixed(dec) : String(Math.round(n))
}

function fmtAvg(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = parseFloat(String(v))
  if (isNaN(n)) return '—'
  return n.toFixed(3).replace(/^0/, '')
}

export default function PlayerCard({ playerName, onClose }: Props) {
  const [data, setData] = useState<Record<string,unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [linkMode, setLinkMode] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<{ mlbam_id: number; name: string; team: string; position: string }[]>([])
  const [linking, setLinking] = useState(false)

  const fetchCard = useCallback(async (name: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/player-card?name=${encodeURIComponent(name)}`)
      setData(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (playerName) { setData(null); setLinkMode(false); fetchCard(playerName) }
  }, [playerName, fetchCard])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  async function searchMLBAM(q: string) {
    if (q.length < 2) return setSearchResults([])
    const res = await fetch(`/api/mlbam-search?q=${encodeURIComponent(q)}`)
    setSearchResults(await res.json())
  }

  async function linkPlayer(mlbam_id: number) {
    if (!playerName) return
    setLinking(true)
    await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'link_player', playerName, mlbam_id }),
    })
    setLinking(false); setLinkMode(false)
    fetchCard(playerName)
  }

  if (!playerName) return null

  const player  = data?.player as Record<string,unknown> | undefined
  const savant  = data?.savant as Record<string,unknown> | null | undefined
  const mlb     = data?.mlb as Record<string,unknown> | null | undefined
  const hitting = mlb?.hitting as Record<string,unknown> | null
  const pitching = mlb?.pitching as Record<string,unknown> | null
  const needsId = data?.needs_id === true

  const pos = (player?.position as string) ?? ''
  const isPitcher = pos.split(',').some(p => ['SP','RP','P'].includes(p.trim()))

  // WAB stat grid labels
  const hitterStats = hitting ? [
    { label: 'R',   value: fmt(hitting.runs) },
    { label: '2B',  value: fmt(hitting.doubles) },
    { label: '3B',  value: fmt(hitting.triples) },
    { label: 'HR',  value: fmt(hitting.homeRuns) },
    { label: 'RBI', value: fmt(hitting.rbi) },
    { label: 'SB',  value: fmt(hitting.stolenBases) },
    { label: 'SO',  value: fmt(hitting.strikeOuts) },
    { label: 'AVG', value: fmtAvg(hitting.avg) },
    { label: 'OBP', value: fmtAvg(hitting.obp) },
    { label: 'PA',  value: fmt(hitting.plateAppearances) },
  ] : []

  const pitcherStats = pitching ? [
    { label: 'W',    value: fmt(pitching.wins) },
    { label: 'L',    value: fmt(pitching.losses) },
    { label: 'SV',   value: fmt(pitching.saves) },
    { label: 'HLD',  value: fmt(pitching.holds) },
    { label: 'ERA',  value: fmt(pitching.era, 2) },
    { label: 'WHIP', value: fmt(pitching.whip, 2) },
    { label: 'K',    value: fmt(pitching.strikeOuts) },
    { label: 'BB',   value: fmt(pitching.baseOnBalls) },
    { label: 'IP',   value: fmt(pitching.inningsPitched, 1) },
  ] : []

  // Statcast percentile bars — pitcher vs hitter
  const hitterBars = [
    { label: 'xwOBA',        pct: savant?.xwoba_pct as number,        value: fmt(savant?.xwoba, 3).replace(/^0/, '') },
    { label: 'xBA',          pct: savant?.xba_pct as number,          value: fmt(savant?.xba, 3).replace(/^0/, '') },
    { label: 'xSLG',         pct: savant?.xslg_pct as number,         value: fmt(savant?.xslg, 3).replace(/^0/, '') },
    { label: 'Avg Exit Velo',pct: savant?.exit_velocity_avg_pct as number, value: fmt(savant?.exit_velocity_avg, 1) },
    { label: 'Barrel %',     pct: savant?.barrel_batted_rate_pct as number, value: fmt(savant?.barrel_batted_rate, 1) + '%' },
    { label: 'Hard-Hit %',   pct: savant?.hard_hit_percent_pct as number, value: fmt(savant?.hard_hit_percent, 1) + '%' },
    { label: 'Bat Speed',    pct: savant?.avg_best_speed_pct as number, value: fmt(savant?.avg_best_speed, 1) },
    { label: 'Chase %',      pct: savant?.chase_percent_pct as number, value: fmt(savant?.chase_percent, 1) + '%' },
    { label: 'Whiff %',      pct: savant?.whiff_percent_pct as number, value: fmt(savant?.whiff_percent, 1) + '%' },
    { label: 'K %',          pct: savant?.k_percent_pct as number,    value: fmt(savant?.k_percent, 1) + '%' },
    { label: 'BB %',         pct: savant?.bb_percent_pct as number,   value: fmt(savant?.bb_percent, 1) + '%' },
    { label: 'Sprint Speed', pct: savant?.sprint_speed_pct as number, value: fmt(savant?.sprint_speed, 1) },
  ]

  const pitcherBars = [
    { label: 'xERA',         pct: savant?.xera_pct as number,         value: fmt(savant?.xera, 2) },
    { label: 'xBA',          pct: savant?.xba_pct as number,          value: fmt(savant?.xba, 3).replace(/^0/,'') },
    { label: 'Avg EV Against',pct: savant?.exit_velocity_avg_pct as number, value: fmt(savant?.exit_velocity_avg, 1) },
    { label: 'Chase %',      pct: savant?.chase_percent_pct as number, value: fmt(savant?.chase_percent, 1) + '%' },
    { label: 'Whiff %',      pct: savant?.whiff_percent_pct as number, value: fmt(savant?.whiff_percent, 1) + '%' },
    { label: 'K %',          pct: savant?.k_percent_pct as number,    value: fmt(savant?.k_percent, 1) + '%' },
    { label: 'BB %',         pct: savant?.bb_percent_pct as number,   value: fmt(savant?.bb_percent, 1) + '%' },
    { label: 'Barrel %',     pct: savant?.barrel_batted_rate_pct as number, value: fmt(savant?.barrel_batted_rate, 1) + '%' },
    { label: 'Hard-Hit %',   pct: savant?.hard_hit_percent_pct as number, value: fmt(savant?.hard_hit_percent, 1) + '%' },
    { label: 'GB %',         pct: savant?.gb_batted_rate_pct as number, value: fmt(savant?.gb_batted_rate, 1) + '%' },
  ]

  const bars = isPitcher ? pitcherBars : hitterBars
  const statGrid = isPitcher ? pitcherStats : hitterStats
  const hasSavant = savant != null && Object.keys(savant).length > 2
  const hasStats = statGrid.length > 0

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(640px, 95vw)', maxHeight: '90vh',
        background: '#fff', border: '1px solid #e4e7ec', borderRadius: 12,
        zIndex: 101, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f1117', letterSpacing: '-0.02em' }}>
              {(player?.name as string) ?? playerName}
            </div>
            <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {pos && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '1px 7px', borderRadius: 4, background: isPitcher ? '#dbeafe' : '#dcfce7', color: isPitcher ? '#1e40af' : '#166534', border: `1px solid ${isPitcher ? '#bfdbfe' : '#bbf7d0'}` }}>
                  {pos}
                </span>
              )}
              {mlb?.teamAbbr != null && (
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>{String(mlb.teamAbbr)}</span>
              )}
              {!data?.mlbam_id && !loading && !needsId && (
                <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>No MLBAM ID</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setLinkMode(l => !l)} style={{
              padding: '4px 10px', borderRadius: 5, border: '1px solid #e4e7ec',
              background: linkMode ? '#eff6ff' : '#f6f7f9', color: linkMode ? '#1a56db' : '#6b7280',
              fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
            }}>🔗 Link ID</button>
            <button onClick={onClose} style={{ background: '#f4f5f7', border: 'none', borderRadius: 6, color: '#6b7280', cursor: 'pointer', fontSize: '0.9rem', padding: '4px 8px' }}>✕</button>
          </div>
        </div>

        {/* Link player panel */}
        {linkMode && (
          <div style={{ padding: '12px 18px', background: '#f8f9fb', borderBottom: '1px solid #e4e7ec' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 8 }}>
              Search MLB database to link player
            </div>
            <input
              placeholder="Type player name to search…"
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); searchMLBAM(e.target.value) }}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #e4e7ec', borderRadius: 6, fontSize: '0.85rem', color: '#0f1117', background: '#fff', outline: 'none' }}
            />
            {searchResults.length > 0 && (
              <div style={{ marginTop: 6, border: '1px solid #e4e7ec', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                {searchResults.map(r => (
                  <button key={r.mlbam_id} onClick={() => linkPlayer(r.mlbam_id)} disabled={linking} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '8px 12px', background: 'none', border: 'none',
                    borderBottom: '1px solid #f0f2f5', cursor: 'pointer', textAlign: 'left',
                  }}>
                    <span style={{ flex: 1, fontSize: '0.85rem', color: '#0f1117', fontWeight: 500 }}>{r.name}</span>
                    <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{r.team}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#f0f2f5', color: '#374151' }}>{r.position}</span>
                    <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>#{r.mlbam_id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '14px 18px 18px' }}>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading…</div>}

          {!loading && needsId && !linkMode && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔗</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>No MLBAM ID linked</div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 14 }}>Link this player to the MLB database to see Statcast data.</div>
              <button onClick={() => setLinkMode(true)} style={{ padding: '7px 18px', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.83rem' }}>
                Link Player
              </button>
            </div>
          )}

          {!loading && !needsId && data && (
            <>
              {/* 2026 Season Stats */}
              {hasStats && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 10 }}>
                    2026 Season — {isPitcher ? 'Pitching' : 'Hitting'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {statGrid.map(s => (
                      <StatBox key={s.label} label={s.label} value={s.value} />
                    ))}
                  </div>
                </div>
              )}

              {!hasStats && (
                <div style={{ padding: '12px 0', fontSize: '0.82rem', color: '#9ca3af', marginBottom: 14 }}>
                  No 2026 MLB stats yet.
                </div>
              )}

              {/* Statcast percentile bars */}
              {hasSavant ? (
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 10 }}>
                    Statcast Actuals — Percentile vs MLB
                  </div>
                  {bars.filter(b => b.pct != null).map(b => (
                    <PercentileBar key={b.label} label={b.label} pct={b.pct} value={b.value} />
                  ))}
                  {bars.every(b => b.pct == null) && (
                    <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>No Statcast data available yet for 2026.</div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 8 }}>
                    Statcast Actuals
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                    Statcast data not yet available — check back once the player has more plate appearances.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
