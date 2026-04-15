'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getServiceYearColor } from '@/lib/constants'

interface SearchResult {
  id: string
  name: string
  current: {
    slot_type: string
    salary: number
    service_year: number
    managers: { name: string; slug: string }
  } | null
}

interface Props {
  onSelect: (playerName: string) => void
  year?: number
}

export default function GlobalSearch({ onSelect, year }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}${year ? `&year=${year}` : ''}`)
      const data = await res.json()
      setResults(data)
      setOpen(data.length > 0)
      setActive(-1)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  function select(name: string) {
    setQuery('')
    setOpen(false)
    setResults([])
    onSelect(name)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); select(results[active].name) }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  const SLOT_COLORS: Record<string, string> = { MLB: '#3ecf8e', MiLB: '#4f7ef0', IL: '#f0c040' }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none' }}>
          🔍
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search any player…"
          style={{
            width: 240,
            padding: '7px 12px 7px 32px',
            background: '#13161f',
            border: '1px solid #2e3347',
            borderRadius: 7,
            color: 'var(--text-primary)',
            fontSize: '0.83rem',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#4f7ef0')}
          onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#2e3347' }}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 10, color: 'var(--text-muted)', fontSize: '0.7rem' }}>…</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#1a1d27',
            border: '1px solid #2e3347',
            borderRadius: 8,
            zIndex: 200,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            minWidth: 280,
          }}
        >
          {results.map((r, i) => (
            <button
              key={r.id}
              onMouseDown={() => select(r.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 12px',
                background: i === active ? '#22263a' : 'transparent',
                border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid rgba(46,51,71,0.5)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {/* Service year color dot */}
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: r.current ? getServiceYearColor(r.current.service_year) : '#2e3347',
              }} />

              {/* Name */}
              <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {r.name}
              </span>

              {/* Current team info */}
              {r.current ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                    color: SLOT_COLORS[r.current.slot_type] ?? 'var(--text-muted)',
                  }}>
                    {r.current.slot_type}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {r.current.managers?.name?.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    ${r.current.salary}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FA</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
