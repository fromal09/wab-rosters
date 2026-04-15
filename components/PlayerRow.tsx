'use client'
import { getServiceYearColor, getKeeperPrice } from '@/lib/constants'
import ServiceYearBadge from './ServiceYearBadge'

interface Props {
  name: string
  serviceYear: number
  salary: number
  slotType: 'MLB' | 'MiLB' | 'IL' | 'dropped'
  isFranchisePlayer: boolean
  deadMoney?: number | null
  onClick?: () => void
}

export default function PlayerRow({ name, serviceYear, salary, slotType, isFranchisePlayer, deadMoney, onClick }: Props) {
  const isDropped = slotType === 'dropped'
  const keeperPrice = isDropped ? null : getKeeperPrice(salary)
  const svcBg = getServiceYearColor(serviceYear)

  return (
    <tr onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {/* Service year color stripe */}
      <td style={{ padding: 0, width: 3, background: svcBg }} />

      <td style={{ padding: '3px 8px 3px 6px' }}>
        <span className={isFranchisePlayer ? 'franchise-player' : ''} style={{
          color: isDropped ? '#9ca3af' : '#111827',
          fontSize: '0.83rem',
          display: 'flex', alignItems: 'center', gap: 5,
          textDecoration: isDropped ? 'line-through' : 'none',
          textDecorationColor: '#d1d5db',
        }}>
          {name}
          {isFranchisePlayer && <span title="Franchise player" style={{ color: '#1d4ed8', fontSize: '0.65rem' }}>★</span>}
        </span>
      </td>

      <td style={{ padding: '3px 6px', textAlign: 'center', width: 38 }}>
        <ServiceYearBadge year={serviceYear} />
      </td>

      <td style={{ padding: '3px 8px', textAlign: 'right', width: 50, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isDropped ? '#9ca3af' : '#374151' }}>
          ${isDropped ? (deadMoney ?? Math.ceil(salary / 2)) : salary}
        </span>
      </td>

      <td style={{ padding: '3px 8px', textAlign: 'right', width: 50, fontVariantNumeric: 'tabular-nums' }}>
        {isDropped
          ? <span style={{ fontSize: '0.63rem', fontWeight: 700, color: '#dc2626', letterSpacing: '0.03em' }}>DEAD</span>
          : <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>${keeperPrice}</span>
        }
      </td>
    </tr>
  )
}
