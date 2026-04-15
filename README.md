# WAB Roster Hub

Official roster management site for Westminster Auction Baseball. Built with Next.js 15, TypeScript, Tailwind, and Neon PostgreSQL.

**Entirely free to run** — Vercel Hobby + Neon free tier, no credit card required.

---

## Stack

| Layer | Service | Cost |
|---|---|---|
| Frontend + API | [Vercel Hobby](https://vercel.com) | Free |
| Database | [Neon PostgreSQL](https://neon.tech) | Free |
| Repo | GitHub | Free |

---

## Features

- Full roster display for all 10 teams (MLB / MiLB / IL / Dropped)
- Service year color coding with franchise player styling
- Keeper price table auto-computed from salary
- Budget ledger per team with full transaction history
- Year switcher — view any roster from 2019–2026
- Global player search with typeahead (opens player history modal)
- Player history modal — all years, all managers, all slot types
- In-season transaction log per team (Fantrax claims/drops imported)
- Commissioner panel (password-protected):
  - Execute trades (players + budget)
  - Add / drop players
  - Budget adjustments with notes
  - IL moves
  - Salary corrections (for draft-day batch-add price fixes)

---

## Setup

### 1. Create a Neon database (free)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project — name it `wab-rosters` (or anything)
3. On the project dashboard, find **Connection string** and copy it — it looks like:
   ```
   postgres://user:password@ep-something.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Run the schema

In the Neon dashboard, open the **SQL Editor** and paste + run `supabase/schema.sql`.

### 3. Run the seed data (4 chunks)

Run each file in `supabase/seed-chunks/` **in order** in the Neon SQL Editor:

```
01_managers_players_fantrax_teams.sql   (~7 KB)
02_players.sql                          (~102 KB)
03_budget_+_roster_slots.sql            (~682 KB)
04_transactions.sql                     (~1.2 MB)
```

> **Tip:** Chunks 3 and 4 are large. If the Neon web editor times out, use the Neon CLI:
> ```bash
> npx neonctl@latest sql --project-id YOUR_PROJECT_ID < supabase/seed-chunks/03_budget_+_roster_slots.sql
> npx neonctl@latest sql --project-id YOUR_PROJECT_ID < supabase/seed-chunks/04_transactions.sql
> ```

### 4. Clone and configure locally

```bash
git clone https://github.com/fromal09/wab-rosters.git
cd wab-rosters
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:
```
DATABASE_URL=postgres://...your neon connection string...
COMMISSIONER_PASSWORD=pick_something_secure
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Deploy to Vercel

```bash
# Push to GitHub first
git add -A && git commit -m "initial" && git push

# Then in Vercel dashboard:
# 1. New Project → Import from GitHub → fromal09/wab-rosters
# 2. Add environment variables:
#    DATABASE_URL = (your Neon connection string)
#    COMMISSIONER_PASSWORD = (your password)
# 3. Deploy
```

Your site will be live at `https://wab-rosters.vercel.app`.

---

## Commissioner workflow

Navigate to `/admin` and enter your password. Actions take effect immediately.

### Trading players
- Enter both managers
- List players being sent by each side (one per line, exact name)
- Enter any budget being exchanged
- Add a note (optional) — shows up in each team's transaction log

### Adding / dropping players
- **Drop**: select manager + player name → automatically computes dead money (`ceil(salary / 2)`)
- **Add**: select manager + player name + salary + slot (MLB/MiLB/IL)

### Budget adjustments
- Use positive numbers to add budget (`+11`), negative to deduct (`-5`)
- The note appears in the team's budget ledger — format like the existing entries

### Salary corrections
Use the **Salary** tab to fix prices that were wrong in draft-day batch adds. This updates the salary on the current year's roster slot without creating a transaction log entry.

### IL moves
Move a player between MLB ↔ IL ↔ MiLB without it counting as a drop.

---

## Data notes

- **Roster history**: imported from the Google Sheet for 2019–2026
- **Transactions**: imported from Fantrax export files — draft-day batch adds are flagged and excluded from transaction logs (prices aren't reliable)
- **Service years**: 2024–2026 taken directly from the sheet; 2019–2023 derived from asterisk counts on player names
- **Franchise players**: players who have been on the same roster for their entire career are marked with ★ and displayed in italic serif

---

## Adding future seasons

At the start of each new season:
1. Add initial budget entries via the Commissioner Panel → Budget tab for each manager
2. Use the draft-day add flow to populate rosters after the draft
3. In-season claims/drops flow through the Add/Drop tab

---

## Local development

```bash
npm run dev     # start dev server
npm run build   # production build
npm run lint    # lint
npx tsc --noEmit  # type-check only
```
