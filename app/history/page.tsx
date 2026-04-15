'use client'
import Link from 'next/link'

// Source: League History tab from Official WAB Rosters spreadsheet
const CHAMPIONS = [
  { year: 2025, winner: 'Eric Fleury',    last: 'Chris Glazier' },
  { year: 2024, winner: 'Jacob Newcomer', last: 'Arjun Baradwaj' },
  { year: 2023, winner: 'Jacob Newcomer', last: 'Chris Glazier' },
  { year: 2022, winner: 'Jacob Newcomer', last: 'Arjun Baradwaj' },
  { year: 2021, winner: 'Shorty Hoffman', last: 'Chris Glazier' },
  { year: 2020, winner: 'Jacob Newcomer', last: 'Robert Ray' },
  { year: 2019, winner: 'Jacob Newcomer', last: 'Adam Fromal' },
]

// Finish positions by manager by year (from League History sheet)
// Only includes WAB era (2019+) for the active managers table
const ACTIVE_MANAGERS = [
  { name: 'Adam Fromal',       slug: 'adam-fromal',       finishes: {2019:8,2020:8,2021:9,2022:2,2023:7,2024:7,2025:2} },
  { name: 'Arjun Baradwaj',    slug: 'arjun-baradwaj',    finishes: {2019:7,2020:7,2021:6,2022:10,2023:6,2024:10,2025:7} },
  { name: 'Bretton McIlrath',  slug: 'bretton-mcilrath',  finishes: {2019:3,2020:5,2021:2,2022:8,2023:4,2024:6,2025:6} },
  { name: 'Chris Glazier',     slug: 'chris-glazier',     finishes: {2019:null,2020:6,2021:10,2022:3,2023:10,2024:8,2025:10} },
  { name: 'Eric Fleury',       slug: 'eric-fleury',       finishes: {2019:4,2020:3,2021:4,2022:5,2023:8,2024:3,2025:1} },
  { name: 'Jacob Newcomer',    slug: 'jacob-newcomer',    finishes: {2019:1,2020:1,2021:3,2022:1,2023:1,2024:1,2025:8} },
  { name: 'Michael Tumey',     slug: 'michael-tumey',     finishes: {2019:5,2020:4,2021:5,2022:4,2023:3,2024:9,2025:5} },
  { name: 'Robert Ray',        slug: 'robert-ray',        finishes: {2019:null,2020:10,2021:8,2022:7,2023:5,2024:4,2025:9} },
  { name: 'Shashank Bharadwaj',slug: 'shashank-bharadwaj',finishes: {2019:null,2020:null,2021:null,2022:null,2023:5,2024:7,2025:null} },
  { name: 'Shorty Hoffman',    slug: 'shorty-hoffman',    finishes: {2019:2,2020:2,2021:1,2022:9,2023:2,2024:2,2025:3} },
]

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025]

function finishColor(pos: number | null | undefined): { bg: string; color: string } {
  if (pos == null) return { bg: 'transparent', color: '#d1d5db' }
  if (pos === 1)  return { bg: '#fef9c3', color: '#854d0e' }   // gold
  if (pos === 2)  return { bg: '#f1f5f9', color: '#475569' }   // silver
  if (pos === 3)  return { bg: '#fff7ed', color: '#9a3412' }   // bronze
  if (pos <= 5)   return { bg: '#f0fdf4', color: '#15803d' }   // top half green
  if (pos >= 9)   return { bg: '#fef2f2', color: '#dc2626' }   // bottom 2 red
  return { bg: '#f8f9fb', color: '#374151' }
}

function FinishCell({ pos, isWinner, isLast }: { pos: number | null | undefined; isWinner: boolean; isLast: boolean }) {
  const { bg, color } = finishColor(pos)
  return (
    <td style={{ padding: '5px 8px', textAlign: 'center', background: bg }}>
      {pos != null ? (
        <span style={{
          fontSize: '0.82rem', fontWeight: pos <= 3 ? 800 : 600, color,
          display: 'inline-flex', alignItems: 'center', gap: 3,
        }}>
          {pos}
          {isWinner && <span title="Champion" style={{ fontSize: '0.7rem' }}>🏆</span>}
          {isLast && <span title="Last place" style={{ fontSize: '0.7rem' }}>💩</span>}
        </span>
      ) : (
        <span style={{ fontSize: '0.75rem', color: '#d1d5db' }}>—</span>
      )}
    </td>
  )
}

