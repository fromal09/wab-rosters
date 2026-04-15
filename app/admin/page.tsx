'use client'
import { useState, useEffect } from 'react'
import { MANAGERS, CURRENT_YEAR } from '@/lib/constants'

type Tab = 'trade' | 'add-drop' | 'budget' | 'il' | 'salary'

interface Manager { name: string; slug: string }

// ── Helpers ─────────────────────────────────────────────────────────────────
function Input({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string | number; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: '#13161f', border: '1px solid #2e3347', borderRadius: 6,
          color: 'var(--text-primary)', padding: '8px 12px', fontSize: '0.88rem',
          outline: 'none', width: '100%',
        }}
      />
    </div>
  )
}

function ManagerSelect({ label, value, onChange, exclude }: {
  label: string; value: string; onChange: (v: string) => void; exclude?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: '#13161f', border: '1px solid #2e3347', borderRadius: 6,
          color: 'var(--text-primary)', padding: '8px 12px', fontSize: '0.88rem', outline: 'none',
        }}
      >
        <option value="">Select manager…</option>
        {MANAGERS.filter(m => m.slug !== exclude).map(m => (
          <option key={m.slug} value={m.slug}>{m.name}</option>
        ))}
      </select>
    </div>
  )
}

function ActionButton({ label, onClick, loading, color = '#4f7ef0' }: {
  label: string; onClick: () => void; loading: boolean; color?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '9px 20px', background: color, border: 'none', borderRadius: 7,
        color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s',
      }}
    >
      {loading ? 'Working…' : label}
    </button>
  )
}

