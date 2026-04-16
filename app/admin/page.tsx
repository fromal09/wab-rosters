'use client'
import { useState, useEffect } from 'react'
import { MANAGERS, CURRENT_YEAR } from '@/lib/constants'

type Tab = 'trade' | 'add-drop' | 'budget' | 'il' | 'salary' | 'franchise' | 'keeper-slots' | 'notes' | 'rename'

// ── Light-mode form primitives ────────────────────────────────────────────────
const inputStyle = {
  background: '#fff', border: '1px solid #d1d5db', borderRadius: 6,
  color: '#111827', padding: '8px 12px', fontSize: '0.88rem',
  outline: 'none', width: '100%',
}
const labelStyle = {
  fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' as const,
  letterSpacing: '0.06em', fontWeight: 600 as const,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string | number; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <Field label={label}>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={inputStyle} />
    </Field>
  )
}

function ManagerSelect({ label, value, onChange, exclude }: {
  label: string; value: string; onChange: (v: string) => void; exclude?: string
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer' }}>
        <option value="">Select manager…</option>
        {MANAGERS.filter(m => m.slug !== exclude).map(m => (
          <option key={m.slug} value={m.slug}>{m.name}</option>
        ))}
      </select>
    </Field>
  )
}

function Btn({ label, onClick, loading, color = '#1d4ed8', disabled }: {
  label: string; onClick: () => void; loading: boolean; color?: string; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={loading || disabled} style={{
      padding: '9px 20px', background: (loading || disabled) ? '#9ca3af' : color,
      border: 'none', borderRadius: 7, color: '#fff', fontWeight: 700,
      fontSize: '0.88rem', cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
    }}>
      {loading ? 'Working…' : label}
    </button>
  )
}

function Status({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null
  return (
    <div style={{
      padding: '8px 14px', borderRadius: 6, fontSize: '0.83rem', fontWeight: 500,
      background: msg.ok ? '#f0fdf4' : '#fef2f2',
      color: msg.ok ? '#15803d' : '#dc2626',
      border: `1px solid ${msg.ok ? '#bbf7d0' : '#fecaca'}`,
    }}>
      {msg.text}
    </div>
  )
}

async function adminPost(body: object) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: controller.signal,
    })
    clearTimeout(timeout)
    const json = await res.json()
    if (!res.ok && json.ok !== false) return { ok: false, error: json.error ?? `HTTP ${res.status}` }
    return json
  } catch (e: unknown) {
    const msg = e instanceof Error && e.name === 'AbortError' ? 'Request timed out' : String(e)
    return { ok: false, error: msg }
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function TradeTab() {
  const [a, setA] = useState(''); const [b, setB] = useState('')
  const [aPlayers, setAPlayers] = useState(''); const [bPlayers, setBPlayers] = useState('')
  const [aBudget, setABudget] = useState('0'); const [bBudget, setBBudget] = useState('0')
  const [aKeeper, setAKeeper] = useState('0'); const [bKeeper, setBKeeper] = useState('0')
  const [note, setNote] = useState(''); const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const mgrAName = MANAGERS.find(m => m.slug === a)?.name ?? 'Team A'
  const mgrBName = MANAGERS.find(m => m.slug === b)?.name ?? 'Team B'
  async function submit() {
    if (!a || !b) return setMsg({ ok: false, text: 'Select both managers' })
    setLoading(true); setMsg(null)
    const json = await adminPost({
      action: 'trade', year: CURRENT_YEAR,
      managerASlug: a, managerBSlug: b,
      playersAtoB: aPlayers.split('\n').map(s => s.trim()).filter(Boolean),
      playersBtoA: bPlayers.split('\n').map(s => s.trim()).filter(Boolean),
      budgetAtoB: parseInt(aBudget) || 0, budgetBtoA: parseInt(bBudget) || 0,
      keeperAtoB: parseInt(aKeeper) || 0, keeperBtoA: parseInt(bKeeper) || 0,
      note: note || null,
    })
    setMsg(json.ok ? { ok: true, text: 'Trade completed!' } : { ok: false, text: json.error })
    if (json.ok) { setAPlayers(''); setBPlayers(''); setABudget('0'); setBBudget('0'); setAKeeper('0'); setBKeeper('0'); setNote('') }
    setLoading(false)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <ManagerSelect label="Team A" value={a} onChange={setA} exclude={b} />
        <ManagerSelect label="Team B" value={b} onChange={setB} exclude={a} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={`${mgrAName} sends players (one per line)`}>
          <textarea value={aPlayers} onChange={e => setAPlayers(e.target.value)} rows={4}
            placeholder="Player Name" style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>
        <Field label={`${mgrBName} sends players (one per line)`}>
          <textarea value={bPlayers} onChange={e => setBPlayers(e.target.value)} rows={4}
            placeholder="Player Name" style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12 }}>
        <Input label={`${mgrAName} sends $`} value={aBudget} onChange={setABudget} type="number" placeholder="0" />
        <Input label={`${mgrBName} sends $`} value={bBudget} onChange={setBBudget} type="number" placeholder="0" />
        <Input label={`${mgrAName} sends slots`} value={aKeeper} onChange={setAKeeper} type="number" placeholder="0" />
        <Input label={`${mgrBName} sends slots`} value={bKeeper} onChange={setBKeeper} type="number" placeholder="0" />
        <Input label="Note" value={note} onChange={setNote} placeholder="Optional" />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn label="Execute Trade" onClick={submit} loading={loading} />
        <Status msg={msg} />
      </div>
    </div>
  )
}

