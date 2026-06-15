import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const YEAR = 2026

  const rows = await query`
    SELECT
      m.id,
      m.name,
      m.slug,
      COALESCE(SUM(CASE WHEN bt.year = ${YEAR} THEN bt.amount ELSE 0 END), 0)::int AS budget,
      COALESCE(SUM(CASE WHEN rs.year = ${YEAR} AND rs.slot_type NOT IN ('dropped') THEN rs.salary ELSE 0 END), 0)::int AS active_salary,
      COALESCE(SUM(CASE WHEN rs.year = ${YEAR} AND rs.slot_type = 'dropped' THEN COALESCE(rs.dead_money, CEIL(rs.salary / 2.0)) ELSE 0 END), 0)::int AS dead_cap
    FROM managers m
    LEFT JOIN budget_transactions bt ON bt.manager_id = m.id
    LEFT JOIN roster_slots rs ON rs.manager_id = m.id
    WHERE m.is_active = true
    GROUP BY m.id, m.name, m.slug
    ORDER BY m.name
  `

  const teams = rows.map(r => {
    const budget       = r.budget as number
    const activeSalary = r.active_salary as number
    const deadCap      = r.dead_cap as number
    const capSpace     = budget - activeSalary
    return {
      id: r.id, name: r.name, slug: r.slug,
      budget,
      activeSalary,
      deadCap,
      capSpace,
      activePct: budget > 0 ? Math.round((activeSalary / budget) * 100) : 0,
      deadPct:   budget > 0 ? Math.round((deadCap / budget) * 100)      : 0,
      spacePct:  budget > 0 ? Math.round((capSpace / budget) * 100)     : 0,
    }
  })

  const totals = {
    budget:       teams.reduce((a, t) => a + t.budget, 0),
    activeSalary: teams.reduce((a, t) => a + t.activeSalary, 0),
    deadCap:      teams.reduce((a, t) => a + t.deadCap, 0),
    capSpace:     teams.reduce((a, t) => a + t.capSpace, 0),
  }
  const league = {
    ...totals,
    activePct: totals.budget > 0 ? Math.round((totals.activeSalary / totals.budget) * 100) : 0,
    deadPct:   totals.budget > 0 ? Math.round((totals.deadCap      / totals.budget) * 100) : 0,
    spacePct:  totals.budget > 0 ? Math.round((totals.capSpace     / totals.budget) * 100) : 0,
  }

  return NextResponse.json({ teams, league, year: YEAR })
}
