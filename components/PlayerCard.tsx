'use client'
import { useEffect, useState, useCallback } from 'react'

interface Props { playerName: string | null; onClose: () => void }

function pctColor(pct: number | null | undefined) {
  if (pct == null) return '#9ca3af'
  if (pct >= 70)   return '#166534'
  if (pct >= 40)   return '#854d0e'
  return '#b91c1c'
}

function PercentileBar({ label, pct }: { label: string; pct: number | null }) {
  const color = pctColor(pct)
  const w = pct != null ? `${pct}%` : '0%'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
      <div style={{ width: 120, fontSize: '0.73rem', color: '#374151', fontWeight: 500, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 20, background: '#f0f2f5', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: w, background: color, borderRadius: 4, transition: 'width 0.4s ease', opacity: 0.8 }} />
        {pct != null && (
          <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: '0.67rem', fontWeight: 800, color }}>
            {pct}th
          </span>
        )}
      </div>
      {pct == null && <span style={{ fontSize: '0.7rem', color: '#d1d5db' }}>—</span>}
    </div>
  )
}

function StatBox({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ background: '#f6f7f9', borderRadius: 6, border: '1px solid #e4e7ec', padding: '7px 10px', textAlign: 'center', minWidth: 58 }}>
      <div style={{ fontSize: '0.57rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: accent ?? '#0f1117', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  )
}

function XStatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe', padding: '7px 10px', textAlign: 'center', minWidth: 58 }}>
      <div style={{ fontSize: '0.57rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1e40af', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em' }}>{value}</div>
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
    try { setData(await (await fetch(`/api/player-card?name=${encodeURIComponent(name)}`)).json()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (playerName) { setData(null); setLinkMode(false); fetchCard(playerName) } }, [playerName, fetchCard])
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
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'link_player', playerName, mlbam_id }) })
    setLinking(false); setLinkMode(false)
    fetchCard(playerName)
  }

  if (!playerName) return null

  const player   = data?.player as Record<string,unknown> | undefined
  const savant   = data?.savant  as Record<string,unknown> | null | undefined
  const mlb      = data?.mlb     as Record<string,unknown> | null | undefined
  const needsId  = data?.needs_id === true
  const hitting  = mlb?.hitting  as Record<string,unknown> | null
  const pitching = mlb?.pitching as Record<string,unknown> | null
  const hXpct    = mlb?.hittingExpected  as Record<string,unknown> | null
  const pXpct    = mlb?.pitchingExpected as Record<string,unknown> | null

  const pos = (player?.position as string) ?? ''
  const isPitcher = pos.split(',').some(p => ['SP','RP','P'].includes(p.trim()))

  // Standard WAB stat grids
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

  // Expected / Statcast stats from MLB API (reliable, no Savant scraping needed)
  const hitterXStats = hXpct ? [
    { label: 'xwOBA', value: fmtAvg(hXpct.xwoba ?? hXpct.woba) },
    { label: 'xBA',   value: fmtAvg(hXpct.xba ?? hXpct.avg) },
    { label: 'xSLG',  value: fmtAvg(hXpct.xslg ?? hXpct.slg) },
    { label: 'xOBP',  value: fmtAvg(hXpct.xobp ?? hXpct.obp) },
    { label: 'EV',    value: fmt(hXpct.launchSpeed ?? hXpct.exitVelocity, 1) },
    { label: 'LA',    value: fmt(hXpct.launchAngle, 1) + '°' },
    { label: 'HH%',   value: fmt(hXpct.hardHit ?? hXpct.hardHitPercent, 1) + '%' },
    { label: 'Barrel%', value: fmt(hXpct.barrelBat ?? hXpct.barrelRate, 1) + '%' },
  ].filter(s => s.value !== '—' && s.value !== '%' && s.value !== '°') : []

  const pitcherXStats = pXpct ? [
    { label: 'xERA',  value: fmt(pXpct.xera ?? pXpct.era, 2) },
    { label: 'xBA',   value: fmtAvg(pXpct.xba ?? pXpct.avg) },
    { label: 'xwOBA', value: fmtAvg(pXpct.xwoba ?? pXpct.woba) },
    { label: 'EV vs', value: fmt(pXpct.launchSpeed ?? pXpct.exitVelocity, 1) },
    { label: 'HH%',   value: fmt(pXpct.hardHit ?? pXpct.hardHitPercent, 1) + '%' },
    { label: 'Barrel%', value: fmt(pXpct.barrelBat ?? pXpct.barrelRate, 1) + '%' },
  ].filter(s => s.value !== '—' && s.value !== '%') : []

  // Savant percentile bars (bonus if available)
  const pct = (field: string) => {
    const v = savant?.[field]
    return (typeof v === 'number' && v >= 0 && v <= 100) ? v : null
  }
  const hitterBars = [
    { label: 'xwOBA',         pct: pct('xwoba') },
    { label: 'xBA',           pct: pct('xba') },
    { label: 'Avg Exit Velo', pct: pct('exit_velocity_avg') },
    { label: 'Barrel %',      pct: pct('barrel_batted_rate') },
    { label: 'Hard-Hit %',    pct: pct('hard_hit_percent') },
    { label: 'Bat Speed',     pct: pct('avg_best_speed') },
    { label: 'Chase %',       pct: pct('oz_swing_percent') },
    { label: 'Whiff %',       pct: pct('whiff_percent') },
    { label: 'K %',           pct: pct('k_percent') },
    { label: 'BB %',          pct: pct('bb_percent') },
    { label: 'Sprint Speed',  pct: pct('sprint_speed') },
  ]
  const pitcherBars = [
    { label: 'xERA',          pct: pct('xera') },
    { label: 'xBA against',   pct: pct('xba') },
    { label: 'Exit Velo vs',  pct: pct('exit_velocity_avg') },
    { label: 'Chase %',       pct: pct('oz_swing_percent') },
    { label: 'Whiff %',       pct: pct('whiff_percent') },
    { label: 'K %',           pct: pct('k_percent') },
    { label: 'BB %',          pct: pct('bb_percent') },
    { label: 'Barrel % vs',   pct: pct('barrel_batted_rate') },
    { label: 'Hard-Hit % vs', pct: pct('hard_hit_percent') },
    { label: 'GB %',          pct: pct('groundballs_percent') ?? pct('gb_batted_rate') },
  ]
  const bars = (isPitcher ? pitcherBars : hitterBars).filter(b => b.pct != null)
  const xStats  = isPitcher ? pitcherXStats : hitterXStats
  const statGrid = isPitcher ? pitcherStats : hitterStats

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(640px,95vw)', maxHeight: '90vh', background: '#fff',
        border: '1px solid #e4e7ec', borderRadius: 12, zIndex: 101,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
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
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setLinkMode(l => !l)} style={{
              padding: '4px 10px', borderRadius: 5, border: '1px solid #e4e7ec',
              background: linkMode ? '#eff6ff' : '#f6f7f9', color: linkMode ? '#1a56db' : '#6b7280',
              fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
            }}>🔗 Link ID</button>
            <button onClick={onClose} style={{ background: '#f4f5f7', border: 'none', borderRadius: 6, color: '#6b7280', cursor: 'pointer', fontSize: '0.9rem', padding: '4px 8px' }}>✕</button>
          </div>
        </div>

        {/* Link panel */}
        {linkMode && (
          <div style={{ padding: '12px 18px', background: '#f8f9fb', borderBottom: '1px solid #e4e7ec' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 8 }}>Search MLB database</div>
            <input placeholder="Type player name…" value={searchQ}
              onChange={e => { setSearchQ(e.target.value); searchMLBAM(e.target.value) }}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #e4e7ec', borderRadius: 6, fontSize: '0.85rem', color: '#0f1117', background: '#fff', outline: 'none' }} />
            {searchResults.length > 0 && (
              <div style={{ marginTop: 6, border: '1px solid #e4e7ec', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                {searchResults.map(r => (
                  <button key={r.mlbam_id} onClick={() => linkPlayer(r.mlbam_id)} disabled={linking} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid #f0f2f5', cursor: 'pointer', textAlign: 'left' }}>
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
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 14 }}>Link this player to the MLB database to see stats and Statcast data.</div>
              <button onClick={() => setLinkMode(true)} style={{ padding: '7px 18px', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.83rem' }}>Link Player</button>
            </div>
          )}

          {!loading && !needsId && data && (
            <>
              {/* 2026 Season */}
              {statGrid.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 9 }}>
                    2026 Season — {isPitcher ? 'Pitching' : 'Hitting'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {statGrid.map(s => <StatBox key={s.label} label={s.label} value={s.value} />)}
                  </div>
                </div>
              )}
              {statGrid.length === 0 && (
                <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: 14 }}>No 2026 MLB stats yet.</div>
              )}

              {/* Expected / Statcast stats from MLB API */}
              {xStats.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1e40af', marginBottom: 9 }}>
                    Expected Stats (Statcast)
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {xStats.map(s => <XStatBox key={s.label} label={s.label} value={s.value} />)}
                  </div>
                </div>
              )}

              {/* Savant percentile bars — shown when available */}
              {bars.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 9 }}>
                    Statcast Percentile Ranks vs MLB
                  </div>
                  {bars.map(b => <PercentileBar key={b.label} label={b.label} pct={b.pct} />)}
                </div>
              )}

              {bars.length === 0 && xStats.length === 0 && statGrid.length > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontStyle: 'italic' }}>
                  Statcast percentile data available once the player has 25+ plate appearances.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
