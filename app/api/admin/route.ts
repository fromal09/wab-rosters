import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { neon } from '@neondatabase/serverless'
import { getDeadMoney, CURRENT_YEAR } from '@/lib/constants'

function db() { return neon(process.env.DATABASE_URL!) }

async function assertCommissioner() {
  const cookieStore = await cookies()
  if (cookieStore.get('wab_commish_session')?.value !== 'authenticated') throw new Error('Unauthorized')
}

async function getManagerId(sql: ReturnType<typeof db>, slug: string) {
  const rows = await sql`SELECT id FROM managers WHERE slug = ${slug}`
  return (rows[0]?.id as string) ?? null
}

async function getOrCreatePlayer(sql: ReturnType<typeof db>, name: string) {
  const ex = await sql`SELECT id FROM players WHERE name = ${name}`
  if (ex[0]) return ex[0].id as string
  try {
    const cr = await sql`INSERT INTO players (name) VALUES (${name}) RETURNING id`
    return cr[0]?.id as string
  } catch {
    const rf = await sql`SELECT id FROM players WHERE name = ${name}`
    return (rf[0]?.id as string) ?? null
  }
}

export async function POST(request: NextRequest) {
  try { await assertCommissioner() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const body = await request.json()
  const { action } = body
  const sql = db()
  const year: number = body.year ?? CURRENT_YEAR
  const now = new Date().toISOString()

  if (action === 'drop') {
    const { managerSlug, playerName, note } = body
    const managerId = await getManagerId(sql, managerSlug)
    if (!managerId) return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    const playerId = await getOrCreatePlayer(sql, playerName)
    if (!playerId) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    const slots = await sql`
      SELECT id, salary FROM roster_slots
      WHERE player_id=${playerId} AND manager_id=${managerId} AND year=${year} AND slot_type!='dropped'
    `
    if (!slots[0]) return NextResponse.json({ error: 'Player not on active roster' }, { status: 404 })
    const dead = getDeadMoney(slots[0].salary as number)
    await sql`UPDATE roster_slots SET slot_type='dropped', dead_money=${dead}, updated_at=${now} WHERE id=${slots[0].id}`
    await sql`INSERT INTO transactions (year,type,player_id,manager_id,price,is_draft_day,transaction_date,note)
              VALUES (${year},'drop',${playerId},${managerId},${slots[0].salary},false,${now},${note??null})`
    return NextResponse.json({ ok: true, dead_money: dead })
  }

  if (action === 'claim') {
    const { managerSlug, playerName, salary, slotType = 'MLB', note } = body
    const managerId = await getManagerId(sql, managerSlug)
    if (!managerId) return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    const playerId = await getOrCreatePlayer(sql, playerName)
    if (!playerId) return NextResponse.json({ error: 'Could not resolve player' }, { status: 500 })
    await sql`INSERT INTO roster_slots (player_id,manager_id,year,slot_type,service_year,salary,is_franchise_player)
              VALUES (${playerId},${managerId},${year},${slotType},0,${salary},false)`
    await sql`INSERT INTO transactions (year,type,player_id,manager_id,price,is_draft_day,transaction_date,note)
              VALUES (${year},'claim',${playerId},${managerId},${salary},false,${now},${note??null})`
    return NextResponse.json({ ok: true })
  }

  if (action === 'trade') {
    const { managerASlug, managerBSlug, playersAtoB=[], playersBtoA=[], budgetAtoB=0, budgetBtoA=0, note=null } = body
    const aId = await getManagerId(sql, managerASlug)
    const bId = await getManagerId(sql, managerBSlug)
    if (!aId || !bId) return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    for (const pName of playersAtoB) {
      const pid = await getOrCreatePlayer(sql, pName); if (!pid) continue
      await sql`UPDATE roster_slots SET manager_id=${bId},updated_at=${now} WHERE player_id=${pid} AND manager_id=${aId} AND year=${year} AND slot_type!='dropped'`
      await sql`INSERT INTO transactions (year,type,player_id,manager_id,counterpart_manager_id,is_draft_day,transaction_date,note) VALUES (${year},'trade_send',${pid},${aId},${bId},false,${now},${note}),(${year},'trade_receive',${pid},${bId},${aId},false,${now},${note})`
    }
    for (const pName of playersBtoA) {
      const pid = await getOrCreatePlayer(sql, pName); if (!pid) continue
      await sql`UPDATE roster_slots SET manager_id=${aId},updated_at=${now} WHERE player_id=${pid} AND manager_id=${bId} AND year=${year} AND slot_type!='dropped'`
      await sql`INSERT INTO transactions (year,type,player_id,manager_id,counterpart_manager_id,is_draft_day,transaction_date,note) VALUES (${year},'trade_send',${pid},${bId},${aId},false,${now},${note}),(${year},'trade_receive',${pid},${aId},${bId},false,${now},${note})`
    }
    if (budgetAtoB > 0) await sql`INSERT INTO budget_transactions (manager_id,year,amount,note) VALUES (${aId},${year},${-budgetAtoB},${'Trade to '+managerBSlug+(note?': '+note:'')}),(${bId},${year},${budgetAtoB},${'Trade from '+managerASlug+(note?': '+note:'')})`
    if (budgetBtoA > 0) await sql`INSERT INTO budget_transactions (manager_id,year,amount,note) VALUES (${bId},${year},${-budgetBtoA},${'Trade to '+managerASlug+(note?': '+note:'')}),(${aId},${year},${budgetBtoA},${'Trade from '+managerBSlug+(note?': '+note:'')})`
    return NextResponse.json({ ok: true })
  }

  if (action === 'budget') {
    const { managerSlug, amount, note } = body
    const managerId = await getManagerId(sql, managerSlug)
    if (!managerId) return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    await sql`INSERT INTO budget_transactions (manager_id,year,amount,note) VALUES (${managerId},${year},${amount},${note??null})`
    return NextResponse.json({ ok: true })
  }

  if (action === 'il_move') {
    const { managerSlug, playerName, toSlot } = body
    const managerId = await getManagerId(sql, managerSlug)
    if (!managerId) return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    const playerId = await getOrCreatePlayer(sql, playerName)
    if (!playerId) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    await sql`UPDATE roster_slots SET slot_type=${toSlot},updated_at=${now} WHERE player_id=${playerId} AND manager_id=${managerId} AND year=${year} AND slot_type!='dropped'`
    return NextResponse.json({ ok: true })
  }

  if (action === 'update_salary') {
    const { managerSlug, playerName, newSalary } = body
    const managerId = await getManagerId(sql, managerSlug)
    if (!managerId) return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    const playerId = await getOrCreatePlayer(sql, playerName)
    if (!playerId) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    await sql`UPDATE roster_slots SET salary=${parseInt(newSalary)},updated_at=${now} WHERE player_id=${playerId} AND manager_id=${managerId} AND year=${year} AND slot_type!='dropped'`
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
