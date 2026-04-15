import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'wab_commish_session'

// Check session status
export async function GET() {
  const cookieStore = await cookies()
  const ok = cookieStore.get(SESSION_COOKIE)?.value === 'authenticated'
  return NextResponse.json({ authenticated: ok })
}

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const correctPassword = process.env.COMMISSIONER_PASSWORD

  if (!correctPassword) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (password !== correctPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  return NextResponse.json({ ok: true })
}
