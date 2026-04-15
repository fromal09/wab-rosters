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
      <header style={{ background: '#13161f', borderBottom: '1px solid #2e3347', padding: '0 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', height: 52, gap: 20 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e8eaf0', letterSpacing: '-0.02em' }}>
              WAB
            </span>
            <span style={{ fontSize: '0.75rem', color: '#5a6075', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Roster Hub
            </span>
          </Link>

          <div style={{ flex: 1 }} />

          {/* Global search */}
          <GlobalSearch onSelect={setSelectedPlayer} />

          <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Link href="/" style={{ padding: '4px 10px', borderRadius: 5, color: '#8b92a8', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500 }}>
              League
            </Link>
            <Link href="/admin" style={{ padding: '4px 10px', borderRadius: 5, color: '#8b92a8', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500 }}>
              Commissioner
            </Link>
          </nav>
        </div>
      </header>
    </>
  )
}