export default function HistoryPage() {
  // Compute career stats for each active manager
  const managerStats = ACTIVE_MANAGERS.map(m => {
    const positions = Object.values(m.finishes).filter((p): p is number => p != null)
    const wins = CHAMPIONS.filter(c => c.winner === m.name).length
    const lasts = CHAMPIONS.filter(c => c.last === m.name).length
    const avg = positions.length > 0 ? (positions.reduce((a, b) => a + b, 0) / positions.length) : null
    const seasons = positions.length
    return { ...m, wins, lasts, avg, seasons }
  }).sort((a, b) => (b.wins - a.wins) || (a.avg ?? 99) - (b.avg ?? 99))

  const winnerMap = Object.fromEntries(CHAMPIONS.map(c => [c.year, c.winner]))
  const lastMap = Object.fromEntries(CHAMPIONS.map(c => [c.year, c.last]))

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 8 }}>
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>League</Link>
          <span style={{ margin: '0 6px', color: '#d1d5db' }}>›</span>
          <span style={{ color: '#374151' }}>History</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
          League History
        </h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.84rem' }}>
          Westminster Auction Baseball · WAB era 2019–2025
        </p>
      </div>

      {/* Champions banner */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 12 }}>
          Champions
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CHAMPIONS.map(c => (
            <div key={c.year} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 8, minWidth: 100, textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#92400e', letterSpacing: '0.06em' }}>{c.year}</div>
              <div style={{ fontSize: '1.1rem', lineHeight: 1 }}>🏆</div>
              <Link href={`/team/${ACTIVE_MANAGERS.find(m => m.name === c.winner)?.slug ?? ''}`}
                style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827', textDecoration: 'none', textAlign: 'center' }}>
                {c.winner.split(' ')[0]} {c.winner.split(' ')[1]}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Standings grid */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '12px 16px', background: '#f8f9fb', borderBottom: '1px solid #e2e6eb' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>
            Standings by Year
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fb' }}>
                <th style={{ padding: '7px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e2e6eb', whiteSpace: 'nowrap' }}>
                  Manager
                </th>
                {YEARS.map(y => (
                  <th key={y} style={{ padding: '7px 8px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e2e6eb', minWidth: 52 }}>
                    {y}
                  </th>
                ))}
                <th style={{ padding: '7px 10px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e2e6eb' }}>Avg</th>
                <th style={{ padding: '7px 10px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e2e6eb' }}>🏆</th>
              </tr>
            </thead>
            <tbody>
              {managerStats.map((m, i) => (
                <tr key={m.slug} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <td style={{ padding: '6px 14px', whiteSpace: 'nowrap' }}>
                    <Link href={`/team/${m.slug}`} style={{ fontWeight: 600, color: '#111827', textDecoration: 'none', fontSize: '0.85rem' }}>
                      {m.name}
                    </Link>
                  </td>
                  {YEARS.map(y => (
                    <FinishCell
                      key={y}
                      pos={(m.finishes as Record<number, number | null>)[y]}
                      isWinner={winnerMap[y] === m.name}
                      isLast={lastMap[y] === m.name}
                    />
                  ))}
                  <td style={{ padding: '6px 10px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>
                      {m.avg != null ? m.avg.toFixed(1) : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: m.wins > 0 ? '#854d0e' : '#d1d5db' }}>
                      {m.wins > 0 ? m.wins : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Color key */}
        <div style={{ padding: '10px 16px', background: '#f8f9fb', borderTop: '1px solid #e2e6eb', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { bg:'#fef9c3', color:'#854d0e', label:'1st' },
            { bg:'#f1f5f9', color:'#475569', label:'2nd' },
            { bg:'#fff7ed', color:'#9a3412', label:'3rd' },
            { bg:'#f0fdf4', color:'#15803d', label:'4th–5th' },
            { bg:'#fef2f2', color:'#dc2626', label:'9th–10th' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: s.bg, border: '1px solid rgba(0,0,0,0.08)', display: 'inline-block' }} />
              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Career stats table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: '#f8f9fb', borderBottom: '1px solid #e2e6eb' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>
            Career Summary (WAB Era)
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ background: '#f8f9fb' }}>
              {['Manager','Seasons','Avg Finish','Titles','Last Place'].map(h => (
                <th key={h} style={{ padding: '7px 14px', textAlign: h === 'Manager' ? 'left' : 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e2e6eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {managerStats.map(m => (
              <tr key={m.slug} style={{ borderBottom: '1px solid #f0f2f5' }}>
                <td style={{ padding: '7px 14px' }}>
                  <Link href={`/team/${m.slug}`} style={{ fontWeight: 600, color: '#111827', textDecoration: 'none' }}>
                    {m.name}
                  </Link>
                </td>
                <td style={{ padding: '7px 14px', textAlign: 'center', color: '#6b7280' }}>{m.seasons}</td>
                <td style={{ padding: '7px 14px', textAlign: 'center', fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                  {m.avg != null ? m.avg.toFixed(1) : '—'}
                </td>
                <td style={{ padding: '7px 14px', textAlign: 'center' }}>
                  {m.wins > 0
                    ? <span style={{ fontWeight: 800, color: '#854d0e' }}>{'🏆'.repeat(m.wins)}</span>
                    : <span style={{ color: '#d1d5db' }}>—</span>
                  }
                </td>
                <td style={{ padding: '7px 14px', textAlign: 'center' }}>
                  {m.lasts > 0
                    ? <span style={{ fontWeight: 700, color: '#dc2626' }}>{'💩'.repeat(m.lasts)}</span>
                    : <span style={{ color: '#d1d5db' }}>—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
