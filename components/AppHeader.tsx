'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'League' },
    { href: '/history', label: 'History' },
    { href: '/admin', label: 'Commissioner' },
  ]

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e4e7ec', padding: '0 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', height: 50, gap: 16 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ background: '#1a56db', color: '#fff', fontWeight: 900, fontSize: '0.78rem', padding: '3px 7px', borderRadius: 5, letterSpacing: '0.06em' }}>WAB</div>
          <span className="nav-desktop" style={{ fontSize: '0.74rem', color: '#9ca3af', fontWeight: 500, letterSpacing: '0.04em' }}>Roster Hub</span>
        </Link>

        <div style={{ flex: 1 }} />

        {/* Nav links — desktop */}
        <nav className="nav-desktop" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} style={{ padding: '5px 10px', borderRadius: 5, color: '#374151', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f6f7f9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Hamburger — mobile */}
        <button className="nav-mobile" onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#374151', fontSize: '1.2rem' }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="nav-mobile" style={{ flexDirection: 'column', padding: '4px 0 10px', borderTop: '1px solid #e4e7ec', gap: 0 }}>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ padding: '10px 16px', color: '#374151', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, display: 'block' }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
