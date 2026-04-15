'use client'
import { useEffect, useState, useCallback } from 'react'
import { getKeeperPrice, getServiceYearColor } from '@/lib/constants'
import ServiceYearBadge from './ServiceYearBadge'

interface RosterSlot {
  year: number
  slot_type: string
  service_year: number
  salary: number
  dead_money?: number | null
  is_franchise_player: boolean
  manager_name: string
  manager_slug: string
}

interface Props {
  playerName: string | null
  onClose: () => void
}

// Managers no longer in the league — hide from history
const DEPARTED = new Set(['Brendan Prin', 'Josh Meyerchick', 'Tom Gieryn'])

const SLOT_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  MLB:     { color: '#15803d', bg: '#f0fdf4', label: 'MLB' },
  MiLB:    { color: '#1d4ed8', bg: '#eff6ff', label: 'MiLB' },
  IL:      { color: '#d97706', bg: '#fffbeb', label: 'IL' },
  dropped: { color: '#dc2626', bg: '#fef2f2', label: 'Dropped' },
}

export default function PlayerModal({ playerName, onClose }: Props) {
  const [data, setData] = useState<{ slots: RosterSlot[] } | null>(null)
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

  // Filter departed managers and group by year
  const visibleSlots = (data?.slots ?? []).filter(s => !DEPARTED.has(s.manager_name))
  const years = [...new Set(visibleSlots.map(s => s.year))].sort((a, b) => b - a)
  const byYear = Object.fromEntries(years.map(y => [y, visibleSlots.filter(s => s.year === y)]))

  // Latest active slot for header info
  const latestActive = visibleSlots.find(s => s.slot_type !== 'dropped')
  const latest = visibleSlots[0]

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        zIndex: 100, backdropFilter: 'blur(3px)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(520px, 95vw)', maxHeight: '85vh',
        background: '#fff', border: '1px solid #e2e6eb',
        borderRadius: 12, zIndex: 101,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid #f0f2f5' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                {playerName}
              </h2>
              {latest && !loading && (
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <ServiceYearBadge year={latest.service_year} size="md" />
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Yr {latest.service_year}
                  </span>
                  {latestActive && <>
                    <span style={{ color: '#d1d5db' }}>·</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>${latestActive.salary}</span>
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
            <button onClick={onClose} style={{
              background: '#f4f5f7', border: 'none', borderRadius: 6,
              color: '#6b7280', cursor: 'pointer', fontSize: '1rem',
              padding: '4px 8px', lineHeight: 1,
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '14px 20px 20px' }}>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading…</div>}
          {!loading && years.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No history available.</div>
          )}

          {!loading && years.map(year => (
            <div key={year} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 5 }}>
                {year}
              </div>
              {byYear[year].map((slot, i) => {
                const style = SLOT_STYLES[slot.slot_type] ?? { color: '#6b7280', bg: '#f4f5f7', label: slot.slot_type }
                const displaySalary = slot.slot_type === 'dropped'
                  ? (slot.dead_money ?? Math.ceil(slot.salary / 2))
                  : slot.salary
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 7, marginBottom: 4,
                    background: style.bg,
                    border: `1px solid ${style.color}22`,
                  }}>
                    {/* Slot badge */}
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                      color: style.color, minWidth: 42, letterSpacing: '0.04em',
                    }}>
                      {style.label}
                    </span>

                    {/* Manager name — prominent */}
                    <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                      {slot.manager_name}
                    </span>

                    <ServiceYearBadge year={slot.service_year} />

                    <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#374151', minWidth: 30, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      ${displaySalary}
                    </span>

                    {slot.slot_type !== 'dropped' && (
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', minWidth: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        KP ${getKeeperPrice(slot.salary)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
