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

const SLOT_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  MLB:     { color: '#15803d', bg: '#f0fdf4', label: 'MLB' },
  MiLB:    { color: '#1d4ed8', bg: '#eff6ff', label: 'MiLB' },
  IL:      { color: '#d97706', bg: '#fffbeb', label: 'IL' },
  dropped: { color: '#dc2626', bg: '#fef2f2', label: 'Dropped' },
}

const TXN_META: Record<string, { label: string; color: string }> = {
  claim:            { label: 'Picked up',     color: '#15803d' },
  drop:             { label: 'Dropped',       color: '#dc2626' },
  trade_receive:    { label: 'Acquired via trade', color: '#1d4ed8' },
  trade_send:       { label: 'Traded away',   color: '#d97706' },
  keeper:           { label: 'Kept (Keeper)', color: '#7c3aed' },
  qualifying_offer: { label: 'QO',            color: '#db2777' },
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

  // Group by year, interleave roster slots + transactions
  const years = [...new Set([
    ...visibleSlots.map(s => s.year),
    ...visibleTxns.map(t => t.year),
  ])].sort((a, b) => b - a)

  const slotsByYear = Object.fromEntries(years.map(y => [y, visibleSlots.filter(s => s.year === y)]))
  const txnsByYear = Object.fromEntries(years.map(y => [y, visibleTxns.filter(t => t.year === y)]))

  const latestActive = visibleSlots.find(s => s.slot_type !== 'dropped')
  const latest = visibleSlots[0]

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(540px, 95vw)', maxHeight: '85vh',
        background: '#fff', border: '1px solid #e2e6eb', borderRadius: 12,
        zIndex: 101, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0f2f5' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                {playerName}
              </h2>
              {latest && !loading && (
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <ServiceYearBadge year={latest.service_year} size="md" />
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Yr {latest.service_year}</span>
                  {latestActive && <>
                    <span style={{ color: '#d1d5db' }}>·</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>${latestActive.salary}</span>
                    <span style={{ color: '#d1d5db' }}>·</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>KP ${getKeeperPrice(latestActive.salary)}</span>
                    {latestActive.is_franchise_player && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', padding: '1px 6px', borderRadius: 4 }}>
                        ★ Franchise
                      </span>
                    )}
                  </>}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: '#f4f5f7', border: 'none', borderRadius: 6, color: '#6b7280', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '14px 20px 20px' }}>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading…</div>}
          {!loading && years.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No history available.</div>}

          {!loading && years.map(year => {
            const slots = slotsByYear[year] ?? []
            const txns = txnsByYear[year] ?? []
            if (slots.length === 0 && txns.length === 0) return null

            return (
              <div key={year} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 6 }}>
                  {year}
                </div>

                {/* Roster slots */}
                {slots.map((slot, i) => {
                  const style = SLOT_STYLES[slot.slot_type] ?? { color: '#6b7280', bg: '#f4f5f7', label: slot.slot_type }
                  const displaySalary = slot.slot_type === 'dropped'
                    ? (slot.dead_money ?? Math.ceil(slot.salary / 2))
                    : slot.salary
                  return (
                    <div key={`slot-${i}`} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 7, marginBottom: 4,
                      background: style.bg, border: `1px solid ${style.color}22`,
                    }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: style.color, minWidth: 42, letterSpacing: '0.04em' }}>
                        {style.label}
                      </span>
                      <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                        {slot.manager_name}
                      </span>
                      <ServiceYearBadge year={slot.service_year} />
                      <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#374151', minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        ${displaySalary}
                      </span>
                      {slot.slot_type !== 'dropped' && (
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', minWidth: 42, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          KP ${getKeeperPrice(slot.salary)}
                        </span>
                      )}
                    </div>
                  )
                })}

                {/* Transactions for this year */}
                {txns.length > 0 && (
                  <div style={{ marginTop: slots.length > 0 ? 6 : 0, paddingLeft: 4, borderLeft: '2px solid #e2e6eb', marginLeft: 2 }}>
                    {txns.map((t, i) => {
                      const meta = TXN_META[t.type] ?? { label: t.type, color: '#6b7280' }
                      const date = formatDate(t.transaction_date)
                      return (
                        <div key={`txn-${i}`} style={{
                          display: 'flex', alignItems: 'baseline', gap: 8,
                          padding: '3px 10px', fontSize: '0.78rem', color: '#6b7280',
                        }}>
                          <span style={{ fontWeight: 700, color: meta.color, minWidth: 120, flexShrink: 0 }}>
                            {meta.label}
                          </span>
                          {t.price != null && <span style={{ color: '#374151', fontWeight: 600 }}>${t.price}</span>}
                          {date && <span style={{ color: '#9ca3af', fontSize: '0.73rem' }}>{date}</span>}
                          {t.note && <span style={{ color: '#9ca3af', fontSize: '0.73rem', fontStyle: 'italic' }}>{t.note}</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
