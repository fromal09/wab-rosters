'use client'
import { useEffect, useState, useCallback } from 'react'
import { getKeeperPrice, getServiceYearColor } from '@/lib/constants'
import ServiceYearBadge from './ServiceYearBadge'

interface RosterSlot {
  year: number; slot_type: string; service_year: number; salary: number
  dead_money?: number | null; is_franchise_player: boolean
  manager_name: string; manager_slug: string
}

interface Txn {
  year: number; type: string; price: number | null
  transaction_date: string | null; note: string | null; manager_name: string
}

interface Props { playerName: string | null; onClose: () => void }

const DEPARTED = new Set(['Brendan Prin', 'Josh Meyerchick', 'Tom Gieryn'])

const SLOT_STYLES: Record<string, { color: string; bg: string; label: string; border: string }> = {
  MLB:     { color: '#15803d', bg: '#f0fdf4', label: 'MLB',     border: '#bbf7d0' },
  MiLB:    { color: '#1d4ed8', bg: '#eff6ff', label: 'MiLB',    border: '#bfdbfe' },
  IL:      { color: '#d97706', bg: '#fffbeb', label: 'IL',      border: '#fde68a' },
  dropped: { color: '#dc2626', bg: '#fef2f2', label: 'Dropped', border: '#fecaca' },
}

const TXN_META: Record<string, { label: string; color: string; icon: string }> = {
  claim:            { label: 'Picked up',       color: '#15803d', icon: '↓' },
  drop:             { label: 'Dropped',          color: '#dc2626', icon: '↑' },
  trade_receive:    { label: 'Acquired in trade',color: '#1d4ed8', icon: '⇄' },
  trade_send:       { label: 'Traded away',      color: '#d97706', icon: '⇄' },
  keeper:           { label: 'Kept',             color: '#7c3aed', icon: '★' },
  qualifying_offer: { label: 'Qualifying Offer', color: '#db2777', icon: 'QO' },
}

function formatDate(d: string | null) {
  if (!d) return null
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return null }
}

