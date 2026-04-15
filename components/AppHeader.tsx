'use client'
import Link from 'next/link'
import { useState } from 'react'
import GlobalSearch from './GlobalSearch'
import PlayerModal from './PlayerModal'

export default function AppHeader() {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  return (
    <>
      <PlayerModal playerName={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e2e6eb',
        padding: '0 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', height: 54, gap: 20 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              background: '#1d4ed8',
              color: '#fff',
              fontWeight: 900,
              fontSize: '0.85rem',
              padding: '3px 8px',
              borderRadius: 5,
              letterSpacing: '0.04em',
            }}>WAB</div>
            <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500, letterSpacing: '0.04em' }}>
              Roster Hub
            </span>
          </Link>

          <div style={{ flex: 1 }} />
          <GlobalSearch onSelect={setSelectedPlayer} />

          <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Link href="/" style={{ padding: '5px 12px', borderRadius: 6, color: '#374151', textDecoration: 'none', fontSize: '0.83rem', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.background='#f4f5f7')}
              onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
              League
            </Link>
            <Link href="/history" style={{ padding: '5px 12px', borderRadius: 6, color: '#374151', textDecoration: 'none', fontSize: '0.83rem', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.background='#f4f5f7')}
              onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
              History
            </Link>
            <Link href="/admin" style={{ padding: '5px 12px', borderRadius: 6, color: '#374151', textDecoration: 'none', fontSize: '0.83rem', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.background='#f4f5f7')}
              onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
              Commissioner
            </Link>
          </nav>
        </div>
      </header>
    </>
  )
}
