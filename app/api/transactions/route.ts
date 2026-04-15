import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CURRENT_YEAR } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const managerSlug = searchParams.get('manager')
  const year = parseInt(searchParams.get('year') ?? String(CURRENT_YEAR))
  const page = parseInt(searchParams.get('page') ?? '0')
  const pageSize = 50
  const offset = page * pageSize

  if (managerSlug) {
    const mgrs = await query`SELECT id FROM managers WHERE slug = ${managerSlug}`
    const mgr = mgrs[0]
    if (!mgr) return NextResponse.json({ transactions: [], total: 0 })

    const transactions = await query`
      SELECT t.id, t.year, t.type, t.price, t.transaction_date, t.note,
             p.name AS player_name,
             cm.name AS counterpart_name, cm.slug AS counterpart_slug
      FROM transactions t
      LEFT JOIN players p ON p.id = t.player_id
      LEFT JOIN managers cm ON cm.id = t.counterpart_manager_id
      WHERE t.manager_id = ${mgr.id} AND t.year = ${year} AND t.is_draft_day = false
      ORDER BY t.transaction_date DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    const countRows = await query`
      SELECT COUNT(*) AS total FROM transactions
      WHERE manager_id = ${mgr.id} AND year = ${year} AND is_draft_day = false
    `
    return NextResponse.json({ transactions, total: Number(countRows[0]?.total ?? 0) })
  }

  // League-wide
  const transactions = await query`
    SELECT t.id, t.year, t.type, t.price, t.transaction_date, t.note,
           p.name AS player_name,
           m.name AS manager_name, m.slug AS manager_slug,
           cm.name AS counterpart_name
    FROM transactions t
    LEFT JOIN players p ON p.id = t.player_id
    LEFT JOIN managers m ON m.id = t.manager_id
    LEFT JOIN managers cm ON cm.id = t.counterpart_manager_id
    WHERE t.year = ${year} AND t.is_draft_day = false
    ORDER BY t.transaction_date DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `
  const countRows = await query`
    SELECT COUNT(*) AS total FROM transactions
    WHERE year = ${year} AND is_draft_day = false
  `
  return NextResponse.json({ transactions, total: Number(countRows[0]?.total ?? 0) })
}
