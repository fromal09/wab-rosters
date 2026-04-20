'use client'
import { useEffect, useState, useCallback } from 'react'

interface Props { playerName: string | null; onClose: () => void }

// ── Percentile color scale ────────────────────────────────────────────────────
function pctColor(pct: number | null): string {
  if (pct == null) return '#9ca3af'
  if (pct >= 90)   return '#166534'
  if (pct >= 70)   return '#15803d'
  if (pct >= 45)   return '#854d0e'
  if (pct >= 30)   return '#b45309'
  return '#b91c1c'
}
function pctBg(pct: number | null): string {
  if (pct == null) return '#f6f7f9'
  if (pct >= 70)   return '#dcfce7'
  if (pct >= 45)   return '#fef9c3'
  return '#fee2e2'
}

function PercentileBar({ label, pct }: { label: string; pct: number | null }) {
  if (pct == null) return null
  const color = pctColor(pct)
  const bg = pctBg(pct)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
      <div style={{ width: 120, fontSize: '0.75rem', color: '#374151', fontWeight: 500, flexShrink: 0, textAlign: 'right' }}>{label}</div>
      <div style={{ flex: 1, height: 24, background: '#f0f2f5', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
        <span style={{
          position: 'absolute', left: `max(${pct}% - 8px, 8px)`, top: '50%', transform: 'translateY(-50%)',
          fontSize: '0.7rem', fontWeight: 800, color: pct > 10 ? '#fff' : color,
          textShadow: pct > 10 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
          userSelect: 'none',
        }}>
          {pct}
        </span>
      </div>
      <div style={{
        width: 36, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: bg, borderRadius: 4, border: `1px solid ${color}40`,
        fontSize: '0.65rem', fontWeight: 800, color, flexShrink: 0,
      }}>
        {pct}
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f6f7f9', borderRadius: 6, border: '1px solid #e4e7ec', padding: '8px 10px', textAlign: 'center', minWidth: 58, flex: '1 1 auto' }}>
      <div style={{ fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f1117', letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  )
}

function XStatBox({ label, value, pct }: { label: string; value: string; pct?: number | null }) {
  const color = pct != null ? pctColor(pct) : '#1e40af'
  const bg    = pct != null ? pctBg(pct)   : '#eff6ff'
  return (
    <div style={{ background: bg, borderRadius: 6, border: `1px solid ${color}30`, padding: '8px 10px', textAlign: 'center', minWidth: 70, flex: '1 1 auto', position: 'relative' }}>
      <div style={{ fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.07em', color, fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 800, color, letterSpacing: '-0.01em' }}>{value}</div>
      {pct != null && (
        <div style={{ fontSize: '0.55rem', color, marginTop: 2, fontWeight: 600 }}>{pct}th %ile</div>
      )}
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
  if (isNaN(n) || n === 0) return '—'
  return n.toFixed(3).replace(/^0/, '')
}
function good(v: string): boolean { return v !== '—' && v !== '%' && v !== '°' && v !== '' }

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
    setSearchResults(await (await fetch(`/api/mlbam-search?q=${encodeURIComponent(q)}`)).json())
  }
  async function linkPlayer(mlbam_id: number) {
    if (!playerName) return
    setLinking(true)
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'link_player', playerName, mlbam_id }) })
    setLinking(false); setLinkMode(false)
    fetchCard(playerName)
  }

  if (!playerName) return null

  const player   = data?.player  as Record<string,unknown> | undefined
  const savant   = data?.savant  as Record<string,unknown> | null | undefined
  const mlb      = data?.mlb     as Record<string,unknown> | null | undefined
  const needsId  = data?.needs_id === true
  const hitting  = mlb?.hitting          as Record<string,unknown> | null
  const pitching = mlb?.pitching         as Record<string,unknown> | null
  const hExp     = mlb?.hittingExpected  as Record<string,unknown> | null
  const pExp     = mlb?.pitchingExpected as Record<string,unknown> | null

  const pos       = (player?.position as string) ?? ''
  const isPitcher = pos.split(',').some(p => ['SP','RP','P'].includes(p.trim()))

  // ── Standard counting stats ───────────────────────────────────────────────
  const hitterStats = hitting ? [
    { l: 'R',   v: fmt(hitting.runs) },
    { l: '2B',  v: fmt(hitting.doubles) },
    { l: '3B',  v: fmt(hitting.triples) },
    { l: 'HR',  v: fmt(hitting.homeRuns) },
    { l: 'RBI', v: fmt(hitting.rbi) },
    { l: 'SB',  v: fmt(hitting.stolenBases) },
    { l: 'SO',  v: fmt(hitting.strikeOuts) },
    { l: 'AVG', v: fmtAvg(hitting.avg) },
    { l: 'OBP', v: fmtAvg(hitting.obp) },
    { l: 'PA',  v: fmt(hitting.plateAppearances) },
  ] : []

  const pitcherStats = pitching ? [
    { l: 'W',    v: fmt(pitching.wins) },
    { l: 'L',    v: fmt(pitching.losses) },
    { l: 'SV',   v: fmt(pitching.saves) },
    { l: 'HLD',  v: fmt(pitching.holds) },
    { l: 'ERA',  v: fmt(pitching.era, 2) },
    { l: 'WHIP', v: fmt(pitching.whip, 2) },
    { l: 'K',    v: fmt(pitching.strikeOuts) },
    { l: 'BB',   v: fmt(pitching.baseOnBalls) },
    { l: 'IP',   v: fmt(pitching.inningsPitched, 1) },
  ] : []

  // ── Expected / Statcast boxes (MLB API) ───────────────────────────────────
  const pct = (field: string) => {
    const v = savant?.[field]
    return (typeof v === 'number' && v >= 0 && v <= 100) ? v as number : null
  }

  const hitterXBoxes = hExp ? [
    { l: 'xwOBA', v: fmtAvg(hExp.woba ?? hExp.xwoba),       pct: pct('xwoba') },
    { l: 'xBA',   v: fmtAvg(hExp.avg  ?? hExp.xba),         pct: pct('xba') },
    { l: 'xSLG',  v: fmtAvg(hExp.slg  ?? hExp.xslg),        pct: null },
    { l: 'EV',    v: fmt(hExp.launchSpeed ?? hExp.exitVelocity, 1), pct: pct('exit_velocity_avg') },
    { l: 'HH%',   v: fmt(hExp.hardHit ?? hExp.hardHitPercent, 1) + '%', pct: pct('hard_hit_percent') },
    { l: 'Barrel%', v: fmt(hExp.barrelRate ?? hExp.barrelBatRate, 1) + '%', pct: pct('barrel_batted_rate') },
  ].filter(s => good(s.v)) : []

  const pitcherXBoxes = pExp ? [
    { l: 'xERA',    v: fmt(pExp.era  ?? pExp.xera, 2),         pct: pct('xera') },
    { l: 'xwOBA vs',v: fmtAvg(pExp.woba ?? pExp.xwoba),        pct: pct('xwoba') },
    { l: 'xBA vs',  v: fmtAvg(pExp.avg  ?? pExp.xba),          pct: pct('xba') },
    { l: 'EV vs',   v: fmt(pExp.launchSpeed ?? pExp.exitVelocity, 1), pct: pct('exit_velocity_avg') },
    { l: 'HH%',     v: fmt(pExp.hardHit ?? pExp.hardHitPercent, 1) + '%', pct: pct('hard_hit_percent') },
    { l: 'Barrel%', v: fmt(pExp.barrelRate ?? pExp.barrelBatRate, 1) + '%', pct: pct('barrel_batted_rate') },
  ].filter(s => good(s.v)) : []

  // ── Savant percentile bars ────────────────────────────────────────────────
  const hitterBars = [
    { l: 'xwOBA',         p: pct('xwoba') },
    { l: 'xBA',           p: pct('xba') },
    { l: 'Exit Velocity', p: pct('exit_velocity_avg') },
    { l: 'Barrel %',      p: pct('barrel_batted_rate') },
    { l: 'Hard-Hit %',    p: pct('hard_hit_percent') },
    { l: 'Bat Speed',     p: pct('avg_best_speed') },
    { l: 'Chase %',       p: pct('oz_swing_percent') },
    { l: 'Whiff %',       p: pct('whiff_percent') },
    { l: 'K %',           p: pct('k_percent') },
    { l: 'BB %',          p: pct('bb_percent') },
    { l: 'Sprint Speed',  p: pct('sprint_speed') },
  ].filter(b => b.p != null)

  const pitcherBars = [
    { l: 'xERA',           p: pct('xera') },
    { l: 'xBA against',    p: pct('xba') },
    { l: 'Exit Velo vs',   p: pct('exit_velocity_avg') },
    { l: 'Chase %',        p: pct('oz_swing_percent') },
    { l: 'Whiff %',        p: pct('whiff_percent') },
    { l: 'K %',            p: pct('k_percent') },
    { l: 'BB %',           p: pct('bb_percent') },
    { l: 'Barrel % vs',    p: pct('barrel_batted_rate') },
    { l: 'Hard-Hit % vs',  p: pct('hard_hit_percent') },
    { l: 'GB %',           p: pct('groundballs_percent') ?? pct('gb_batted_rate') },
  ].filter(b => b.p != null)

  const statGrid = isPitcher ? pitcherStats : hitterStats
  const xBoxes   = isPitcher ? pitcherXBoxes : hitterXBoxes
  const bars     = isPitcher ? pitcherBars : hitterBars
  const teamStr  = mlb?.teamAbbr != null ? String(mlb.teamAbbr) : null

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(660px,95vw)', maxHeight: '90vh', background: '#fff',
        border: '1px solid #e4e7ec', borderRadius: 12, zIndex: 101,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>

        {/* Header */}
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f1117', letterSpacing: '-0.02em' }}>
              {(player?.name as string) ?? playerName}
            </div>
            <div style={{ marginTop: 4, display: 'flex', gap: 7, alignItems: 'center' }}>
              {pos && (
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 4,
                  background: isPitcher ? '#dbeafe' : '#dcfce7', color: isPitcher ? '#1e40af' : '#166534',
                  border: `1px solid ${isPitcher ? '#bfdbfe' : '#bbf7d0'}` }}>
                  {pos}
                </span>
              )}
              {teamStr && <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>{teamStr}</span>}
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
            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 8 }}>
              Search MLB database
            </div>
            <input placeholder="Type player name…" value={searchQ}
              onChange={e => { setSearchQ(e.target.value); searchMLBAM(e.target.value) }}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #e4e7ec', borderRadius: 6, fontSize: '0.85rem', color: '#0f1117', background: '#fff', outline: 'none' }} />
            {searchResults.length > 0 && (
              <div style={{ marginTop: 6, border: '1px solid #e4e7ec', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                {searchResults.map(r => (
                  <button key={r.mlbam_id} onClick={() => linkPlayer(r.mlbam_id)} disabled={linking}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid #f0f2f5', cursor: 'pointer', textAlign: 'left' }}>
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
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px 20px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Season stats */}
              {statGrid.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9ca3af', marginBottom: 9 }}>
                    2026 Season — {isPitcher ? 'Pitching' : 'Hitting'}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {statGrid.map(s => <StatBox key={s.l} label={s.l} value={s.v} />)}
                  </div>
                </div>
              )}
              {!statGrid.length && (
                <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>No 2026 MLB stats recorded yet.</div>
              )}

              {/* Statcast percentile bars — Savant (visual, when available) */}
              {bars.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9ca3af', marginBottom: 10 }}>
                    Statcast — Percentile Ranks vs MLB
                  </div>
                  {bars.map(b => <PercentileBar key={b.l} label={b.l} pct={b.p} />)}
                </div>
              )}

              {/* Expected stats boxes — MLB API (when Savant bars unavailable) */}
              {xBoxes.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#1e40af', marginBottom: 9 }}>
                    Expected Stats (Statcast){bars.length > 0 ? ' — Actuals' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {xBoxes.map(s => <XStatBox key={s.l} label={s.l} value={s.v} pct={s.pct} />)}
                  </div>
                </div>
              )}

              {bars.length === 0 && xBoxes.length === 0 && statGrid.length > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontStyle: 'italic', padding: '4px 0' }}>
                  Statcast data appears once the player has sufficient plate appearances (typically 25+).
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        {bars.length > 0 && (
          <div style={{ padding: '8px 18px 12px', borderTop: '1px solid #f0f2f5', background: '#fafbfc', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Percentile</span>
            {[{ label: '≥90 Elite', color: '#166534', bg: '#dcfce7' }, { label: '70–89 Good', color: '#15803d', bg: '#dcfce7' }, { label: '45–69 Avg', color: '#854d0e', bg: '#fef9c3' }, { label: '<45 Below', color: '#b91c1c', bg: '#fee2e2' }].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: s.bg, border: `1px solid ${s.color}40`, display: 'inline-block' }} />
                <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