export default function PlayerModal({ playerName, onClose }: Props) {
  const [data, setData] = useState<{ slots: RosterSlot[]; transactions: Txn[] } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (name: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/player?name=${encodeURIComponent(name)}`)
      setData(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (playerName) { setData(null); fetchData(playerName) }
  }, [playerName, fetchData])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  if (!playerName) return null

  const visibleSlots = (data?.slots ?? []).filter(s => !DEPARTED.has(s.manager_name))
  const visibleTxns = (data?.transactions ?? []).filter(t => !DEPARTED.has(t.manager_name))

  // Build event stream: merge slots + transactions, sort chronologically oldest→newest
  // Each event: { year, sortKey, kind: 'slot'|'txn', data }
  type SlotEvent = { kind: 'slot'; data: RosterSlot; sortKey: number }
  type TxnEvent  = { kind: 'txn';  data: Txn;        sortKey: number }
  type Event = SlotEvent | TxnEvent

  const events: Event[] = [
    ...visibleSlots.map(s => ({
      kind: 'slot' as const,
      data: s,
      sortKey: s.year * 10000 + 5000, // slots sort mid-year, txns sort by actual date
    })),
    ...visibleTxns.map(t => {
      let ts = t.year * 10000
      if (t.transaction_date) {
        try {
          const d = new Date(t.transaction_date)
          // day-of-year as sort offset within year
          const start = new Date(d.getFullYear(), 0, 0)
          const diff = d.getTime() - start.getTime()
          const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
          ts = d.getFullYear() * 10000 + dayOfYear
        } catch { /* keep year-level sort */ }
      }
      return { kind: 'txn' as const, data: t, sortKey: ts }
    }),
  ].sort((a, b) => a.sortKey - b.sortKey) // oldest first

  // Get latest slot for header
  const latestSlot = [...visibleSlots].sort((a, b) => b.year - a.year)[0]
  const latestActive = [...visibleSlots].filter(s => s.slot_type !== 'dropped').sort((a, b) => b.year - a.year)[0]
  const isFranchise = latestActive?.is_franchise_player === true || latestActive?.is_franchise_player as unknown as string === 'true'

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(560px, 95vw)', maxHeight: '85vh',
        background: '#fff', border: '1px solid #e2e6eb', borderRadius: 12,
        zIndex: 101, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0f2f5' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 className={isFranchise ? 'franchise-player' : ''} style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                {playerName}
                {isFranchise && <span style={{ fontSize: '0.7rem', color: '#1d4ed8', marginLeft: 6, fontStyle: 'normal', fontFamily: 'sans-serif' }}>★</span>}
              </h2>
              {latestActive && !loading && (
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <ServiceYearBadge year={latestActive.service_year} size="md" />
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Yr {latestActive.service_year}</span>
                  <span style={{ color: '#d1d5db' }}>·</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827' }}>${latestActive.salary}</span>
                  <span style={{ color: '#d1d5db' }}>·</span>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>KP ${getKeeperPrice(latestActive.salary)}</span>
                  {isFranchise && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', padding: '1px 6px', borderRadius: 4 }}>★ Franchise</span>
                  )}
                </div>
              )}
              {latestSlot && !latestActive && !loading && (
                <div style={{ marginTop: 4, fontSize: '0.8rem', color: '#9ca3af' }}>Not currently rostered</div>
              )}
            </div>
            <button onClick={onClose} style={{ background: '#f4f5f7', border: 'none', borderRadius: 6, color: '#6b7280', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px' }}>✕</button>
          </div>
        </div>

        {/* Event stream body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 20px' }}>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading…</div>}
          {!loading && events.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No history available.</div>}

          {!loading && events.length > 0 && (
            <div style={{ position: 'relative' }}>
              {/* Vertical timeline line */}
              <div style={{
                position: 'absolute', left: 15, top: 8, bottom: 8,
                width: 2, background: '#e2e6eb', borderRadius: 1,
              }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {events.map((ev, i) => {
                  if (ev.kind === 'txn') {
                    const t = ev.data
                    const meta = TXN_META[t.type] ?? { label: t.type, color: '#6b7280', icon: '·' }
                    const date = formatDate(t.transaction_date)
                    return (
                      <div key={`txn-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '6px 0' }}>
                        {/* Timeline dot */}
                        <div style={{
                          width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0, paddingTop: 1,
                        }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: meta.color, border: '2px solid #fff',
                            boxShadow: `0 0 0 2px ${meta.color}40`,
                            zIndex: 1,
                          }} />
                        </div>

                        {/* Event content */}
                        <div style={{ flex: 1, paddingBottom: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: meta.color }}>
                              {meta.label}
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>
                              {t.manager_name}
                            </span>
                            {t.price != null && (
                              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>${t.price}</span>
                            )}
                            {date && (
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>{date}</span>
                            )}
                          </div>
                          {t.note && (
                            <div style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: 1, fontStyle: 'italic' }}>{t.note}</div>
                          )}
                        </div>
                      </div>
                    )
                  }

                  // Roster slot card
                  const s = ev.data as RosterSlot
                  const style = SLOT_STYLES[s.slot_type] ?? { color: '#6b7280', bg: '#f4f5f7', label: s.slot_type, border: '#e2e6eb' }
                  const displaySalary = s.slot_type === 'dropped'
                    ? (s.dead_money ?? Math.ceil(s.salary / 2))
                    : s.salary

                  return (
                    <div key={`slot-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0' }}>
                      {/* Timeline node — year label */}
                      <div style={{ width: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          background: style.color, color: '#fff',
                          fontSize: '0.6rem', fontWeight: 800,
                          padding: '2px 4px', borderRadius: 4,
                          letterSpacing: '0.02em', lineHeight: 1.3,
                          textAlign: 'center', zIndex: 1,
                          minWidth: 30,
                        }}>
                          {s.year}
                        </div>
                      </div>

                      {/* Slot card */}
                      <div style={{
                        flex: 1,
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        borderRadius: 8,
                        padding: '8px 12px',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: style.color, minWidth: 38, letterSpacing: '0.04em' }}>
                          {style.label}
                        </span>
                        <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                          {s.manager_name}
                        </span>
                        <ServiceYearBadge year={s.service_year} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                          ${displaySalary}
                        </span>
                        {s.slot_type !== 'dropped' && (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                            KP ${getKeeperPrice(s.salary)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
