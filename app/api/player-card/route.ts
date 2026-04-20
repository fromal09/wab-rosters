import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

const IS_PITCHER = (pos: string | null) =>
  pos ? pos.split(',').some(p => ['SP','RP','P'].includes(p.trim())) : false

async function fetchSavantPercentiles(mlbam_id: number) {
  const res = await fetch(
    `https://baseballsavant.mlb.com/player-services/percentile-ranks?playerId=${mlbam_id}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return null
  const raw = await res.json()
  // Savant returns an array; find the current year entry
  const entries = Array.isArray(raw) ? raw : Object.values(raw)
  return entries.find((e: unknown) => (e as Record<string,unknown>).year == 2026)
    ?? entries[0]
    ?? null
}

async function fetchMLBStats(mlbam_id: number) {
  const url = `https://statsapi.mlb.com/api/v1/people/${mlbam_id}?hydrate=stats(group=[hitting,pitching],type=season,season=2026),currentTeam`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  const data = await res.json()
  const person = data.people?.[0]
  if (!person) return null
  const stats: Record<string, Record<string,unknown>> = {}
  for (const sg of person.stats ?? []) {
    const group = sg.group?.displayName as string
    const split = sg.splits?.[0]?.stat
    if (split) stats[group] = split
  }
  return {
    name: person.fullName,
    team: person.currentTeam?.name ?? '—',
    teamAbbr: person.currentTeam?.abbreviation ?? '—',
    position: person.primaryPosition?.abbreviation ?? '—',
    hitting: stats.hitting ?? null,
    pitching: stats.pitching ?? null,
  }
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
      player: { name: player.name, position: player.position as string },
      needs_id: true,
    })
  }

  const mlbam_id = player.mlbam_id as number

  // Check cache (6hr TTL)
  const cached = await query`
    SELECT data FROM player_card_cache
    WHERE mlbam_id = ${mlbam_id}
    AND updated_at > NOW() - INTERVAL '6 hours'
  `
  if (cached.length) {
    return NextResponse.json({
      player: { name: player.name, position: player.position as string },
      ...(cached[0].data as Record<string,unknown>),
      cached: true,
    })
  }

  // Fetch fresh data in parallel
  const [savant, mlb] = await Promise.all([
    fetchSavantPercentiles(mlbam_id).catch(() => null),
    fetchMLBStats(mlbam_id).catch(() => null),
  ])

  const cardData = { savant, mlb }

  // Upsert cache
  await query`
    INSERT INTO player_card_cache (mlbam_id, data, updated_at)
    VALUES (${mlbam_id}, ${JSON.stringify(cardData)}, NOW())
    ON CONFLICT (mlbam_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
  `

  return NextResponse.json({
    player: { name: player.name, position: player.position as string },
    ...cardData,
  })
}
