'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import RosterSection from '@/components/RosterSection'
import PlayerModal from '@/components/PlayerModal'

interface Player {
  player_name: string; service_year: number; salary: number
  slot_type: string; is_franchise_player: boolean; dead_money?: number | null
}
interface BudgetTxn { amount: number; note: string | null; created_at: string }
interface Txn {
  id: string; type: string; price: number | null; transaction_date: string | null
  note: string | null; player_name: string | null; counterpart_name: string | null
}
interface TeamData {
  manager: { name: string; slug: string; id: string }
  roster: Player[]
  budget: { transactions: BudgetTxn[]; currentBudget: number }
  year: number
}

const TXN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  claim:            { label: 'ADD',    color: '#15803d', bg: '#f0fdf4' },
  drop:             { label: 'DROP',   color: '#dc2626', bg: '#fef2f2' },
  trade_receive:    { label: '→ IN',   color: '#1d4ed8', bg: '#eff6ff' },
  trade_send:       { label: '← OUT',  color: '#d97706', bg: '#fffbeb' },
  keeper:           { label: 'KEEP',   color: '#7c3aed', bg: '#f5f3ff' },
  qualifying_offer: { label: 'QO',     color: '#db2777', bg: '#fdf2f8' },
}

function TransactionsPane({ slug, year }: { slug: string; year: number }) {
  const [txns, setTxns] = useState<Txn[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setPage(0)
    fetch(`/api/transactions?manager=${slug}&year=${year}&page=0`)
      .then(r => r.json())
      .then(d => {
        const BOTTOM_TYPES = new Set(['keeper', 'qualifying_offer'])
        const sorted = [...(d.transactions ?? [])].sort((a: Txn, b: Txn) => {
          const aBot = BOTTOM_TYPES.has(a.type) ? 1 : 0
          const bBot = BOTTOM_TYPES.has(b.type) ? 1 : 0
          if (aBot !== bBot) return aBot - bBot
          // within each group keep reverse-chron
          return 0
        })
        setTxns(sorted)
        setTotal(d.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [slug, year])

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
  if (txns.length === 0) return <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No transactions recorded.</div>

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
        <thead>
          <tr style={{ background: '#f8f9fb' }}>
            {['Type','Player','$','Date','Note'].map(h => (
              <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e2e6eb' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {txns.map(t => {
            const meta = TXN_LABELS[t.type] ?? { label: t.type, color: '#6b7280', bg: '#f4f5f7' }
            const date = t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
            return (
              <tr key={t.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                <td style={{ padding: '5px 10px' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: meta.color, background: meta.bg, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em' }}>
                    {meta.label}
                  </span>
                </td>
                <td style={{ padding: '5px 10px', color: '#111827', fontWeight: 500 }}>
                  {t.player_name ?? '—'}
                  {t.counterpart_name && <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 400 }}> · {t.counterpart_name.split(' ')[0]}</span>}
                </td>
                <td style={{ padding: '5px 10px', color: '#374151', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {t.price != null ? `$${t.price}` : '—'}
                </td>
                <td style={{ padding: '5px 10px', color: '#9ca3af', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{date}</td>
                <td style={{ padding: '5px 10px', color: '#9ca3af', fontSize: '0.78rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note ?? ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {total > 50 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 14, borderTop: '1px solid #f0f2f5' }}>
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
            style={{ padding: '4px 14px', background: '#fff', border: '1px solid #e2e6eb', borderRadius: 5, color: '#374151', cursor: page===0?'not-allowed':'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
            ← Prev
          </button>
          <span style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#6b7280' }}>{page+1} of {Math.ceil(total/50)}</span>
          <button onClick={() => setPage(p => p+1)} disabled={(page+1)*50>=total}
            style={{ padding: '4px 14px', background: '#fff', border: '1px solid #e2e6eb', borderRadius: 5, color: '#374151', cursor: (page+1)*50>=total?'not-allowed':'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default function TeamPage() {
  const params = useParams()
  const slug = params.slug as string
  const [data, setData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [showBudget, setShowBudget] = useState(false)
  const [year, setYear] = useState(2026)
  const [activeTab, setActiveTab] = useState<'roster' | 'transactions'>('roster')

  const fetchTeam = useCallback(async (yr: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/team/${slug}?year=${yr}`)
      setData(await res.json())
    } finally { setLoading(false) }
  }, [slug])

  useEffect(() => { fetchTeam(year) }, [fetchTeam, year])

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>Loading…</div>
  if (!data) return <div style={{ textAlign: 'center', padding: 80, color: '#dc2626' }}>Team not found.</div>

  const { manager, roster, budget } = data
  const mlb = roster.filter(p => p.slot_type === 'MLB')
  const milb = roster.filter(p => p.slot_type === 'MiLB')
  const il = roster.filter(p => p.slot_type === 'IL')
  const dropped = roster.filter(p => p.slot_type === 'dropped')

  const activeSalary = [...mlb, ...milb, ...il].reduce((a, p) => a + p.salary, 0)
  const deadMoney = dropped.reduce((a, p) => a + (p.dead_money ?? Math.ceil(p.salary / 2)), 0)
  const totalSalary = activeSalary + deadMoney
  const capSpace = budget.currentBudget - totalSalary
  const capColor = capSpace <= 0 ? '#dc2626' : capSpace <= 5 ? '#d97706' : '#15803d'
  const availYears = [2026,2025,2024,2023,2022,2021,2020,2019]

  return (
    <div>
      <PlayerModal playerName={selectedPlayer} onClose={() => setSelectedPlayer(null)} />

      {/* Breadcrumb */}
      <div style={{ marginBottom: 16, fontSize: '0.8rem', color: '#9ca3af' }}>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>League</Link>
        <span style={{ margin: '0 6px', color: '#d1d5db' }}>›</span>
        <span style={{ color: '#374151', fontWeight: 500 }}>{manager.name}</span>
      </div>

      {/* Team header card */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              {manager.name}
            </h1>
            <div style={{ marginTop: 3, fontSize: '0.8rem', color: '#9ca3af' }}>{year} Season</div>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {availYears.map(yr => (
              <button key={yr} onClick={() => setYear(yr)} style={{
                padding: '4px 10px', borderRadius: 5, border: '1px solid',
                borderColor: yr === year ? '#1d4ed8' : '#e2e6eb',
                background: yr === year ? '#eff6ff' : '#fff',
                color: yr === year ? '#1d4ed8' : '#6b7280',
                cursor: 'pointer', fontSize: '0.75rem',
                fontWeight: yr === year ? 700 : 400,
              }}>{yr}</button>
            ))}
          </div>
        </div>

        {/* Hero numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#e2e6eb', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          {[
            { label: 'Budget', value: `$${budget.currentBudget}`, color: '#111827', bg: '#fff' },
            { label: 'Salary', value: `$${totalSalary}`, color: '#374151', bg: '#fff' },
            { label: 'Cap Space', value: `$${capSpace}`, color: capColor, bg: capSpace <= 0 ? '#fef2f2' : capSpace <= 5 ? '#fffbeb' : '#f0fdf4' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, padding: '14px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Secondary stats row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Active $', value: `$${activeSalary}`, color: '#374151' },
            { label: 'Dead $', value: `$${deadMoney}`, color: deadMoney > 0 ? '#dc2626' : '#9ca3af' },
            { label: 'IL', value: String(il.length), color: '#d97706' },
            { label: 'Drops', value: String(dropped.length), color: '#dc2626' },
            { label: 'HT-Elig', value: String([...mlb,...milb,...il].filter(p => p.service_year >= 1).length), color: '#15803d' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 4, padding: '4px 10px', background: '#f4f5f7', border: '1px solid #e2e6eb', borderRadius: 5 }}>
              <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            </div>
          ))}
          <button onClick={() => setShowBudget(b => !b)} style={{
            marginLeft: 'auto', padding: '5px 14px',
            background: showBudget ? '#eff6ff' : '#fff',
            border: `1px solid ${showBudget ? '#1d4ed8' : '#e2e6eb'}`,
            borderRadius: 6, color: showBudget ? '#1d4ed8' : '#6b7280',
            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500,
          }}>
            Budget Ledger
          </button>
        </div>

        {/* Budget ledger */}
        {showBudget && (
          <div style={{ marginTop: 14, background: '#f8f9fb', borderRadius: 7, padding: '12px 16px', border: '1px solid #e2e6eb' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 10 }}>
              Budget Ledger — {year}
            </div>
            {budget.transactions.length === 0
              ? <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No entries.</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
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

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e6eb', marginBottom: 0 }}>
        {(['roster','transactions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 18px', background: 'none', border: 'none',
            borderBottom: `2px solid ${activeTab === tab ? '#1d4ed8' : 'transparent'}`,
            marginBottom: -2,
            color: activeTab === tab ? '#1d4ed8' : '#6b7280',
            cursor: 'pointer', fontWeight: activeTab === tab ? 700 : 500,
            fontSize: '0.83rem', transition: 'color 0.15s', textTransform: 'capitalize',
          }}>
            {tab === 'roster' ? 'Roster' : 'Transactions'}
          </button>
        ))}
      </div>

      {activeTab === 'roster' && (
        <div className="card" style={{ overflow: 'hidden', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <RosterSection title={`Major League (${mlb.length})`} players={mlb} accentColor="#15803d" defaultOpen onPlayerClick={setSelectedPlayer} />
          <RosterSection title={`Minor League (${milb.length})`} players={milb} accentColor="#1d4ed8" defaultOpen onPlayerClick={setSelectedPlayer} />
          <RosterSection title={`Injured List (${il.length})`} players={il} accentColor="#d97706" defaultOpen onPlayerClick={setSelectedPlayer} />
          <RosterSection title={`Dropped — $${deadMoney} dead cap (${dropped.length})`} players={dropped} accentColor="#dc2626" defaultOpen onPlayerClick={setSelectedPlayer} />
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card" style={{ overflow: 'hidden', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <TransactionsPane slug={slug} year={year} />
        </div>
      )}

      <p style={{ marginTop: 10, fontSize: '0.72rem', color: '#9ca3af', textAlign: 'center' }}>
        Click any player to see their full roster history
      </p>
    </div>
  )
}
