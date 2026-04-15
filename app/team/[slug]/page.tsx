'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import RosterSection from '@/components/RosterSection'
import PlayerModal from '@/components/PlayerModal'
import { getKeeperPrice } from '@/lib/constants'

interface Player {
  player_name: string
  service_year: number
  salary: number
  slot_type: string
  is_franchise_player: boolean
  dead_money?: number | null
}

interface BudgetTxn {
  amount: number
  note: string | null
  created_at: string
}

interface Txn {
  id: string
  type: string
  price: number | null
  transaction_date: string | null
  note: string | null
  player_name: string | null
  counterpart_name: string | null
}

interface TeamData {
  manager: { name: string; slug: string; id: string }
  roster: Player[]
  budget: { transactions: BudgetTxn[]; currentBudget: number }
  year: number
}

const TXN_LABELS: Record<string, { label: string; color: string }> = {
  claim:         { label: 'ADD',   color: '#3ecf8e' },
  drop:          { label: 'DROP',  color: '#f0614f' },
  trade_receive: { label: '→ IN',  color: '#4f7ef0' },
  trade_send:    { label: '← OUT', color: '#f0c040' },
  keeper:        { label: 'KEEP',  color: '#8b5cf6' },
  qualifying_offer: { label: 'QO', color: '#ec4899' },
}

