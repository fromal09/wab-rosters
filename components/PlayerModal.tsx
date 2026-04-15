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
  managers?: { name: string; slug: string }
}

interface Props {
  playerName: string | null
  onClose: () => void
}

const SLOT_COLOR: Record<string, string> = {
  MLB: '#3ecf8e',
  MiLB: '#4f7ef0',
  IL: '#f0c040',
  dropped: '#f0614f',
}

export default function PlayerModal({ playerName, onClose }: Props) {
  const [data, setData] = useState<{ slots: RosterSlot[]; transactions: unknown[] } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (name: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/player?name=${encodeURIComponent(name)}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (playerName) {
      setData(null)
      fetchData(playerName)
    }
  }, [playerName, fetchData])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!playerName) return null

  // Group slots by year
  const slotsByYear = data?.slots.reduce((acc: Record<number, RosterSlot[]>, s: RosterSlot) => {
    ;(acc[s.year] = acc[s.year] || []).push(s)
    return acc
  }, {})

  const years = slotsByYear ? Object.keys(slotsByYear).map(Number).sort((a, b) => b - a) : []

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 100, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(540px, 95vw)',
          maxHeight: '85vh',
          background: '#1a1d27',
          border: '1px solid #2e3347',
          borderRadius: 12,
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #2e3347', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {playerName}
              </h2>
              {data && data.slots.length > 0 && (() => {
                const latest = data.slots.reduce((a: RosterSlot, b: RosterSlot) => a.year > b.year ? a : b)
                return (
                  <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ServiceYearBadge year={latest.service_year} size="md" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Yr {latest.service_year} · ${latest.salary} · KP ${getKeeperPrice(latest.salary)}
                    </span>
                    {latest.is_franchise_player && (
                      <span style={{ fontSize: '0.7rem', color: '#4f7ef0', fontWeight: 600 }}>
                        ★ Franchise
                      </span>
                    )}
                  </div>
                )
              })()}
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 20px 20px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</div>
          )}

          {!loading && data && years.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No history found.</div>
          )}

          {!loading && data && years.map(year => (
            <div key={year} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>
                {year}
              </div>
              {slotsByYear![year].map((slot, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 10px',
                    background: '#1e2235',
                    borderRadius: 6,
                    marginBottom: 4,
                    borderLeft: `3px solid ${SLOT_COLOR[slot.slot_type] ?? '#555'}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: SLOT_COLOR[slot.slot_type] ?? 'var(--text-muted)',
                      minWidth: 36,
                    }}
                  >
                    {slot.slot_type}
                  </span>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)', flex: 1 }}>
                    {(slot.managers as { name: string } | undefined)?.name ?? '—'}
                  </span>
                  <ServiceYearBadge year={slot.service_year} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: 30, textAlign: 'right' }}>
                    ${slot.slot_type === 'dropped' ? (slot.dead_money ?? Math.ceil(slot.salary / 2)) : slot.salary}
                  </span>
                  {slot.slot_type !== 'dropped' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 30, textAlign: 'right' }}>
                      KP ${getKeeperPrice(slot.salary)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
