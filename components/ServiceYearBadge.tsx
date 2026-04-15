'use client'
import { getServiceYearColor, getServiceYearTextColor } from '@/lib/constants'

interface Props {
  year: number
  size?: 'sm' | 'md'
}

export default function ServiceYearBadge({ year, size = 'sm' }: Props) {
  const bg = getServiceYearColor(year)
  const color = getServiceYearTextColor(year)
  const dim = size === 'md' ? '1.75rem' : '1.4rem'
  const fs = size === 'md' ? '0.72rem' : '0.63rem'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dim,
        height: dim,
        borderRadius: 4,
        background: bg,
        color,
        fontSize: fs,
        fontWeight: 700,
        flexShrink: 0,
        border: '1px solid rgba(0,0,0,0.15)',
      }}
      title={`Service year ${year}`}
    >
      {year}
    </span>
  )
}
