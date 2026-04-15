'use client'
import { getServiceYearColor } from '@/lib/constants'

interface Props { year: number; size?: 'sm' | 'md' }

export default function ServiceYearBadge({ year, size = 'sm' }: Props) {
  const bg = getServiceYearColor(year)
  const dim = size === 'md' ? '1.7rem' : '1.35rem'
  const fs = size === 'md' ? '0.72rem' : '0.65rem'
  // Use dark text on all service year backgrounds (they're all light colors)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: dim, height: dim, borderRadius: 4,
      background: bg, color: '#1f2937',
      fontSize: fs, fontWeight: 700, flexShrink: 0,
      border: '1px solid rgba(0,0,0,0.12)',
    }} title={`Service year ${year}`}>
      {year}
    </span>
  )
}
