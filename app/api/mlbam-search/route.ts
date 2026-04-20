import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])
  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(q)}&sportIds=1,11,12,13,14,15,16&hydrate=currentTeam`,
      { cache: 'no-store' }
    )
    const data = await res.json()
    const people = (data.people ?? []).slice(0, 10).map((p: Record<string,unknown>) => ({
      mlbam_id: p.id,
      name: p.fullName,
      team: ((p.currentTeam as Record<string,unknown>)?.name as string) ?? '—',
      position: ((p.primaryPosition as Record<string,unknown>)?.abbreviation as string) ?? '—',
      active: p.active,
    }))
    return NextResponse.json(people)
  } catch {
    return NextResponse.json({ error: 'MLB API unavailable' }, { status: 502 })
  }
}
