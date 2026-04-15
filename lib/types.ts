export type SlotType = 'MLB' | 'MiLB' | 'IL' | 'dropped'

export interface Manager {
  id: string
  name: string
  slug: string
}

export interface Player {
  id: string
  name: string
}

export interface RosterSlot {
  id: string
  player_id: string
  player_name: string
  manager_id: string
  year: number
  slot_type: SlotType
  service_year: number
  salary: number
  dead_money: number | null
  is_franchise_player: boolean
}

export interface BudgetTransaction {
  id: string
  manager_id: string
  year: number
  amount: number
  note: string | null
  created_at: string
}

export interface Transaction {
  id: string
  year: number
  type: string
  player_id: string | null
  player_name?: string
  manager_id: string
  counterpart_manager_id: string | null
  price: number | null
  is_draft_day: boolean
  fantrax_team: string | null
  note: string | null
  transaction_date: string | null
  period: number | null
}

export interface TeamSummary {
  manager: Manager
  year: number
  budget: number
  salary: number
  cap_space: number
  keeper_slots: number
  prev_slots_used: number
  prev_slots_total: number
  injured_count: number
  dropped_count: number
  ht_eligible_count: number
  notes: string | null
}
