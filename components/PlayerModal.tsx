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

// Acquisition events — these START a stint
const ACQUISITION_TYPES = new Set(['claim', 'trade_receive', 'keeper', 'qualifying_offer'])
// Release events — these END a stint
const RELEASE_TYPES = new Set(['drop', 'trade_send'])

const TXN_LABELS: Record<string, string> = {
  claim:            'Picked up',
  drop:             'Dropped',
  trade_receive:    'Acquired via trade',
  trade_send:       'Traded away',
  keeper:           'Kept (Keeper)',
  qualifying_offer: 'Qualifying Offer',
}

const TXN_COLORS: Record<string, string> = {
  claim:            '#15803d',
  drop:             '#dc2626',
  trade_receive:    '#1d4ed8',
  trade_send:       '#d97706',
  keeper:           '#7c3aed',
  qualifying_offer: '#db2777',
}

function formatDate(d: string | null, short = false) {
  if (!d) return null
  try {
    const opts: Intl.DateTimeFormatOptions = short
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : { month: 'long', day: 'numeric', year: 'numeric' }
    return new Date(d).toLocaleDateString('en-US', opts)
  } catch { return null }
}

interface Stint {
  manager: string
  slot: RosterSlot | null       // roster slot for this stint's year (salary source of truth)
  acquiredTxn: Txn | null       // the transaction that started this stint
  releasedTxn: Txn | null       // the transaction that ended this stint (null = still active)
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
  // Transactions oldest-first
  const visibleTxns = (data?.transactions ?? [])
    .filter(t => !DEPARTED.has(t.manager_name))
    .sort((a, b) => {
      const da = a.transaction_date ? new Date(a.transaction_date).getTime() : a.year * 1e9
      const db = b.transaction_date ? new Date(b.transaction_date).getTime() : b.year * 1e9
      return da - db
    })

  // Build stints by walking acquisition → release pairs through transaction stream
  // Fall back to one stint per roster slot for years with no transaction data
  const stints: Stint[] = []

  // Slot lookup: by year+manager
  const slotKey = (year: number, mgr: string) => `${year}::${mgr}`
  const slotMap = new Map<string, RosterSlot>()
  for (const s of visibleSlots) slotMap.set(slotKey(s.year, s.manager_name), s)

  if (visibleTxns.length > 0) {
    let current: { manager: string; acquiredTxn: Txn } | null = null

    for (const txn of visibleTxns) {
      if (ACQUISITION_TYPES.has(txn.type)) {
        // Close any open stint with no release (shouldn't normally happen)
        if (current) {
          stints.push({
            manager: current.manager,
            slot: slotMap.get(slotKey(current.acquiredTxn.year, current.manager)) ?? null,
            acquiredTxn: current.acquiredTxn,
            releasedTxn: null,
          })
        }
        current = { manager: txn.manager_name, acquiredTxn: txn }
      } else if (RELEASE_TYPES.has(txn.type) && current) {
        stints.push({
          manager: current.manager,
          slot: slotMap.get(slotKey(current.acquiredTxn.year, current.manager)) ?? null,
          acquiredTxn: current.acquiredTxn,
          releasedTxn: txn,
        })
        current = null
      }
    }

    // Unclosed stint = currently active
    if (current) {
      stints.push({
        manager: current.manager,
        slot: slotMap.get(slotKey(current.acquiredTxn.year, current.manager)) ?? null,
        acquiredTxn: current.acquiredTxn,
        releasedTxn: null,
      })
    }
  }

  // Supplement: add roster slots that have no matching stint (years before transaction records)
  const coveredKeys = new Set(stints.map(st => st.slot ? slotKey(st.slot.year, st.slot.manager_name) : ''))
  const uncoveredSlots = visibleSlots.filter(s => !coveredKeys.has(slotKey(s.year, s.manager_name)))
  // Sort uncovered slots oldest-first and prepend
  const sortedUncovered = [...uncoveredSlots].sort((a, b) => a.year - b.year)
  const allStints: Stint[] = [
    ...sortedUncovered.map(s => ({ manager: s.manager_name, slot: s, acquiredTxn: null, releasedTxn: null })),
    ...stints,
  ]

