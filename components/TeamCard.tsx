'use client'
import Link from 'next/link'

interface Props {
  manager: { name: string; slug: string }
  budget: number
  salary: number
  cap_space: number
  injured_count: number
  dropped_count: number
  ht_eligible_count: number
}

export default function TeamCard({
  manager,
  budget,
  salary,
  cap_space,
  injured_count,
  dropped_count,
  ht_eligible_count,
}: Props) {
  const capPct = budget > 0 ? Math.min((salary / budget) * 100, 100) : 0
  const capColor = cap_space <= 0 ? '#f0614f' : cap_space <= 5 ? '#f0c040' : '#3ecf8e'

  return (
    <Link href={`/team/${manager.slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{
          padding: '16px 18px',
          transition: 'border-color 0.15s, background 0.15s',
          cursor: 'pointer',
        }}
