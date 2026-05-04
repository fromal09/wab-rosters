import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

export async function GET() {
  const rows = await query`SELECT content, updated_at, updated_by FROM league_rules ORDER BY updated_at DESC LIMIT 1`
  if (!rows.length) return NextResponse.json({ content: '', updated_at: null })
  return NextResponse.json(rows[0])
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  if (cookieStore.get('wab_commish_session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { content } = await request.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
  await query`
    INSERT INTO league_rules (content, updated_at, updated_by)
    VALUES (${content}, NOW(), 'Commissioner')
  `
  return NextResponse.json({ ok: true })
}