  // Latest active slot for header
  const latestActive = [...visibleSlots].filter(s => s.slot_type !== 'dropped').sort((a, b) => b.year - a.year)[0]
  const isFranchise = latestActive?.is_franchise_player === true || (latestActive?.is_franchise_player as unknown as string) === 'true'

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(560px, 95vw)', maxHeight: '88vh',
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
              {!latestActive && !loading && visibleSlots.length > 0 && (
                <div style={{ marginTop: 4, fontSize: '0.8rem', color: '#9ca3af' }}>Not currently rostered</div>
              )}
            </div>
            <button onClick={onClose} style={{ background: '#f4f5f7', border: 'none', borderRadius: 6, color: '#6b7280', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 24px' }}>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading…</div>}
          {!loading && allStints.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No history available.</div>}

          {!loading && (
            <div style={{ position: 'relative' }}>
              {/* Vertical timeline line */}
              <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: '#e2e6eb', borderRadius: 1 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {allStints.map((stint, idx) => {
                  const slot = stint.slot
                  const slotType = slot?.slot_type ?? 'MLB'
                  const style = SLOT_STYLES[slotType] ?? SLOT_STYLES.MLB
                  const isActive = !stint.releasedTxn
                  const isDroppedSlot = slotType === 'dropped'
                  const displaySalary = isDroppedSlot
                    ? (slot?.dead_money ?? (slot ? Math.ceil(slot.salary / 2) : 0))
                    : (slot?.salary ?? '—')

                  const acqDate = stint.acquiredTxn?.transaction_date ? formatDate(stint.acquiredTxn.transaction_date, true) : null
                  const relDate = stint.releasedTxn?.transaction_date ? formatDate(stint.releasedTxn.transaction_date, true) : null
                  const year = stint.acquiredTxn?.year ?? slot?.year ?? '?'

                  // Build acquisition label
                  let acqLabel = ''
                  if (stint.acquiredTxn) {
                    if (stint.acquiredTxn.type === 'claim') acqLabel = 'Picked up'
                    else if (stint.acquiredTxn.type === 'trade_receive') acqLabel = 'Acquired via trade'
                    else if (stint.acquiredTxn.type === 'keeper') acqLabel = 'Kept'
                    else if (stint.acquiredTxn.type === 'qualifying_offer') acqLabel = 'QO'
                  } else {
                    // No transaction data — infer from context
                    acqLabel = isDroppedSlot ? 'Dropped' : 'Rostered'
                  }

                  return (
                    <div key={idx}>
                      {/* Year + stint card */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 4, paddingTop: idx === 0 ? 0 : 4 }}>
                        {/* Timeline node */}
                        <div style={{ width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0, paddingTop: 10 }}>
                          <div style={{
                            background: isActive ? style.color : '#9ca3af',
                            color: '#fff', fontSize: '0.58rem', fontWeight: 800,
                            padding: '2px 3px', borderRadius: 4,
                            letterSpacing: '0.02em', lineHeight: 1.4,
                            textAlign: 'center', zIndex: 1, minWidth: 30,
                          }}>
                            {year}
                          </div>
                        </div>

                        {/* Stint card */}
                        <div style={{
                          flex: 1,
                          background: style.bg,
                          border: `1px solid ${style.border}`,
                          borderRadius: 8,
                          padding: '9px 12px',
                        }}>
                          {/* Row 1: slot type, manager name, svc yr badge, salary, KP */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', color: style.color, minWidth: 38, letterSpacing: '0.04em' }}>
                              {style.label}
                            </span>
                            <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                              {stint.manager}
                            </span>
                            {slot && <ServiceYearBadge year={slot.service_year} />}
                            {slot && (
                              <span style={{ fontSize: '0.87rem', fontWeight: 700, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                                ${displaySalary}
                              </span>
                            )}
                            {slot && !isDroppedSlot && (
                              <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                                KP ${getKeeperPrice(slot.salary)}
                              </span>
                            )}
                          </div>

                          {/* Row 2: date range */}
                          <div style={{ marginTop: 4, fontSize: '0.75rem', color: '#6b7280' }}>
                            {acqLabel}
                            {acqDate && <span style={{ fontWeight: 500, color: '#374151' }}> {acqDate}</span>}
                            {relDate
                              ? <><span style={{ margin: '0 4px', color: '#d1d5db' }}>→</span><span style={{ fontWeight: 500, color: '#374151' }}>{relDate}</span></>
                              : isActive
                                ? <><span style={{ margin: '0 4px', color: '#d1d5db' }}>→</span><span style={{ fontWeight: 600, color: style.color }}>present</span></>
                                : null
                            }
                          </div>
                        </div>
                      </div>

                      {/* Release connector — shown between stints */}
                      {stint.releasedTxn && idx < allStints.length - 1 && (() => {
                        const rt = stint.releasedTxn
                        const color = TXN_COLORS[rt.type] ?? '#6b7280'
                        const label = TXN_LABELS[rt.type] ?? rt.type
                        const date = formatDate(rt.transaction_date, true)
                        // For drops, show dead money from the slot rather than txn price
                        const deadAmt = slot?.dead_money ?? (slot ? Math.ceil(slot.salary / 2) : null)
                        const priceDisplay = rt.type === 'drop' && deadAmt != null
                          ? `$${deadAmt} dead cap`
                          : null

                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
                            <div style={{ width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${color}40`, zIndex: 1 }} />
                            </div>
                            <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'baseline', fontSize: '0.78rem' }}>
                              <span style={{ fontWeight: 700, color }}>{label}</span>
                              {priceDisplay && <span style={{ color: '#9ca3af' }}>{priceDisplay}</span>}
                              {date && <span style={{ color: '#9ca3af', marginLeft: 'auto' }}>{date}</span>}
                            </div>
                          </div>
                        )
                      })()}
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
