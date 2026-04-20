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

  try {
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

    // Keeper slot transfers
    const keeperAtoB = parseInt(body.keeperAtoB) || 0
    const keeperBtoA = parseInt(body.keeperBtoA) || 0
    if (keeperAtoB > 0) await sql`INSERT INTO keeper_slot_transactions (manager_id,year,delta,note) VALUES (${aId},${year},${-keeperAtoB},${'Trade to '+managerBSlug+(note?': '+note:'')}),(${bId},${year},${keeperAtoB},${'Trade from '+managerASlug+(note?': '+note:'')})`
    if (keeperBtoA > 0) await sql`INSERT INTO keeper_slot_transactions (manager_id,year,delta,note) VALUES (${bId},${year},${-keeperBtoA},${'Trade to '+managerASlug+(note?': '+note:'')}),(${aId},${year},${keeperBtoA},${'Trade from '+managerBSlug+(note?': '+note:'')})`

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
    // Case-insensitive player lookup — never create a new record for a move
    const playerRows = await sql`SELECT id FROM players WHERE LOWER(name) = LOWER(${playerName.trim()})`
    if (!playerRows.length) return NextResponse.json({ error: `Player not found: "${playerName}"` }, { status: 404 })
    const playerId = playerRows[0].id
    const updated = await sql`
      UPDATE roster_slots SET slot_type=${toSlot}, updated_at=${now}
      WHERE player_id=${playerId} AND manager_id=${managerId} AND year=${year} AND slot_type != 'dropped'
      RETURNING id
    `
    if (!updated.length) return NextResponse.json({ error: `No active roster slot found for "${playerName}" on this team in ${year}` }, { status: 404 })
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

  // ── Toggle franchise player ────────────────────────────────────────────────
  if (action === 'set_franchise') {
    const { managerSlug, playerName, value } = body
    const managerId = await getManagerId(sql, managerSlug)
    if (!managerId) return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    const playerId = await getOrCreatePlayer(sql, playerName)
    if (!playerId) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    await sql`
      UPDATE roster_slots SET is_franchise_player = ${value === true}
      WHERE player_id = ${playerId} AND manager_id = ${managerId}
    `
    return NextResponse.json({ ok: true })
  }

  // ── Keeper slot adjustment ─────────────────────────────────────────────────
  if (action === 'keeper_slots') {
    const { managerSlug, delta, note } = body
    const managerId = await getManagerId(sql, managerSlug)
    if (!managerId) return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    await sql`INSERT INTO keeper_slot_transactions (manager_id, year, delta, note) VALUES (${managerId}, ${year}, ${parseInt(delta)}, ${note ?? null})`
    return NextResponse.json({ ok: true })
  }

  // ── Bulk auto-link MLBAM IDs ───────────────────────────────────────────────
  if (action === 'bulk_link_mlbam') {
    // Get all players missing an MLBAM ID
    const unlinked = await sql`SELECT id, name FROM players WHERE mlbam_id IS NULL ORDER BY name`

    // Build name→id map from MLB Stats API across all relevant seasons
    // Uses fields param to keep responses small
    const mlbMap = new Map<string, number>()
    const SEASONS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019]
    const SPORTS  = [1, 11, 12, 13, 14, 15, 16] // MLB + all MiLB levels

    for (const sport of SPORTS) {
      for (const season of SEASONS) {
        try {
          const res = await fetch(
            `https://statsapi.mlb.com/api/v1/sports/${sport}/players?season=${season}&fields=people,id,fullName`,
            { signal: AbortSignal.timeout(8000) }
          )
          if (!res.ok) continue
          const data = await res.json()
          for (const p of (data.people ?? [])) {
            if (p.fullName && p.id) {
              const key = p.fullName.toLowerCase().trim()
              // Prefer more recent data (don't overwrite if already set from newer season)
              if (!mlbMap.has(key)) mlbMap.set(key, p.id)
            }
          }
        } catch { /* skip on timeout/error */ }
      }
    }

    // Helper: normalize name for matching (strip accents, lowercase)
    function normName(n: string): string {
      return n.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[''`]/g, "'") // normalize apostrophes
    }

    // Build normalized map as well
    const mlbNormMap = new Map<string, number>()
    for (const [name, id] of mlbMap) {
      mlbNormMap.set(normName(name), id)
    }

    // Match and update
    const matched: string[] = []
    const unmatched: string[] = []

    for (const player of unlinked) {
      const name = player.name as string
      const id = mlbMap.get(name.toLowerCase().trim())
             ?? mlbNormMap.get(normName(name))
      if (id) {
        await sql`UPDATE players SET mlbam_id = ${id} WHERE id = ${player.id}`
        matched.push(name)
      } else {
        unmatched.push(name)
      }
    }

    // Clear cache for all newly linked players
    if (matched.length > 0) {
      const ids = await sql`SELECT mlbam_id FROM players WHERE name = ANY(${matched})`
      const mlbamIds = ids.map(r => r.mlbam_id as number).filter(Boolean)
      if (mlbamIds.length) {
        await sql`DELETE FROM player_card_cache WHERE mlbam_id = ANY(${mlbamIds})`
      }
    }

    return NextResponse.json({
      ok: true,
      total: unlinked.length,
      matched: matched.length,
      unmatched: unmatched.length,
      unmatchedNames: unmatched.sort(),
    })
  }

  // ── Link player to MLBAM ID ────────────────────────────────────────────────
  if (action === 'link_player') {
    const playerName = (body.playerName ?? '').trim()
    const mlbam_id = parseInt(body.mlbam_id)
    if (!playerName || !mlbam_id) return NextResponse.json({ error: 'playerName and mlbam_id required' }, { status: 400 })
    const rows = await sql`UPDATE players SET mlbam_id = ${mlbam_id} WHERE LOWER(name) = LOWER(${playerName}) RETURNING id`
    if (!rows.length) return NextResponse.json({ error: `Player not found: "${playerName}"` }, { status: 404 })
    // Invalidate cache so fresh data loads
    await sql`DELETE FROM player_card_cache WHERE mlbam_id = ${mlbam_id}`
    return NextResponse.json({ ok: true })
  }

  // ── Set player position ────────────────────────────────────────────────────
  if (action === 'set_position') {
    const playerName = (body.playerName ?? '').trim()
    const position   = (body.position   ?? '').trim()
    if (!playerName) return NextResponse.json({ error: 'playerName required' }, { status: 400 })
    const rows = await sql`UPDATE players SET position = ${position || null} WHERE LOWER(name) = LOWER(${playerName}) RETURNING id`
    if (!rows.length) return NextResponse.json({ error: `Player not found: "${playerName}"` }, { status: 404 })
    return NextResponse.json({ ok: true })
  }

  // ── Rename player ──────────────────────────────────────────────────────────
  if (action === 'rename_player') {
    const oldName = (body.oldName ?? '').trim()
    const newName = (body.newName ?? '').trim()
    if (!oldName || !newName) return NextResponse.json({ error: 'Both names required' }, { status: 400 })

    const oldPlayers = await sql`SELECT id FROM players WHERE LOWER(name) = LOWER(${oldName})`
    if (!oldPlayers.length) return NextResponse.json({ error: `No player found matching "${oldName}"` }, { status: 404 })
    const oldId = oldPlayers[0].id as string

    // Check if the target name already exists (merge case)
    const newPlayers = await sql`SELECT id FROM players WHERE LOWER(name) = LOWER(${newName})`

    if (newPlayers.length) {
      // Target already exists — merge by reassigning all references to the existing record
      const newId = newPlayers[0].id as string
      if (oldId === newId) return NextResponse.json({ error: 'Same player record — nothing to do' }, { status: 400 })
      await sql`UPDATE roster_slots  SET player_id = ${newId} WHERE player_id = ${oldId}`
      await sql`UPDATE transactions  SET player_id = ${newId} WHERE player_id = ${oldId}`
      await sql`DELETE FROM players WHERE id = ${oldId}`
    } else {
      // Simple rename — no conflict
      await sql`UPDATE players SET name = ${newName} WHERE id = ${oldId}`
    }

    return NextResponse.json({ ok: true })
  }

  // ── Delete team note ───────────────────────────────────────────────────────
  if (action === 'delete_note') {
    const { noteId } = body
    if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })
    await sql`DELETE FROM team_notes WHERE id = ${noteId}`
    return NextResponse.json({ ok: true })
  }

  // ── Add team note ──────────────────────────────────────────────────────────
  if (action === 'add_note') {
    const { managerSlug, note } = body
    const managerId = await getManagerId(sql, managerSlug)
    if (!managerId) return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    await sql`INSERT INTO team_notes (manager_id, year, note) VALUES (${managerId}, ${year}, ${note})`
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Admin route error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
// This file is appended — keeper_slots and add_note actions added below
