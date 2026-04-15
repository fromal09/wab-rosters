import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CURRENT_YEAR } from '@/lib/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const year = parseInt(request.nextUrl.searchParams.get('year') ?? String(CURRENT_YEAR))

  const managers = await query`SELECT id, name, slug FROM managers WHERE slug = ${slug}`
  const manager = managers[0]
  if (!manager) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [roster, budgetTxns, keeperTxns, notes] = await Promise.all([
    query`
      SELECT p.name AS player_name, rs.service_year, rs.salary,
             rs.slot_type, rs.is_franchise_player::boolean AS is_franchise_player, rs.dead_money
      FROM roster_slots rs
      JOIN players p ON p.id = rs.player_id
      WHERE rs.manager_id = ${manager.id} AND rs.year = ${year}
      ORDER BY rs.salary DESC
    `,
    query`
      SELECT amount, note, created_at FROM budget_transactions
      WHERE manager_id = ${manager.id} AND year = ${year}
      ORDER BY created_at ASC
    `,
    query`
      SELECT delta, note, created_at FROM keeper_slot_transactions
      WHERE manager_id = ${manager.id} AND year = ${year}
      ORDER BY created_at ASC
    `,
    query`
      SELECT id, note, created_at FROM team_notes
      WHERE manager_id = ${manager.id} AND year = ${year}
      ORDER BY created_at ASC
    `,
  ])

  const currentBudget = budgetTxns.reduce((a, t) => a + (t.amount as number), 0)
  const keeperSlots = keeperTxns.reduce((a, t) => a + (t.delta as number), 0)

  return NextResponse.json({
    manager, roster, year,
    budget: { transactions: budgetTxns, currentBudget },
    keeperSlots: { transactions: keeperTxns, current: keeperSlots },
    notes,
  })
}