function StatusMsg({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null
  return (
    <div style={{
      padding: '8px 14px', borderRadius: 6, fontSize: '0.83rem', fontWeight: 500,
      background: msg.ok ? 'rgba(62,207,142,0.1)' : 'rgba(240,97,79,0.1)',
      color: msg.ok ? '#3ecf8e' : '#f0614f',
      border: `1px solid ${msg.ok ? '#3ecf8e' : '#f0614f'}`,
    }}>
      {msg.text}
    </div>
  )
}

// ── Admin panel tabs ─────────────────────────────────────────────────────────

function TradeTab() {
  const [a, setA] = useState(''); const [b, setB] = useState('')
  const [aPlayers, setAPlayers] = useState(''); const [bPlayers, setBPlayers] = useState('')
  const [aBudget, setABudget] = useState('0'); const [bBudget, setBBudget] = useState('0')
  const [note, setNote] = useState(''); const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit() {
    if (!a || !b) return setMsg({ ok: false, text: 'Select both managers' })
    setLoading(true); setMsg(null)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trade', year: CURRENT_YEAR,
          managerASlug: a, managerBSlug: b,
          playersAtoB: aPlayers.split('\n').map(s => s.trim()).filter(Boolean),
          playersBtoA: bPlayers.split('\n').map(s => s.trim()).filter(Boolean),
          budgetAtoB: parseInt(aBudget) || 0,
          budgetBtoA: parseInt(bBudget) || 0,
          note: note || null,
        }),
      })
      const json = await res.json()
      setMsg(json.ok ? { ok: true, text: 'Trade completed!' } : { ok: false, text: json.error })
      if (json.ok) { setAPlayers(''); setBPlayers(''); setABudget('0'); setBBudget('0'); setNote('') }
    } finally { setLoading(false) }
  }

  const mgrAName = MANAGERS.find(m => m.slug === a)?.name ?? 'Team A'
  const mgrBName = MANAGERS.find(m => m.slug === b)?.name ?? 'Team B'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <ManagerSelect label="Team A" value={a} onChange={setA} exclude={b} />
        <ManagerSelect label="Team B" value={b} onChange={setB} exclude={a} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {mgrAName} sends players (one per line)
          </label>
          <textarea
            value={aPlayers} onChange={e => setAPlayers(e.target.value)}
            rows={4} placeholder="Rafael Devers&#10;Freddy Peralta"
            style={{ background: '#13161f', border: '1px solid #2e3347', borderRadius: 6, color: 'var(--text-primary)', padding: '8px 12px', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {mgrBName} sends players (one per line)
          </label>
          <textarea
            value={bPlayers} onChange={e => setBPlayers(e.target.value)}
            rows={4} placeholder="Shohei Ohtani"
            style={{ background: '#13161f', border: '1px solid #2e3347', borderRadius: 6, color: 'var(--text-primary)', padding: '8px 12px', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Input label={`${mgrAName} sends $`} value={aBudget} onChange={setABudget} type="number" placeholder="0" />
        <Input label={`${mgrBName} sends $`} value={bBudget} onChange={setBBudget} type="number" placeholder="0" />
        <Input label="Note" value={note} onChange={setNote} placeholder="Optional trade note" />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <ActionButton label="Execute Trade" onClick={submit} loading={loading} />
        <StatusMsg msg={msg} />
      </div>
    </div>
  )
}

function AddDropTab() {
  const [mode, setMode] = useState<'add' | 'drop'>('drop')
  const [manager, setManager] = useState('')
  const [player, setPlayer] = useState('')
  const [salary, setSalary] = useState('')
  const [slotType, setSlotType] = useState('MLB')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit() {
    if (!manager || !player) return setMsg({ ok: false, text: 'Fill in all required fields' })
    setLoading(true); setMsg(null)
    try {
      const body = mode === 'drop'
        ? { action: 'drop', year: CURRENT_YEAR, managerSlug: manager, playerName: player, note: note || null }
        : { action: 'claim', year: CURRENT_YEAR, managerSlug: manager, playerName: player, salary: parseInt(salary) || 0, slotType, note: note || null }

      const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.ok) {
        setMsg({ ok: true, text: mode === 'drop' ? `Dropped. Dead money: $${json.dead_money}` : 'Player added!' })
        setPlayer(''); setSalary(''); setNote('')
      } else {
        setMsg({ ok: false, text: json.error })
      }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['drop', 'add'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '6px 16px', borderRadius: 6, border: '1px solid',
            borderColor: mode === m ? '#4f7ef0' : '#2e3347',
            background: mode === m ? 'rgba(79,126,240,0.15)' : 'transparent',
            color: mode === m ? '#4f7ef0' : 'var(--text-muted)',
            cursor: 'pointer', fontWeight: mode === m ? 700 : 400, fontSize: '0.85rem',
          }}>
            {m === 'drop' ? 'Drop Player' : 'Add Player'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mode === 'add' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
        <ManagerSelect label="Manager" value={manager} onChange={setManager} />
        <Input label="Player Name" value={player} onChange={setPlayer} placeholder="Exact name…" />
        {mode === 'add' && <Input label="Salary ($)" value={salary} onChange={setSalary} type="number" placeholder="1" />}
      </div>

      {mode === 'add' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Roster Slot</label>
            <select value={slotType} onChange={e => setSlotType(e.target.value)} style={{ background: '#13161f', border: '1px solid #2e3347', borderRadius: 6, color: 'var(--text-primary)', padding: '8px 12px', fontSize: '0.88rem', outline: 'none' }}>
              {['MLB','MiLB','IL'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input label="Note" value={note} onChange={setNote} placeholder="Free agent pickup, waivers, etc." />
        </div>
      )}

      {mode === 'drop' && (
        <Input label="Note (optional)" value={note} onChange={setNote} placeholder="Reason for drop" />
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <ActionButton label={mode === 'drop' ? 'Drop Player' : 'Add Player'} onClick={submit} loading={loading} color={mode === 'drop' ? '#f0614f' : '#3ecf8e'} />
        <StatusMsg msg={msg} />
      </div>
    </div>
  )
}

function BudgetTab() {
  const [manager, setManager] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit() {
    if (!manager || !amount) return setMsg({ ok: false, text: 'Fill in all fields' })
    setLoading(true); setMsg(null)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'budget', year: CURRENT_YEAR, managerSlug: manager, amount: parseInt(amount), note }),
      })
      const json = await res.json()
      setMsg(json.ok ? { ok: true, text: 'Budget updated!' } : { ok: false, text: json.error })
      if (json.ok) { setAmount(''); setNote('') }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
        Add a budget entry. Use positive numbers to add budget, negative to deduct.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
        <ManagerSelect label="Manager" value={manager} onChange={setManager} />
        <Input label="Amount (+ or −)" value={amount} onChange={setAmount} type="number" placeholder="+11 or -5" />
        <Input label="Note" value={note} onChange={setNote} placeholder="e.g. +$11 from Jacob in slot trade" />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <ActionButton label="Apply Budget Entry" onClick={submit} loading={loading} />
        <StatusMsg msg={msg} />
      </div>
    </div>
  )
}

function ILTab() {
  const [manager, setManager] = useState('')
  const [player, setPlayer] = useState('')
  const [toSlot, setToSlot] = useState('IL')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit() {
    if (!manager || !player) return setMsg({ ok: false, text: 'Fill in all fields' })
    setLoading(true); setMsg(null)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'il_move', year: CURRENT_YEAR, managerSlug: manager, playerName: player, toSlot }),
      })
      const json = await res.json()
      setMsg(json.ok ? { ok: true, text: `Moved to ${toSlot}` } : { ok: false, text: json.error })
      if (json.ok) setPlayer('')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <ManagerSelect label="Manager" value={manager} onChange={setManager} />
        <Input label="Player Name" value={player} onChange={setPlayer} placeholder="Exact name…" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Move To</label>
          <select value={toSlot} onChange={e => setToSlot(e.target.value)} style={{ background: '#13161f', border: '1px solid #2e3347', borderRadius: 6, color: 'var(--text-primary)', padding: '8px 12px', fontSize: '0.88rem', outline: 'none' }}>
            {['IL','MLB','MiLB'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <ActionButton label="Move Player" onClick={submit} loading={loading} color="#f0c040" />
        <StatusMsg msg={msg} />
      </div>
    </div>
  )
}

