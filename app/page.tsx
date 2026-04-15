import { getAllTeamSummaries } from '@/lib/data'
import TeamCard from '@/components/TeamCard'
import { CURRENT_YEAR } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function LeaguePage() {
  const teams = await getAllTeamSummaries(CURRENT_YEAR)

  const totalSalary = teams.reduce((a, t) => a + t.salary, 0)
  const avgCapSpace = Math.round(teams.reduce((a, t) => a + t.cap_space, 0) / teams.length)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {CURRENT_YEAR} WAB Rosters
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Westminster Auction Baseball · 10 teams · Click a team to view full roster
        </p>
      </div>

      {/* League-wide stats bar */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 28,
          padding: '12px 18px',
          background: '#1a1d27',
          border: '1px solid #2e3347',
          borderRadius: 8,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Season', value: String(CURRENT_YEAR) },
          { label: 'Teams', value: '10' },
          { label: 'League Salary', value: `$${totalSalary.toLocaleString()}` },
          { label: 'Avg Cap Space', value: `$${avgCapSpace}` },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
              {s.label}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Team grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
        }}
      >
        {teams.map(t => (
          <TeamCard key={t.manager.id} {...t} />
        ))}
      </div>

      {/* Color legend */}
      <div style={{ marginTop: 36, padding: '14px 18px', background: '#1a1d27', border: '1px solid #2e3347', borderRadius: 8 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
          Service Year Legend
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(yr => {
            const bg = yr === 0 ? '#e2e8f0' : [
              '#d0dfe3','#dae5b6','#e2eb89','#ecf25b','#f6f82f','#ffff00',
              '#d6ff29','#abff55','#80ff7f','#56ffa9','#2affd4','#00ffff',
            ][yr - 1]
            return (
              <div key={yr} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '1.4rem', height: '1.4rem', borderRadius: 4,
                  background: bg, color: '#1f2937',
                  fontSize: '0.63rem', fontWeight: 700,
                  border: '1px solid rgba(0,0,0,0.12)',
                }}>{yr}</span>
                {yr === 0 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>0-yr</span>}
              </div>
            )
          })}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, borderLeft: '1px solid #2e3347', paddingLeft: 8 }}>
            <span style={{ fontSize: '0.65rem', color: '#4f7ef0' }}>★</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Franchise player</span>
          </div>
        </div>
      </div>
    </div>
  )
}
