'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import RosterSection from '@/components/RosterSection'

interface Player {
  player_name: string; service_year: number; salary: number
  slot_type: string; is_franchise_player: boolean; dead_money?: number | null; position?: string | null
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
  const capColor     = capSpace <= 0 ? '#b91c1c' : capSpace <= 5 ? '#b45309' : '#166534'
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
      <div className="card" style={{ padding: '16px 20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f1117', letterSpacing: '-0.02em' }}>{manager.name}</h1>
            <div style={{ marginTop: 2, fontSize: '0.78rem', color: '#9ca3af' }}>{year} Season</div>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {availYears.map(yr => (
              <button key={yr} onClick={() => setYear(yr)} style={{
                padding: '4px 9px', borderRadius: 5, border: '1px solid',
                borderColor: yr === year ? '#1a56db' : '#e4e7ec',
                background: yr === year ? '#ebf0fd' : '#fff',
                color: yr === year ? '#1a56db' : '#6b7280',
                cursor: 'pointer', fontSize: '0.73rem', fontWeight: yr === year ? 700 : 400,
              }}>{yr}</button>
            ))}
          </div>
        </div>

        {/* Hero numbers — 4 boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#e4e7ec', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          {[
            { label: 'Budget',    value: `$${budget.currentBudget}`,    color: '#0f1117', bg: '#fff' },
            { label: 'Salary',    value: `$${totalSalary}`,             color: '#374151', bg: '#fff' },
            { label: 'Cap Space', value: `$${capSpace}`,                color: capColor,
              bg: capSpace <= 0 ? '#fef2f2' : capSpace <= 5 ? '#fffbeb' : '#f0fdf4' },
            { label: 'Keeper Slots', value: String(keeperSlots.current),
              color: keeperSlots.current === 0 ? '#b91c1c' : '#1a56db', bg: '#fff' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Secondary stats */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Active $', value: `$${activeSalary}`, color: '#374151' },
            { label: 'Dead $',   value: `$${deadMoney}`,   color: deadMoney > 0 ? '#b91c1c' : '#9ca3af' },
            { label: 'IL',       value: String(il.length), color: '#b45309' },
            { label: 'Drops',    value: String(dropped.length), color: '#b91c1c' },
            { label: 'HT-Elig',  value: String([...mlb,...milb,...il].filter(p => p.service_year >= 1).length), color: '#166534' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 3, padding: '3px 8px', background: '#f6f7f9', border: '1px solid #e4e7ec', borderRadius: 4 }}>
              <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            </div>
          ))}
          <button onClick={() => setShowBudget(b => !b)} style={{
            marginLeft: 'auto', padding: '4px 10px',
            background: showBudget ? '#ebf0fd' : '#fff',
            border: `1px solid ${showBudget ? '#1a56db' : '#e4e7ec'}`,
            borderRadius: 5, color: showBudget ? '#1a56db' : '#6b7280',
            cursor: 'pointer', fontSize: '0.76rem', fontWeight: 500,
          }}>
            Budget Ledger
          </button>
        </div>

        {/* Notes */}
        {notes.length > 0 && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#92400e', marginBottom: 5 }}>📝 Notes</div>
            {notes.map((n, i) => (
              <div key={n.id} style={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.5, borderTop: i > 0 ? '1px solid #fde68a' : 'none', paddingTop: i > 0 ? 4 : 0, marginTop: i > 0 ? 4 : 0 }}>
                {n.note}
              </div>
            ))}
          </div>
        )}

        {/* Budget ledger */}
        {showBudget && (
          <div style={{ marginTop: 10, background: '#f6f7f9', borderRadius: 6, padding: '10px 14px', border: '1px solid #e4e7ec' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 7 }}>
              Budget Ledger — {year}
            </div>
            {budget.transactions.length === 0
              ? <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No entries.</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {budget.transactions.map((t, i) => {
                    const isMarker = t.amount === 0 && t.note?.includes('STARTING BUDGET')
                    if (isMarker) return (
                      <div key={i} style={{
                        margin: '3px 0', padding: '6px 10px',
                        background: '#1a56db', borderRadius: 5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', letterSpacing: '0.03em', textAlign: 'center' }}>
                          {t.note}
                        </span>
                      </div>
                    )
                    return (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '1px 0' }}>
                        <span style={{ fontSize: '0.81rem', fontWeight: 700, minWidth: 46, color: t.amount > 0 ? '#166534' : '#b91c1c', fontVariantNumeric: 'tabular-nums' }}>
                          {t.amount > 0 ? '+' : ''}{t.amount}
                        </span>
                        <span style={{ fontSize: '0.81rem', color: '#374151', flex: 1 }}>{t.note ?? ''}</span>
                      </div>
                    )
                  })}
                  <div style={{ borderTop: '1px solid #e4e7ec', marginTop: 4, paddingTop: 6, display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, minWidth: 46, color: '#0f1117' }}>${budget.currentBudget}</span>
                    <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Current budget</span>
                  </div>
                </div>
              )
            }
          </div>
        )}
      </div>

      {/* Roster */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <RosterSection showFilter title={`Major League (${mlb.length})`}  players={mlb}     accentColor="#166534" defaultOpen />
        <RosterSection showFilter title={`Minor League (${milb.length})`} players={milb}    accentColor="#1a56db" defaultOpen />
        <RosterSection showFilter title={`Injured List (${il.length})`}   players={il}      accentColor="#b45309" defaultOpen />
        <RosterSection title={`Dropped — $${deadMoney} dead (${dropped.length})`} players={dropped} accentColor="#b91c1c" defaultOpen />
      </div>
    </div>
  )
}
