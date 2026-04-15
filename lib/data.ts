import { query } from './db'
import { CURRENT_YEAR } from './constants'

// Managers currently active in the league
const ACTIVE_MANAGER_SLUGS = new Set([
  'adam-fromal','arjun-baradwaj','bretton-mcilrath','chris-glazier',
  'eric-fleury','jacob-newcomer','michael-tumey','robert-ray',
  'shashank-bharadwaj','shorty-hoffman',
])

export async function getAllManagers() {
  return query`SELECT id, name, slug FROM managers ORDER BY name`
}

export async function getActiveManagers() {
  const all = await query`SELECT id, name, slug FROM managers ORDER BY name`
  return all.filter(m => ACTIVE_MANAGER_SLUGS.has(m.slug as string))
}

export async function getManagerBySlug(slug: string) {
  const rows = await query`SELECT id, name, slug FROM managers WHERE slug = ${slug}`
  return rows[0] ?? null
}

export async function getRosterForManager(managerId: string, year = CURRENT_YEAR) {
  return query`
    SELECT rs.id, rs.slot_type, rs.service_year, rs.salary, rs.dead_money,
           rs.is_franchise_player, p.name AS player_name
    FROM roster_slots rs
    JOIN players p ON p.id = rs.player_id
    WHERE rs.manager_id = ${managerId} AND rs.year = ${year}
    ORDER BY rs.salary DESC
  `
}

export async function getBudgetForManager(managerId: string, year = CURRENT_YEAR) {
  const transactions = await query`
    SELECT amount, note, created_at
    FROM budget_transactions
    WHERE manager_id = ${managerId} AND year = ${year}
    ORDER BY created_at ASC
  `
  const currentBudget = transactions.reduce((acc, t) => acc + (t.amount as number), 0)
  return { transactions, currentBudget }
}

export async function getAllTeamSummaries(year = CURRENT_YEAR) {
  const managers = await query`
    SELECT id, name, slug FROM managers
    WHERE slug IN (
      'adam-fromal','arjun-baradwaj','bretton-mcilrath','chris-glazier',
      'eric-fleury','jacob-newcomer','michael-tumey','robert-ray',
      'shashank-bharadwaj','shorty-hoffman'
    )
    ORDER BY name
  `

  const summaries = await query`
    SELECT
      rs.manager_id,
      SUM(CASE WHEN rs.slot_type != 'dropped' THEN rs.salary ELSE 0 END) +
        SUM(CASE WHEN rs.slot_type = 'dropped'
            THEN COALESCE(rs.dead_money, CEIL(rs.salary::float/2)) ELSE 0 END) AS total_salary,
      COUNT(CASE WHEN rs.slot_type = 'IL' THEN 1 END)          AS injured_count,
      COUNT(CASE WHEN rs.slot_type = 'dropped' THEN 1 END)     AS dropped_count,
      COUNT(CASE WHEN rs.slot_type != 'dropped'
                 AND rs.service_year >= 1 THEN 1 END)          AS ht_eligible_count
    FROM roster_slots rs
    WHERE rs.year = ${year}
    GROUP BY rs.manager_id
  `

  const budgets = await query`
    SELECT manager_id, SUM(amount) AS budget
    FROM budget_transactions
    WHERE year = ${year}
    GROUP BY manager_id
  `

  const summaryMap = Object.fromEntries(summaries.map(s => [s.manager_id as string, s]))
  const budgetMap = Object.fromEntries(budgets.map(b => [b.manager_id as string, Number(b.budget)]))

  return managers.map(m => {
    const s = summaryMap[m.id as string] ?? {}
    const budget = budgetMap[m.id as string] ?? 0
    const salary = Number(s.total_salary ?? 0)
    return {
      manager: m as { id: string; name: string; slug: string },
      budget,
      salary,
      cap_space: budget - salary,
      injured_count: Number(s.injured_count ?? 0),
      dropped_count: Number(s.dropped_count ?? 0),
      ht_eligible_count: Number(s.ht_eligible_count ?? 0),
    }
  })
}

export async function getPlayerHistory(playerName: string) {
  const players = await query`SELECT id, name FROM players WHERE name = ${playerName}`
  const player = players[0]
  if (!player) return null

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
    ORDER BY t.transaction_date DESC
    LIMIT 50
  `

  return { player, slots, transactions }
}

export async function getTransactionsForManager(
  managerId: string, year = CURRENT_YEAR, page = 0, pageSize = 50
) {
  const offset = page * pageSize
  const transactions = await query`
    SELECT t.id, t.year, t.type, t.price, t.transaction_date, t.note,
           p.name AS player_name,
           cm.name AS counterpart_name, cm.slug AS counterpart_slug
    FROM transactions t
    LEFT JOIN players p ON p.id = t.player_id
    LEFT JOIN managers cm ON cm.id = t.counterpart_manager_id
    WHERE t.manager_id = ${managerId} AND t.year = ${year} AND t.is_draft_day = false
    ORDER BY t.transaction_date DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `
  const countRows = await query`
    SELECT COUNT(*) AS total FROM transactions
    WHERE manager_id = ${managerId} AND year = ${year} AND is_draft_day = false
  `
  return { transactions, total: Number(countRows[0]?.total ?? 0) }
}
