'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import RosterSection from '@/components/RosterSection'


interface Player {
  player_name: string; service_year: number; salary: number
  slot_type: string; is_franchise_player: boolean; dead_money?: number | null
}
interface BudgetTxn { amount: number; note: string | null; created_at: string }
interface KeeperTxn { delta: number; note: string | null; created_at: string }
interface Note { id: string; note: string; created_at: string }
interface TeamData {
  manager: { name: string; slug: string; id: string }
  roster: Player[]
  budget: { transactions: BudgetTxn[]; currentBudget: number }
  keeperSlots: { transactions: KeeperTxn[]; current: number }
  notes: Note[]
  year: number
}

export default function TeamPage() {
  const params = useParams()
  const slug = params.slug as string
  const [data, setData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBudget, setShowBudget] = useState(false)
  const [year, setYear] = useState(2026)

  const fetchTeam = useCallback(async (yr: number) => {
    setLoading(true)
    try { setData(await (await fetch(`/api/team/${slug}?year=${yr}`)).json()) }
    finally { setLoading(false) }
  }, [slug])

  useEffect(() => { fetchTeam(year) }, [fetchTeam, year])

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>Loading…</div>
  if (!data) return <div style={{ textAlign: 'center', padding: 80, color: '#dc2626' }}>Team not found.</div>

  const { manager, roster, budget, keeperSlots, notes } = data
  const mlb     = roster.filter(p => p.slot_type === 'MLB')
  const milb    = roster.filter(p => p.slot_type === 'MiLB')
  const il      = roster.filter(p => p.slot_type === 'IL')
  const dropped = roster.filter(p => p.slot_type === 'dropped')

  const activeSalary = [...mlb, ...milb, ...il].reduce((a, p) => a + p.salary, 0)
  const deadMoney    = dropped.reduce((a, p) => a + (p.dead_money ?? Math.ceil(p.salary / 2)), 0)
  const totalSalary  = activeSalary + deadMoney
  const capSpace     = budget.currentBudget - totalSalary
  const capColor     = capSpace <= 0 ? '#dc2626' : capSpace <= 5 ? '#d97706' : '#15803d'
  const availYears   = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019]

  return (
    <div>

      {/* Breadcrumb */}
      <div style={{ marginBottom: 14, fontSize: '0.8rem', color: '#9ca3af' }}>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>League</Link>
        <span style={{ margin: '0 6px', color: '#d1d5db' }}>›</span>
        <span style={{ color: '#374151', fontWeight: 500 }}>{manager.name}</span>
      </div>

      {/* Team header card */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{manager.name}</h1>
            <div style={{ marginTop: 2, fontSize: '0.8rem', color: '#9ca3af' }}>{year} Season</div>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {availYears.map(yr => (
              <button key={yr} onClick={() => setYear(yr)} style={{
                padding: '4px 10px', borderRadius: 5, border: '1px solid',
                borderColor: yr === year ? '#1d4ed8' : '#e2e6eb',
                background: yr === year ? '#eff6ff' : '#fff',
                color: yr === year ? '#1d4ed8' : '#6b7280',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: yr === year ? 700 : 400,
              }}>{yr}</button>
            ))}
          </div>
        </div>

        {/* Hero numbers — Budget, Salary, Cap Space */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#e2e6eb', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
          {[
            { label: 'Budget',    value: `$${budget.currentBudget}`, color: '#111827', bg: '#fff' },
            { label: 'Salary',    value: `$${totalSalary}`,          color: '#374151', bg: '#fff' },
            { label: 'Cap Space', value: `$${capSpace}`,             color: capColor,
              bg: capSpace <= 0 ? '#fef2f2' : capSpace <= 5 ? '#fffbeb' : '#f0fdf4' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, padding: '12px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Secondary stats row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Active $',     value: `$${activeSalary}`, color: '#374151' },
            { label: 'Dead $',       value: `$${deadMoney}`,    color: deadMoney > 0 ? '#dc2626' : '#9ca3af' },
            { label: 'IL',           value: String(il.length),  color: '#d97706' },
            { label: 'Drops',        value: String(dropped.length), color: '#dc2626' },
            { label: 'HT-Elig',      value: String([...mlb,...milb,...il].filter(p => p.service_year >= 1).length), color: '#15803d' },
            { label: 'Keeper Slots', value: String(keeperSlots.current), color: keeperSlots.current === 0 ? '#dc2626' : '#1d4ed8' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 4, padding: '4px 10px', background: '#f4f5f7', border: '1px solid #e2e6eb', borderRadius: 5 }}>
              <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            </div>
          ))}
          <button onClick={() => setShowBudget(b => !b)} style={{
            marginLeft: 'auto', padding: '5px 12px',
            background: showBudget ? '#eff6ff' : '#fff',
            border: `1px solid ${showBudget ? '#1d4ed8' : '#e2e6eb'}`,
            borderRadius: 6, color: showBudget ? '#1d4ed8' : '#6b7280',
            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500,
          }}>
            Budget Ledger
          </button>
        </div>

        {/* Notes */}
        {notes.length > 0 && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#92400e', marginBottom: 6 }}>
              📝 Notes
            </div>
            {notes.map((n, i) => (
              <div key={n.id} style={{ fontSize: '0.83rem', color: '#374151', lineHeight: 1.5, borderTop: i > 0 ? '1px solid #fde68a' : 'none', paddingTop: i > 0 ? 5 : 0, marginTop: i > 0 ? 5 : 0 }}>
                {n.note}
              </div>
            ))}
          </div>
        )}

        {/* Budget ledger */}
        {showBudget && (
          <div style={{ marginTop: 12, background: '#f8f9fb', borderRadius: 7, padding: '12px 16px', border: '1px solid #e2e6eb' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 8 }}>
              Budget Ledger — {year}
            </div>
            {budget.transactions.length === 0
              ? <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No entries.</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {budget.transactions.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.83rem', fontWeight: 700, minWidth: 52, color: t.amount >= 0 ? '#15803d' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                        {t.amount >= 0 ? '+' : ''}{t.amount}
                      </span>
                      <span style={{ fontSize: '0.83rem', color: '#374151', flex: 1 }}>{t.note ?? ''}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #e2e6eb', marginTop: 4, paddingTop: 8, display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, minWidth: 52, color: '#111827' }}>${budget.currentBudget}</span>
                    <span style={{ fontSize: '0.83rem', color: '#9ca3af' }}>Total budget</span>
                  </div>
                </div>
              )
            }
          </div>
        )}
      </div>

      {/* Roster card */}
      <div className="card" style={{ overflow: 'hidden' }}>
      </div>

      <p style={{ marginTop: 10, fontSize: '0.72rem', color: '#9ca3af', textAlign: 'center' }}>
        Click any player to see their full roster history
      </p>
    </div>
  )
}