function SalaryTab() {
  const [manager, setManager] = useState('')
  const [player, setPlayer] = useState('')
  const [salary, setSalary] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit() {
    if (!manager || !player || !salary) return setMsg({ ok: false, text: 'Fill in all fields' })
    setLoading(true); setMsg(null)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_salary', year: CURRENT_YEAR, managerSlug: manager, playerName: player, newSalary: salary }),
      })
      const json = await res.json()
      setMsg(json.ok ? { ok: true, text: 'Salary updated!' } : { ok: false, text: json.error })
      if (json.ok) { setPlayer(''); setSalary('') }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
        Update a player&apos;s salary on a roster — use this to correct draft-day batch-add prices.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <ManagerSelect label="Manager" value={manager} onChange={setManager} />
        <Input label="Player Name" value={player} onChange={setPlayer} placeholder="Exact name…" />
        <Input label="New Salary ($)" value={salary} onChange={setSalary} type="number" placeholder="31" />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <ActionButton label="Update Salary" onClick={submit} loading={loading} color="#8b5cf6" />
        <StatusMsg msg={msg} />
      </div>
    </div>
  )
}


function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) { onLogin() }
    else { setError('Wrong password.') }
  }

  return (
    <div style={{ maxWidth: 340, margin: '80px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>🔑</div>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Commissioner Access</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{ background: '#13161f', border: '1px solid #2e3347', borderRadius: 7, color: 'var(--text-primary)', padding: '10px 14px', fontSize: '0.9rem', outline: 'none', textAlign: 'center' }}
        />
        {error && <div style={{ color: '#f0614f', fontSize: '0.82rem' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ padding: '10px', background: '#4f7ef0', border: 'none', borderRadius: 7, color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
          {loading ? 'Checking…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

// ── Main admin page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('trade')

  useEffect(() => {
    fetch('/api/auth')
      .then(r => r.json())
      .then(j => setAuthenticated(j.authenticated === true))
      .catch(() => setAuthenticated(false))
  }, [])

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    setAuthenticated(false)
  }

  if (authenticated === null) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Loading…</div>
  if (!authenticated) return <LoginScreen onLogin={() => setAuthenticated(true)} />

  const TABS: { id: Tab; label: string }[] = [
    { id: 'trade', label: '⇄ Trade' },
    { id: 'add-drop', label: '+ Add / Drop' },
    { id: 'budget', label: '$ Budget' },
    { id: 'il', label: '🏥 IL Move' },
    { id: 'salary', label: '✏️ Salary' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Commissioner Panel
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {CURRENT_YEAR} season · Changes are immediate
          </p>
        </div>
        <button onClick={logout} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #2e3347', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #2e3347', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === t.id ? '#4f7ef0' : 'transparent'}`,
              color: tab === t.id ? '#4f7ef0' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: tab === t.id ? 700 : 400,
              fontSize: '0.85rem',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card" style={{ padding: '20px 22px' }}>
        {tab === 'trade' && <TradeTab />}
        {tab === 'add-drop' && <AddDropTab />}
        {tab === 'budget' && <BudgetTab />}
        {tab === 'il' && <ILTab />}
        {tab === 'salary' && <SalaryTab />}
      </div>
    </div>
  )
}
