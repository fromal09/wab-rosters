import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function fetchSavantPercentiles(mlbam_id: number) {
  try {
    const res = await fetch(
      `https://baseballsavant.mlb.com/player-services/percentile-ranks?playerId=${mlbam_id}`,
      {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      }
    )
    if (!res.ok) return null
    const raw = await res.json()
    const entries: Record<string,unknown>[] = Array.isArray(raw) ? raw : Object.values(raw)
    if (!entries.length) return null
    return entries.sort((a, b) => (b.year as number) - (a.year as number))[0] ?? null
  } catch { return null }
}

async function fetchMLBStats(mlbam_id: number) {
  try {
    // Fetch season stats + expected stats via separate hydrations
    const url = `https://statsapi.mlb.com/api/v1/people/${mlbam_id}?` +
      `hydrate=stats(group=[hitting,pitching],type=season,season=2026),` +
      `stats(group=[hitting,pitching],type=expectedStatistics,season=2026),` +
      `currentTeam`
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    if (!res.ok) return null
    const data = await res.json()
    const person = data.people?.[0]
    if (!person) return null

    const stats: Record<string, Record<string,unknown>> = {}
    for (const sg of person.stats ?? []) {
      const group = (sg.group?.displayName as string)?.toLowerCase()
      const type  = (sg.type?.displayName  as string)?.toLowerCase()
      const split = sg.splits?.[0]?.stat
      if (split && group && type) {
        // key: "hitting_season", "hitting_expectedstatistics", etc.
        stats[`${group}_${type}`] = split
      }
    }

    return {
      name:     person.fullName,
      team:     person.currentTeam?.name ?? '—',
      teamAbbr: person.currentTeam?.abbreviation ?? '—',
      position: person.primaryPosition?.abbreviation ?? '—',
      hitting:          stats['hitting_season'] ?? null,
      pitching:         stats['pitching_season'] ?? null,
      hittingExpected:  stats['hitting_expectedstatistics'] ?? null,
      pitchingExpected: stats['pitching_expectedstatistics'] ?? null,
      // Log all keys for debugging
      _statKeys: Object.keys(stats),
    }
  } catch { return null }
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')?.trim()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const players = await query`
    SELECT id, name, mlbam_id, position FROM players WHERE LOWER(name) = LOWER(${name})
  `
  if (!players.length) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  const player = players[0]

  if (!player.mlbam_id) {
    return NextResponse.json({
      player: { name: player.name, position: player.position },
      needs_id: true,
    })
  }

  const mlbam_id = player.mlbam_id as number

  // Check 6hr cache
  const cached = await query`
    SELECT data FROM player_card_cache
    WHERE mlbam_id = ${mlbam_id} AND updated_at > NOW() - INTERVAL '6 hours'
  `
  if (cached.length) {
    return NextResponse.json({
      player: { name: player.name, position: player.position },
      ...(cached[0].data as Record<string,unknown>),
      cached: true,
    })
  }

  const [savant, mlb] = await Promise.all([
    fetchSavantPercentiles(mlbam_id).catch(() => null),
    fetchMLBStats(mlbam_id).catch(() => null),
  ])

  const cardData = { savant, mlb }

  await query`
    INSERT INTO player_card_cache (mlbam_id, data, updated_at)
    VALUES (${mlbam_id}, ${JSON.stringify(cardData)}, NOW())
    ON CONFLICT (mlbam_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
  `

  return NextResponse.json({
    player: { name: player.name, position: player.position },
    ...cardData,
  })
}
