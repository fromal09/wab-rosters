'use client'
import { getServiceYearColor, getKeeperPrice } from '@/lib/constants'
import ServiceYearBadge from './ServiceYearBadge'

interface Props {
  name: string; serviceYear: number; salary: number
  slotType: 'MLB' | 'MiLB' | 'IL' | 'dropped'
  isFranchisePlayer: boolean | string
  deadMoney?: number | null
  position?: string | null
}

function posStyle(pos: string): { bg: string; color: string } {
  const p = pos.split(',')[0].trim()
  if (['SP'].includes(p))                     return { bg: '#dbeafe', color: '#1e40af' }
  if (['RP','P'].includes(p))                 return { bg: '#e0e7ff', color: '#3730a3' }
  if (['C'].includes(p))                      return { bg: '#f3e8ff', color: '#6b21a8' }
  if (['1B','2B','3B','SS'].includes(p))      return { bg: '#dcfce7', color: '#166534' }
  if (['LF','CF','RF','OF','DH'].includes(p)) return { bg: '#fef9c3', color: '#854d0e' }
  return { bg: '#f6f7f9', color: '#6b7280' }
}

export default function PlayerRow({ name, serviceYear, salary, slotType, isFranchisePlayer, deadMoney, position }: Props) {
  const isDropped = slotType === 'dropped'
  const keeperPrice = isDropped ? null : getKeeperPrice(salary)
  const svcColor = getServiceYearColor(serviceYear)
  const isFranchise = isFranchisePlayer === true || isFranchisePlayer === 'true'
  const deadMoneyAmt = isDropped ? (deadMoney ?? Math.ceil(salary / 2)) : null
  const rowBg = isDropped ? 'transparent' : `${svcColor}18`
  const primaryPos = position?.split(',')[0].trim() ?? null
  const pStyle = primaryPos ? posStyle(position!) : null

  return (
    <tr style={{ background: rowBg }}>
      <td style={{ padding: 0, width: 5, background: svcColor, opacity: isDropped ? 0.35 : 1 }} />
      <td style={{ padding: '3px 8px 3px 7px' }}>
        <span className={isFranchise ? 'franchise-player' : ''} style={{
          color: isDropped ? '#9ca3af' : '#0f1117', fontSize: '0.81rem',
          display: 'flex', alignItems: 'center', gap: 5,
          textDecoration: isDropped ? 'line-through' : 'none', textDecorationColor: '#d1d5db',
        }}>
          {name}
          {isFranchise && <span style={{ color: '#1a56db', fontSize: '0.6rem', flexShrink: 0 }}>★</span>}
        </span>
      </td>
      <td style={{ padding: '3px 5px', textAlign: 'center', width: 40 }}>
        {primaryPos && pStyle ? (
          <span style={{
            display: 'inline-block', fontSize: '0.58rem', fontWeight: 700,
            padding: '1px 5px', borderRadius: 3, letterSpacing: '0.02em',
            background: pStyle.bg, color: pStyle.color,
            border: `1px solid ${pStyle.color}40`,
          }}>
            {primaryPos}
          </span>
        ) : (
          <span style={{ fontSize: '0.6rem', color: '#d1d5db' }}>—</span>
        )}
      </td>
      <td style={{ padding: '3px 5px', textAlign: 'center', width: 36 }}>
        <ServiceYearBadge year={serviceYear} />
      </td>
      <td style={{ padding: '3px 8px', textAlign: 'right', width: 48, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isDropped ? '#9ca3af' : '#374151' }}>${salary}</span>
      </td>
      <td style={{ padding: '3px 8px', textAlign: 'right', width: 52, fontVariantNumeric: 'tabular-nums' }}>
        {isDropped
          ? <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b91c1c' }}>${deadMoneyAmt}</span>
          : <span style={{ fontSize: '0.79rem', color: '#9ca3af' }}>${keeperPrice}</span>
        }
      </td>
    </tr>
  )
}