function AddDropTab() {
  const [mode, setMode] = useState<'add' | 'drop'>('drop')
  const [manager, setManager] = useState(''); const [player, setPlayer] = useState('')
  const [salary, setSalary] = useState(''); const [slotType, setSlotType] = useState('MLB')
  const [note, setNote] = useState(''); const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function submit() {
    if (!manager || !player) return setMsg({ ok: false, text: 'Fill in all required fields' })
    setLoading(true); setMsg(null)
    const body = mode === 'drop'
      ? { action: 'drop', year: CURRENT_YEAR, managerSlug: manager, playerName: player, note: note || null }
      : { action: 'claim', year: CURRENT_YEAR, managerSlug: manager, playerName: player, salary: parseInt(salary) || 0, slotType, note: note || null }
    const json = await adminPost(body)
    if (json.ok) {
      setMsg({ ok: true, text: mode === 'drop' ? `Dropped. Dead money: $${json.dead_money}` : 'Player added!' })
      setPlayer(''); setSalary(''); setNote('')
    } else setMsg({ ok: false, text: json.error })
    setLoading(false)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['drop', 'add'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '6px 16px', borderRadius: 6, border: '1px solid',
            borderColor: mode === m ? '#1d4ed8' : '#e2e6eb',
            background: mode === m ? '#eff6ff' : '#fff',
            color: mode === m ? '#1d4ed8' : '#6b7280',
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
          <Field label="Roster Slot">
            <select value={slotType} onChange={e => setSlotType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {['MLB', 'MiLB', 'IL'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Input label="Note" value={note} onChange={setNote} placeholder="Free agent pickup, waivers, etc." />
        </div>
      )}
      {mode === 'drop' && <Input label="Note (optional)" value={note} onChange={setNote} placeholder="Reason for drop" />}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn label={mode === 'drop' ? 'Drop Player' : 'Add Player'} onClick={submit} loading={loading} color={mode === 'drop' ? '#dc2626' : '#15803d'} />
        <Status msg={msg} />
      </div>
    </div>
  )
}

function BudgetTab() {
  const [manager, setManager] = useState(''); const [amount, setAmount] = useState(''); const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function submit() {
    if (!manager || !amount) return setMsg({ ok: false, text: 'Fill in all fields' })
    setLoading(true); setMsg(null)
    const json = await adminPost({ action: 'budget', year: CURRENT_YEAR, managerSlug: manager, amount: parseInt(amount), note })
    setMsg(json.ok ? { ok: true, text: 'Budget updated!' } : { ok: false, text: json.error })
    if (json.ok) { setAmount(''); setNote('') }
    setLoading(false)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#6b7280' }}>Use positive numbers to add budget, negative to deduct.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
        <ManagerSelect label="Manager" value={manager} onChange={setManager} />
        <Input label="Amount (+ or −)" value={amount} onChange={setAmount} type="number" placeholder="+11 or -5" />
        <Input label="Note" value={note} onChange={setNote} placeholder="e.g. +$11 from Jacob in slot trade" />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn label="Apply Budget Entry" onClick={submit} loading={loading} />
        <Status msg={msg} />
      </div>
    </div>
  )
}

function KeeperSlotsTab() {
  const [manager, setManager] = useState(''); const [delta, setDelta] = useState(''); const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function submit() {
    if (!manager || !delta) return setMsg({ ok: false, text: 'Fill in all fields' })
    setLoading(true); setMsg(null)
    const json = await adminPost({ action: 'keeper_slots', year: CURRENT_YEAR, managerSlug: manager, delta: parseInt(delta), note })
    setMsg(json.ok ? { ok: true, text: 'Keeper slots updated!' } : { ok: false, text: json.error })
    if (json.ok) { setDelta(''); setNote('') }
    setLoading(false)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#6b7280' }}>
        Adjust keeper slots for a manager. Use positive to add slots, negative to remove. Trades between managers can be done in the Trade tab (Keeper Slots sent fields).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
        <ManagerSelect label="Manager" value={manager} onChange={setManager} />
        <Input label="Change (+ or −)" value={delta} onChange={setDelta} type="number" placeholder="+1 or -2" />
        <Input label="Note" value={note} onChange={setNote} placeholder="e.g. +1 from Shorty in slot trade" />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn label="Apply Slot Change" onClick={submit} loading={loading} />
        <Status msg={msg} />
      </div>
    </div>
  )
}

function ILTab() {
  const [manager, setManager] = useState(''); const [player, setPlayer] = useState(''); const [toSlot, setToSlot] = useState('IL')
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function submit() {
    if (!manager || !player) return setMsg({ ok: false, text: 'Fill in all fields' })
    setLoading(true); setMsg(null)
    const json = await adminPost({ action: 'il_move', year: CURRENT_YEAR, managerSlug: manager, playerName: player, toSlot })
    setMsg(json.ok ? { ok: true, text: `Moved to ${toSlot}` } : { ok: false, text: json.error })
    if (json.ok) setPlayer('')
    setLoading(false)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <ManagerSelect label="Manager" value={manager} onChange={setManager} />
        <Input label="Player Name" value={player} onChange={setPlayer} placeholder="Exact name…" />
        <Field label="Move To">
          <select value={toSlot} onChange={e => setToSlot(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {['IL', 'MLB', 'MiLB'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn label="Move Player" onClick={submit} loading={loading} color="#d97706" />
        <Status msg={msg} />
      </div>
    </div>
  )
}

function SalaryTab() {
  const [manager, setManager] = useState(''); const [player, setPlayer] = useState(''); const [salary, setSalary] = useState('')
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function submit() {
    if (!manager || !player || !salary) return setMsg({ ok: false, text: 'Fill in all fields' })
    setLoading(true); setMsg(null)
    const json = await adminPost({ action: 'update_salary', year: CURRENT_YEAR, managerSlug: manager, playerName: player, newSalary: salary })
    setMsg(json.ok ? { ok: true, text: 'Salary updated!' } : { ok: false, text: json.error })
    if (json.ok) { setPlayer(''); setSalary('') }
    setLoading(false)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#6b7280' }}>Correct a player's salary — use for draft-day batch-add price fixes.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <ManagerSelect label="Manager" value={manager} onChange={setManager} />
        <Input label="Player Name" value={player} onChange={setPlayer} placeholder="Exact name…" />
        <Input label="New Salary ($)" value={salary} onChange={setSalary} type="number" placeholder="31" />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn label="Update Salary" onClick={submit} loading={loading} color="#7c3aed" />
        <Status msg={msg} />
      </div>
    </div>
  )
}

function FranchiseTab() {
  const [manager, setManager] = useState(''); const [player, setPlayer] = useState(''); const [value, setValue] = useState(true)
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function submit() {
    if (!manager || !player) return setMsg({ ok: false, text: 'Fill in all fields' })
    setLoading(true); setMsg(null)
    const json = await adminPost({ action: 'set_franchise', managerSlug: manager, playerName: player, value })
    setMsg(json.ok ? { ok: true, text: `${player} → franchise ${value ? 'ON ★' : 'OFF'}` } : { ok: false, text: json.error })
    if (json.ok) setPlayer('')
    setLoading(false)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#6b7280' }}>Grant or remove franchise status (italic serif + ★). Applies across all years on that manager's roster.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <ManagerSelect label="Manager" value={manager} onChange={setManager} />
        <Input label="Player Name" value={player} onChange={setPlayer} placeholder="Exact name…" />
        <Field label="Action">
          <select value={value ? 'true' : 'false'} onChange={e => setValue(e.target.value === 'true')} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="true">★ Grant franchise status</option>
            <option value="false">Remove franchise status</option>
          </select>
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn label="Apply" onClick={submit} loading={loading} />
        <Status msg={msg} />
      </div>
    </div>
  )
}

function NotesTab() {
  const [manager, setManager] = useState('')
  const [note, setNote] = useState('')
  const [existingNotes, setExistingNotes] = useState<{id:string;note:string}[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function fetchNotes(slug: string) {
    if (!slug) return
    setLoadingNotes(true)
    try {
      const data = await (await fetch(`/api/team/${slug}?year=${CURRENT_YEAR}`)).json()
      setExistingNotes(data.notes ?? [])
    } finally { setLoadingNotes(false) }
  }

  function handleManagerChange(slug: string) {
    setManager(slug); setExistingNotes([]); setMsg(null)
    if (slug) fetchNotes(slug)
  }

  async function addNote() {
    if (!manager || !note.trim()) return setMsg({ ok: false, text: 'Fill in all fields' })
    setLoading(true); setMsg(null)
    const json = await adminPost({ action: 'add_note', year: CURRENT_YEAR, managerSlug: manager, note: note.trim() })
    if (json.ok) { setMsg({ ok: true, text: 'Note added!' }); setNote(''); fetchNotes(manager) }
    else setMsg({ ok: false, text: json.error })
    setLoading(false)
  }

  async function deleteNote(noteId: string) {
    const json = await adminPost({ action: 'delete_note', noteId })
    if (json.ok) { setExistingNotes(n => n.filter(x => x.id !== noteId)); setMsg({ ok: true, text: 'Note removed.' }) }
    else setMsg({ ok: false, text: json.error })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#6b7280' }}>
        Notes appear on team cards and roster pages. Examples: missed minimums, future budget traded, salary corrections.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 12 }}>
        <ManagerSelect label="Manager" value={manager} onChange={handleManagerChange} />
        <Input label="New Note" value={note} onChange={setNote} placeholder="e.g. 1 missed minimum — $5 penalty applied" />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn label="Add Note" onClick={addNote} loading={loading} />
        <Status msg={msg} />
      </div>

      {/* Existing notes for selected manager */}
      {manager && (
        <div style={{ borderTop: '1px solid #e4e7ec', paddingTop: 14 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8 }}>
            Current Notes {loadingNotes && <span style={{ fontWeight: 400 }}>— loading…</span>}
          </div>
          {!loadingNotes && existingNotes.length === 0 && (
            <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No notes for this manager.</div>
          )}
          {existingNotes.map(n => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, marginBottom: 6 }}>
              <span style={{ flex: 1, fontSize: '0.83rem', color: '#374151', lineHeight: 1.5 }}>{n.note}</span>
              <button onClick={() => deleteNote(n.id)} style={{ padding: '2px 8px', background: '#fff', border: '1px solid #fca5a5', borderRadius: 4, color: '#b91c1c', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RenameTab() {
  const [oldName, setOldName] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit() {
    if (!oldName.trim() || !newName.trim()) return setMsg({ ok: false, text: 'Both fields required' })
    if (oldName.trim() === newName.trim()) return setMsg({ ok: false, text: 'Names are identical' })
    setLoading(true); setMsg(null)
    const json = await adminPost({ action: 'rename_player', oldName: oldName.trim(), newName: newName.trim() })
    if (json.ok) {
      setMsg({ ok: true, text: `Renamed "${oldName.trim()}" → "${newName.trim()}"` })
      setOldName(''); setNewName('')
    } else {
      setMsg({ ok: false, text: json.error })
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#6b7280' }}>
        Correct a player name typo. Updates the name everywhere — all roster slots and transactions.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'flex-end' }}>
        <Input label="Current name (exact)" value={oldName} onChange={setOldName} placeholder="e.g. Jaccob Junis" />
        <div style={{ paddingBottom: 9, color: '#9ca3af', fontSize: '1rem' }}>→</div>
        <Input label="Corrected name" value={newName} onChange={setNewName} placeholder="e.g. Jacob Junis" />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn label="Rename Player" onClick={submit} loading={loading} color="#7c3aed" />
        <Status msg={msg} />
      </div>
    </div>
  )
}

// ── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    setLoading(false)
    if (res.ok) onLogin(); else setError('Wrong password.')
  }
  return (
    <div style={{ maxWidth: 340, margin: '80px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔑</div>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', color: '#111827', fontWeight: 700 }}>Commissioner Access</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Password" autoFocus
          style={{ ...inputStyle, textAlign: 'center', padding: '10px 14px', fontSize: '0.9rem' }} />
        {error && <div style={{ color: '#dc2626', fontSize: '0.82rem' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{
          padding: '10px', background: '#1d4ed8', border: 'none', borderRadius: 7,
          color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
        }}>
          {loading ? 'Checking…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('trade')

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(j => setAuthenticated(j.authenticated === true)).catch(() => setAuthenticated(false))
  }, [])

  async function logout() { await fetch('/api/auth', { method: 'DELETE' }); setAuthenticated(false) }

  if (authenticated === null) return <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>Loading…</div>
  if (!authenticated) return <LoginScreen onLogin={() => setAuthenticated(true)} />

  const TABS: { id: Tab; label: string }[] = [
    { id: 'trade',        label: '⇄ Trade' },
    { id: 'add-drop',     label: '+ Add / Drop' },
    { id: 'budget',       label: '$ Budget' },
    { id: 'keeper-slots', label: '🎟 Keeper Slots' },
    { id: 'il',           label: '🏥 IL Move' },
    { id: 'salary',       label: '✏️ Salary' },
    { id: 'franchise',    label: '★ Franchise' },
    { id: 'rename',       label: '✏️ Rename' },
    { id: 'notes',        label: '📝 Notes' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>Commissioner Panel</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>{CURRENT_YEAR} season · Changes are immediate</p>
        </div>
        <button onClick={logout} style={{ padding: '6px 14px', background: '#fff', border: '1px solid #e2e6eb', borderRadius: 6, color: '#6b7280', cursor: 'pointer', fontSize: '0.8rem' }}>
          Sign Out
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 0, borderBottom: '2px solid #e2e6eb', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 14px', background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === t.id ? '#1d4ed8' : 'transparent'}`,
            marginBottom: -2, color: tab === t.id ? '#1d4ed8' : '#6b7280',
            cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400,
            fontSize: '0.82rem', transition: 'color 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '20px 22px', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {tab === 'trade'        && <TradeTab />}
        {tab === 'add-drop'     && <AddDropTab />}
        {tab === 'budget'       && <BudgetTab />}
        {tab === 'keeper-slots' && <KeeperSlotsTab />}
        {tab === 'il'           && <ILTab />}
        {tab === 'salary'       && <SalaryTab />}
        {tab === 'franchise'    && <FranchiseTab />}
        {tab === 'rename'       && <RenameTab />}
        {tab === 'notes'        && <NotesTab />}
      </div>
    </div>
  )
}
