import { getAllTeamSummaries } from '@/lib/data'
import { CURRENT_YEAR } from '@/lib/constants'
import LeagueClient from './LeagueClient'

export const dynamic = 'force-dynamic'

export default async function LeaguePage() {
  const teams = await getAllTeamSummaries(CURRENT_YEAR)
  return <LeagueClient teams={teams} year={CURRENT_YEAR} />
}
