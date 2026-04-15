import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

  const players = await query`SELECT id, name FROM players WHERE name = ${name}`
  const player = players[0]
  if (!player) return NextResponse.json({ slots: [], transactions: [] })

  const slots = await query`
    SELECT rs.year, rs.slot_type, rs.service_year, rs.salary, rs.dead_money,
           rs.is_franchise_player, m.name AS manager_name, m.slug AS manager_slug
    FROM roster_slots rs
    JOIN managers m ON m.id = rs.manager_id
    WHERE rs.player_id = ${player.id}
    ORDER BY rs.year DESC
  `

  const transactions = await query`
    SELECT t.year, t.type, t.price, t.transaction_date, t.note, m.name AS manager_name
    FROM transactions t
    JOIN managers m ON m.id = t.manager_id
    WHERE t.player_id = ${player.id} AND t.is_draft_day = false
    ORDER BY t.transaction_date ASC NULLS LAST, t.year ASC
    LIMIT 100
  `

  return NextResponse.json({ player, slots, transactions })
}
