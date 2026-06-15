'use client'
import { getServiceYearColor, getKeeperPrice, posStyle, COLORS } from '@/lib/constants'
import ServiceYearBadge from './ServiceYearBadge'

interface Props {
  name: string; serviceYear: number; salary: number
  slotType: 'MLB' | 'MiLB' | 'IL' | 'dropped'
  isFranchisePlayer: boolean | string
  deadMoney?: number | null
  position?: string | null
  onClick?: () => void
}

function formatPos(pos: string): string {
  const parts = pos.split(',').map(p => p.trim())
  const hasSpecificOF = parts.some(p => ['LF','CF','RF'].includes(p))
  return (hasSpecificOF ? parts.filter(p => p !== 'OF') : parts).join(',')
}

export default function PlayerRow({ name, serviceYear, salary, slotType, isFranchisePlayer, deadMoney, position, onClick }: Props) {
  const isDropped = slotType === 'dropped'
  const keeperPrice = isDropped ? null : getKeeperPrice(salary)
  const svcColor = getServiceYearColor(serviceYear)
  const isFranchise = isFranchisePlayer === true || isFranchisePlayer === 'true'
  const deadMoneyAmt = isDropped ? (deadMoney ?? Math.ceil(salary / 2)) : null
  const rowBg = isDropped ? 'transparent' : `${svcColor}18`
  const displayPos = position ? formatPos(position) : null
  const pStyle = displayPos ? posStyle(position!) : null

  return (
    <tr onClick={onClick} style={{ background: rowBg, cursor: onClick ? 'pointer' : 'default' }}>
      <td style={{ padding: 0, width: 5, background: svcColor, opacity: isDropped ? 0.35 : 1 }} />
      <td style={{ padding: '3px 8px 3px 7px' }}>
        <span className={isFranchise ? 'franchise-player' : ''} style={{
          color: isDropped ? COLORS.muted : '#0f1117', fontSize: '0.81rem',
          display: 'flex', alignItems: 'center', gap: 5,
          textDecoration: isDropped ? 'line-through' : 'none', textDecorationColor: '#d1d5db',
        }}>
          {name}
          {isFranchise && <span style={{ color: COLORS.blue, fontSize: '0.6rem', flexShrink: 0 }}>★</span>}
        </span>
      </td>
      <td style={{ padding: '3px 5px', textAlign: 'center', width: 64 }}>
        {displayPos && pStyle ? (
          <span style={{
            display: 'inline-block', fontSize: '0.57rem', fontWeight: 700,
            padding: '1px 5px', borderRadius: 3, letterSpacing: '0.01em',
            background: pStyle.bg, color: pStyle.color,
            border: `1px solid ${pStyle.border}`, whiteSpace: 'nowrap',
          }}>
            {displayPos}
          </span>
        ) : (
          <span style={{ fontSize: '0.6rem', color: '#d1d5db' }}>—</span>
        )}
      </td>
      <td style={{ padding: '3px 5px', textAlign: 'center', width: 36 }}>
        <ServiceYearBadge year={serviceYear} />
      </td>
      <td style={{ padding: '3px 8px', textAlign: 'right', width: 48, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isDropped ? COLORS.neutral : '#374151' }}>${salary}</span>
      </td>
      <td style={{ padding: '3px 8px', textAlign: 'right', width: 52, fontVariantNumeric: 'tabular-nums' }}>
        {isDropped
          ? <span style={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.danger }}>${deadMoneyAmt}</span>
          : <span style={{ fontSize: '0.79rem', color: COLORS.muted }}>${keeperPrice}</span>
        }
      </td>
    </tr>
  )
}
