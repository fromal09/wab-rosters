'use client'
import { getServiceYearColor } from '@/lib/constants'

interface Props { year: number; size?: 'sm' | 'md' | 'lg' }

export default function ServiceYearBadge({ year, size = 'sm' }: Props) {
  const bg = getServiceYearColor(year)
  const dims = { sm: { w: '1.3rem', h: '1.3rem', fs: '0.62rem' }, md: { w: '1.6rem', h: '1.6rem', fs: '0.7rem' }, lg: { w: '2rem', h: '2rem', fs: '0.85rem' } }
  const d = dims[size]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: d.w, height: d.h, borderRadius: 4,
      background: bg, color: '#111827',
      fontSize: d.fs, fontWeight: 800, flexShrink: 0,
      border: '1.5px solid rgba(0,0,0,0.14)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    }} title={`Service year ${year}`}>
      {year}
    </span>
  )
}
