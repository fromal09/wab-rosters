'use client'
import { getServiceYearColor, getKeeperPrice } from '@/lib/constants'
import ServiceYearBadge from './ServiceYearBadge'

interface Props {
  name: string; serviceYear: number; salary: number
  slotType: 'MLB' | 'MiLB' | 'IL' | 'dropped'
  isFranchisePlayer: boolean | string
  deadMoney?: number | null; onClick?: () => void
}

export default function PlayerRow({ name, serviceYear, salary, slotType, isFranchisePlayer, deadMoney, onClick }: Props) {
  const isDropped = slotType === 'dropped'
  const keeperPrice = isDropped ? null : getKeeperPrice(salary)
  const svcColor = getServiceYearColor(serviceYear)
  const isFranchise = isFranchisePlayer === true || isFranchisePlayer === 'true'
  const displaySalary = isDropped ? (deadMoney ?? Math.ceil(salary / 2)) : salary

  // Row gets a very faint tint of the service year color
  const rowBg = isDropped ? 'transparent' : `${svcColor}18`

  return (
    <tr onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', background: rowBg }}>
      {/* Bold service year color stripe */}
      <td style={{ padding: 0, width: 5, background: svcColor, opacity: isDropped ? 0.35 : 1 }} />

      {/* Player name */}
      <td style={{ padding: '3px 8px 3px 7px', maxWidth: 180 }}>
        <span className={isFranchise ? 'franchise-player' : ''} style={{
          color: isDropped ? '#9ca3af' : '#0f1117',
          fontSize: '0.81rem',
          display: 'flex', alignItems: 'center', gap: 5,
          textDecoration: isDropped ? 'line-through' : 'none',
          textDecorationColor: '#d1d5db',
        }}>
          {name}
          {isFranchise && <span style={{ color: '#1a56db', fontSize: '0.6rem', flexShrink: 0 }}>★</span>}
        </span>
      </td>

      {/* Service year badge */}
      <td style={{ padding: '3px 5px', textAlign: 'center', width: 36 }}>
        <ServiceYearBadge year={serviceYear} />
      </td>

      {/* Salary */}
      <td style={{ padding: '3px 8px', textAlign: 'right', width: 48, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isDropped ? '#9ca3af' : '#374151' }}>
          ${displaySalary}
        </span>
      </td>

      {/* KP or dead money */}
      <td style={{ padding: '3px 8px', textAlign: 'right', width: 52, fontVariantNumeric: 'tabular-nums' }}>
        {isDropped
          ? <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b91c1c' }}>${displaySalary}</span>
          : <span style={{ fontSize: '0.79rem', color: '#9ca3af' }}>${keeperPrice}</span>
        }
      </td>
    </tr>
  )
}
