-- WAB Roster Hub — PostgreSQL Schema (Neon-compatible)
-- Run this first, then run the seed chunks in order.

-- ─── Managers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS managers (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ─── Fantrax Team Name History ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fantrax_teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES managers(id) ON DELETE CASCADE,
  team_name  text NOT NULL,
  year       int  NOT NULL,
  UNIQUE(year, team_name)
);

-- ─── Budget Ledger (append-only) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_transactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES managers(id) ON DELETE CASCADE,
  year       int  NOT NULL,
  amount     int  NOT NULL,
  note       text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_budget_mgr_year ON budget_transactions(manager_id, year);

-- ─── Player Registry ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ─── Roster Slots ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roster_slots (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id          uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  manager_id         uuid NOT NULL REFERENCES managers(id) ON DELETE CASCADE,
  year               int  NOT NULL,
  slot_type          text NOT NULL CHECK (slot_type IN ('MLB','MiLB','IL','dropped')),
  service_year       int  NOT NULL DEFAULT 0,
  salary             int  NOT NULL,
  dead_money         int,
  is_franchise_player boolean NOT NULL DEFAULT false,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_roster_mgr_year   ON roster_slots(manager_id, year);
CREATE INDEX IF NOT EXISTS idx_roster_player_year ON roster_slots(player_id, year);
CREATE INDEX IF NOT EXISTS idx_roster_year_slot  ON roster_slots(year, slot_type);

-- ─── Transactions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year                   int  NOT NULL,
  type                   text NOT NULL CHECK (type IN (
    'claim','drop','trade_send','trade_receive',
    'il_move','draft','budget_adjustment','keeper','qualifying_offer'
  )),
  player_id              uuid REFERENCES players(id) ON DELETE SET NULL,
  manager_id             uuid NOT NULL REFERENCES managers(id) ON DELETE CASCADE,
  counterpart_manager_id uuid REFERENCES managers(id) ON DELETE SET NULL,
  price                  int,
  is_draft_day           boolean NOT NULL DEFAULT false,
  fantrax_team           text,
  note                   text,
  transaction_date       timestamptz,
  period                 int,
  created_at             timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_txn_player     ON transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_txn_mgr_year   ON transactions(manager_id, year);
CREATE INDEX IF NOT EXISTS idx_txn_year_type  ON transactions(year, type);
