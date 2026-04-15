'use client'
import { getServiceYearColor, getServiceYearTextColor, getKeeperPrice } from '@/lib/constants'
import ServiceYearBadge from './ServiceYearBadge'

interface PlayerRowProps {
  name: string
  serviceYear: number
  salary: number
  slotType: 'MLB' | 'MiLB' | 'IL' | 'dropped'
  isFranchisePlayer: boolean
  deadMoney?: number | null
  onClick?: () => void
  dimmed?: boolean
}

export default function PlayerRow({
  name,
  serviceYear,
  salary,
  slotType,
  isFranchisePlayer,
  deadMoney,
  onClick,
  dimmed = false,
}: PlayerRowProps) {
  const rowBg = getServiceYearColor(serviceYear)
  const textColor = getServiceYearTextColor(serviceYear)
  const keeperPrice = slotType !== 'dropped' ? getKeeperPrice(salary) : null
  const isDropped = slotType === 'dropped'

  return (
    <tr
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      {/* Service year stripe on left */}
      <td style={{ padding: 0, width: 4, background: rowBg }} />

      {/* Player name */}
      <td style={{ padding: '5px 10px 5px 8px', maxWidth: 200 }}>
        <span
          className={isFranchisePlayer ? 'franchise-player' : ''}
          style={{
            color: isDropped ? 'var(--text-muted)' : 'var(--text-primary)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {name}
          {isFranchisePlayer && (
            <span
              title="Franchise player — rostered entire career"
              style={{ fontSize: '0.6rem', color: '#4f7ef0', letterSpacing: '0.03em' }}
            >
              ★
            </span>
          )}
        </span>
      </td>

      {/* Service year */}
      <td style={{ padding: '5px 8px', textAlign: 'center', width: 44 }}>
        <ServiceYearBadge year={serviceYear} />
      </td>

      {/* Salary */}
      <td style={{ padding: '5px 10px', textAlign: 'right', width: 60, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ color: isDropped ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: '0.83rem' }}>
          ${isDropped ? (deadMoney ?? salary) : salary}
        </span>
      </td>

      {/* Keeper price or dead money label */}
      <td style={{ padding: '5px 10px', textAlign: 'right', width: 60, fontVariantNumeric: 'tabular-nums' }}>
        {isDropped ? (
          <span style={{ color: 'var(--red)', fontSize: '0.75rem', fontWeight: 600 }}>
            DEAD
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
            ${keeperPrice}
          </span>
        )}
      </td>
    </tr>
  )
}