function TransactionsPane({ slug, year }: { slug: string; year: number }) {
  const [txns, setTxns] = useState<Txn[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/transactions?manager=${slug}&year=${year}&page=${page}`)
      .then(r => r.json())
      .then(d => { setTxns(d.transactions ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [slug, year, page])

  if (loading) return <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>Loading…</div>
  if (txns.length === 0) return <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>No transactions recorded.</div>

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
        <thead>
          <tr style={{ background: '#1e2235' }}>
            {['Type','Player','$','Date','Note'].map(h => (
              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {txns.map(t => {
            const meta = TXN_LABELS[t.type] ?? { label: t.type.toUpperCase(), color: 'var(--text-muted)' }
            const date = t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
            return (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(46,51,71,0.4)' }}>
                <td style={{ padding: '5px 10px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: meta.color, letterSpacing: '0.04em' }}>{meta.label}</span>
                </td>
                <td style={{ padding: '5px 10px', color: 'var(--text-primary)' }}>
                  {t.player_name ?? '—'}
                  {t.counterpart_name && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> · {t.counterpart_name.split(' ')[0]}</span>}
                </td>
                <td style={{ padding: '5px 10px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                  {t.price != null ? `$${t.price}` : '—'}
                </td>
                <td style={{ padding: '5px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{date}</td>
                <td style={{ padding: '5px 10px', color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note ?? ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {total > 50 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
            style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #2e3347', borderRadius: 5, color: 'var(--text-muted)', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>
            ← Prev
          </button>
          <span style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{page + 1} of {Math.ceil(total / 50)}</span>
          <button onClick={() => setPage(p => p+1)} disabled={(page+1)*50 >= total}
            style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #2e3347', borderRadius: 5, color: 'var(--text-muted)', cursor: (page+1)*50 >= total ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>
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
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchTeam(year) }, [fetchTeam, year])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Loading…</div>
  )
  if (!data) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--red)' }}>Team not found.</div>
  )

  const { manager, roster, budget } = data
  const mlb = roster.filter(p => p.slot_type === 'MLB')
  const milb = roster.filter(p => p.slot_type === 'MiLB')
  const il = roster.filter(p => p.slot_type === 'IL')
  const dropped = roster.filter(p => p.slot_type === 'dropped')

  const activeSalary = [...mlb, ...milb, ...il].reduce((a, p) => a + p.salary, 0)
  const deadMoney = dropped.reduce((a, p) => a + (p.dead_money ?? Math.ceil(p.salary / 2)), 0)
  const totalSalary = activeSalary + deadMoney
  const capSpace = budget.currentBudget - totalSalary
  const capColor = capSpace <= 0 ? '#f0614f' : capSpace <= 5 ? '#f0c040' : '#3ecf8e'

  const availYears = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019]

  return (
    <div>
      <PlayerModal playerName={selectedPlayer} onClose={() => setSelectedPlayer(null)} />

      {/* Breadcrumb */}
      <div style={{ marginBottom: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>League</Link>
        <span style={{ margin: '0 6px' }}>›</span>
        <span style={{ color: 'var(--text-secondary)' }}>{manager.name}</span>
      </div>

      {/* Team header */}
      <div
        style={{
          background: '#1a1d27',
          border: '1px solid #2e3347',
          borderRadius: 10,
          padding: '18px 20px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {manager.name}
            </h1>
            <div style={{ marginTop: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {year} Season
            </div>
          </div>

          {/* Year selector */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {availYears.map(yr => (
              <button
                key={yr}
                onClick={() => setYear(yr)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 5,
                  border: '1px solid',
                  borderColor: yr === year ? '#4f7ef0' : '#2e3347',
                  background: yr === year ? 'rgba(79,126,240,0.15)' : 'transparent',
                  color: yr === year ? '#4f7ef0' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: yr === year ? 700 : 400,
                }}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Budget', value: `$${budget.currentBudget}`, color: 'var(--text-primary)' },
            { label: 'Salary', value: `$${totalSalary}`, color: 'var(--text-secondary)' },
            { label: 'Cap Space', value: `$${capSpace}`, color: capColor },
            { label: 'Active $', value: `$${activeSalary}`, color: 'var(--text-muted)' },
            { label: 'Dead $', value: `$${deadMoney}`, color: deadMoney > 0 ? '#f0614f' : 'var(--text-muted)' },
            { label: 'IL', value: String(il.length), color: '#f0c040' },
            { label: 'Drops', value: String(dropped.length), color: '#f0614f' },
            { label: 'HT-Elig', value: String([...mlb, ...milb, ...il].filter(p => p.service_year >= 1).length), color: '#3ecf8e' },
          ].map(s => (
            <div key={s.label} className="stat-pill">
              <span className="label">{s.label}</span>
              <span className="value" style={{ color: s.color, fontSize: '0.95rem' }}>{s.value}</span>
            </div>
          ))}

          <button
            onClick={() => setShowBudget(b => !b)}
            style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              background: showBudget ? 'rgba(79,126,240,0.15)' : 'transparent',
              border: '1px solid',
              borderColor: showBudget ? '#4f7ef0' : '#2e3347',
              borderRadius: 6,
              color: showBudget ? '#4f7ef0' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 500,
            }}
          >
            Budget Ledger
          </button>
        </div>

        {/* Budget ledger */}
        {showBudget && (
          <div style={{ marginTop: 14, background: '#13161f', borderRadius: 7, padding: '10px 14px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
              Budget Ledger — {year}
            </div>
            {budget.transactions.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No entries.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {budget.transactions.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        minWidth: 52,
                        color: t.amount >= 0 ? '#3ecf8e' : '#f0614f',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {t.amount >= 0 ? '+' : ''}{t.amount}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1 }}>
                      {t.note ?? ''}
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #2e3347', marginTop: 6, paddingTop: 6, display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: 52, color: 'var(--text-primary)' }}>
                    ${budget.currentBudget}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total budget</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
        {(['roster', 'transactions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 18px', background: 'none', border: 'none',
            borderBottom: `2px solid ${activeTab === tab ? '#4f7ef0' : 'transparent'}`,
            color: activeTab === tab ? '#4f7ef0' : 'var(--text-muted)',
            cursor: 'pointer', fontWeight: activeTab === tab ? 700 : 400,
            fontSize: '0.83rem', marginBottom: -1, transition: 'color 0.15s', textTransform: 'capitalize',
          }}>
            {tab === 'roster' ? `Roster` : `Transactions`}
          </button>
        ))}
      </div>

      {activeTab === 'roster' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '6px 10px 6px 16px', borderBottom: '1px solid var(--border)', background: '#161920' }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>Player</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 44, textAlign: 'center' }}>Yr</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 60, textAlign: 'right' }}>$</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 60, textAlign: 'right' }}>KP</span>
          </div>
          <RosterSection title={`Major League (${mlb.length})`} players={mlb} accentColor="#3ecf8e" defaultOpen onPlayerClick={setSelectedPlayer} />
          <RosterSection title={`Minor League (${milb.length})`} players={milb} accentColor="#4f7ef0" defaultOpen onPlayerClick={setSelectedPlayer} />
          <RosterSection title={`Injured List (${il.length})`} players={il} accentColor="#f0c040" defaultOpen onPlayerClick={setSelectedPlayer} />
          <RosterSection title={`Dropped (${dropped.length})`} players={dropped} accentColor="#f0614f" defaultOpen={false} onPlayerClick={setSelectedPlayer} />
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <TransactionsPane slug={slug} year={year} />
        </div>
      )}

      <p style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Click any player to see their full roster history
      </p>
    </div>
  )
}
