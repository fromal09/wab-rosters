import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { neon } from '@neondatabase/serverless'

function db() { return neon(process.env.DATABASE_URL!) }

async function assertCommissioner() {
  const cookieStore = await cookies()
  if (cookieStore.get('wab_commish_session')?.value !== 'authenticated') throw new Error('Unauthorized')
}

export async function GET() {
  try { await assertCommissioner() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const sql = db()
  const rows = await sql`
    SELECT id, action, description, created_at
    FROM admin_action_log
    ORDER BY created_at DESC
    LIMIT 50
  `
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  try { await assertCommissioner() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const sql = db()
  const { logId } = await request.json()
  if (!logId) return NextResponse.json({ error: 'logId required' }, { status: 400 })

  try {
    const rows = await sql`SELECT * FROM admin_action_log WHERE id = ${logId}`
    if (!rows.length) return NextResponse.json({ error: 'Log entry not found' }, { status: 404 })
    const entry = rows[0]
    const snap  = entry.snapshot as Record<string, unknown>
    const action = entry.action as string

    // ── Restore snapshot based on action type ────────────────────────────────
    if (action === 'il_move') {
      const { slotId, oldSlotType } = snap
      await sql`UPDATE roster_slots SET slot_type = ${oldSlotType} WHERE id = ${slotId}`

    } else if (action === 'drop') {
      const { slotId, oldSlotType, oldDeadMoney } = snap
      // Restore the slot to active status
      await sql`UPDATE roster_slots SET slot_type = ${oldSlotType}, dead_money = ${oldDeadMoney ?? null} WHERE id = ${slotId}`
      // Delete the drop transaction
      if (snap.transactionId) await sql`DELETE FROM transactions WHERE id = ${snap.transactionId as string}`

    } else if (action === 'claim') {
      const { slotId, transactionId } = snap
      await sql`DELETE FROM roster_slots WHERE id = ${slotId}`
      if (transactionId) await sql`DELETE FROM transactions WHERE id = ${transactionId as string}`

    } else if (action === 'update_salary') {
      const { slotId, oldSalary } = snap
      await sql`UPDATE roster_slots SET salary = ${oldSalary} WHERE id = ${slotId}`

    } else if (action === 'trade') {
      // Re-assign each player back to original manager, delete transactions and budget entries
      const { playerMoves, budgetIds, keeperIds } = snap as {
        playerMoves: { slotId: string; originalManagerId: string }[]
        budgetIds: string[]
        keeperIds: string[]
      }
      for (const m of (playerMoves ?? [])) {
        await sql`UPDATE roster_slots SET manager_id = ${m.originalManagerId} WHERE id = ${m.slotId}`
      }
      for (const id of (budgetIds ?? [])) await sql`DELETE FROM budget_transactions WHERE id = ${id}`
      for (const id of (keeperIds ?? [])) await sql`DELETE FROM keeper_slot_transactions WHERE id = ${id}`
      // Remove trade transactions (trade_send / trade_receive pairs within same timestamp)
      if (snap.tradeTimestamp) {
        await sql`DELETE FROM transactions WHERE transaction_date = ${snap.tradeTimestamp as string} AND type IN ('trade_send','trade_receive')`
      }

    } else if (action === 'budget') {
      const { transactionId } = snap
      if (transactionId) await sql`DELETE FROM budget_transactions WHERE id = ${transactionId as string}`

    } else if (action === 'keeper_slots') {
      const { transactionId } = snap
      if (transactionId) await sql`DELETE FROM keeper_slot_transactions WHERE id = ${transactionId as string}`

    } else if (action === 'set_franchise') {
      const { slotIds, oldValue } = snap as { slotIds: string[]; oldValue: boolean }
      for (const id of (slotIds ?? [])) {
        await sql`UPDATE roster_slots SET is_franchise_player = ${oldValue} WHERE id = ${id}`
      }

    } else {
      return NextResponse.json({ error: `No rollback defined for action: ${action}` }, { status: 400 })
    }

    // Delete the log entry after successful rollback
    await sql`DELETE FROM admin_action_log WHERE id = ${logId}`
    return NextResponse.json({ ok: true, rolledBack: action })

  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
