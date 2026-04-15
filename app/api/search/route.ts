import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CURRENT_YEAR } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])
  const year = parseInt(request.nextUrl.searchParams.get('year') ?? String(CURRENT_YEAR))
  const pattern = `%${q}%`

  const results = await query`
    SELECT p.id, p.name,
           rs.slot_type, rs.salary, rs.service_year,
           m.name AS manager_name, m.slug AS manager_slug
    FROM players p
    LEFT JOIN roster_slots rs
      ON rs.player_id = p.id AND rs.year = ${year} AND rs.slot_type != 'dropped'
    LEFT JOIN managers m ON m.id = rs.manager_id
    WHERE p.name ILIKE ${pattern}
    ORDER BY
      CASE WHEN LOWER(p.name) = LOWER(${q}) THEN 0
           WHEN LOWER(p.name) LIKE LOWER(${q} || '%') THEN 1
           ELSE 2 END,
      p.name
    LIMIT 12
  `

  return NextResponse.json(results)
}
