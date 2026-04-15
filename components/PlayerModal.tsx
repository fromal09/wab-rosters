'use client'
import { useEffect, useState, useCallback } from 'react'
import { getKeeperPrice, getServiceYearColor } from '@/lib/constants'
import ServiceYearBadge from './ServiceYearBadge'

interface RosterSlot {
  year: number; slot_type: string; service_year: number; salary: number
  dead_money?: number | null; is_franchise_player: boolean
  manager_name: string; manager_slug: string
}
interface Txn {
  year: number; type: string; price: number | null
  transaction_date: string | null; note: string | null; manager_name: string
}
interface Props { playerName: string | null; onClose: () => void }

const DEPARTED = new Set(['Brendan Prin', 'Josh Meyerchick', 'Tom Gieryn'])
const CURRENT_YEAR = 2026

// Transaction types that start a stint
const ACQUISITIONS = new Set(['claim','trade_receive','keeper','qualifying_offer'])
// Transaction types that end a stint
const RELEASES = new Set(['drop','trade_send'])

const ACQ_LABEL: Record<string,string> = {
  claim:'Picked up', trade_receive:'Acquired via trade',
  keeper:'Kept', qualifying_offer:'Qualifying Offer',
}
const REL_LABEL: Record<string,string> = {
  drop:'Dropped', trade_send:'Traded away',
}
const REL_COLOR: Record<string,string> = {
  drop:'#dc2626', trade_send:'#d97706',
}

const SLOT_STYLES = {
  MLB:     { color:'#15803d', bg:'#f0fdf4', border:'#bbf7d0', label:'MLB' },
  MiLB:    { color:'#1d4ed8', bg:'#eff6ff', border:'#bfdbfe', label:'MiLB' },
  IL:      { color:'#d97706', bg:'#fffbeb', border:'#fde68a', label:'IL' },
  dropped: { color:'#dc2626', bg:'#fef2f2', border:'#fecaca', label:'Dead $' },
  season:  { color:'#6b7280', bg:'#f8f9fb', border:'#e2e6eb', label:'Rostered' },
}

function fmtDate(d: string|null, short=true) {
  if (!d) return null
  try {
    return new Date(d).toLocaleDateString('en-US', short
      ? {month:'short',day:'numeric',year:'numeric'}
      : {month:'long',day:'numeric',year:'numeric'})
  } catch { return null }
}

// ─── Entry types rendered in the timeline ────────────────────────────────────
type EntryKind =
  | { kind:'stint';   manager:string; slot:RosterSlot|null; acquiredTxn:Txn|null; releasedTxn:Txn|null; sortTs:number }
  | { kind:'dead';    manager:string; slot:RosterSlot|null; dropTxn:Txn|null;    sortTs:number }
  | { kind:'season';  manager:string; slot:RosterSlot;      sortTs:number }

export default function PlayerModal({ playerName, onClose }: Props) {
  const [data, setData] = useState<{slots:RosterSlot[];transactions:Txn[]}|null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (name:string) => {
    setLoading(true)
    try { setData(await (await fetch(`/api/player?name=${encodeURIComponent(name)}`)).json()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (playerName) { setData(null); fetchData(playerName) } }, [playerName, fetchData])
  useEffect(() => {
    const fn = (e:KeyboardEvent) => { if (e.key==='Escape') onClose() }
    window.addEventListener('keydown',fn); return ()=>window.removeEventListener('keydown',fn)
  }, [onClose])

  if (!playerName) return null

  const slots    = (data?.slots ?? []).filter(s => !DEPARTED.has(s.manager_name))
  const rawTxns  = (data?.transactions ?? [])
    .filter(t => !DEPARTED.has(t.manager_name) && t.type !== 'il_move')
    .sort((a,b) => {
      const da = a.transaction_date ? new Date(a.transaction_date).getTime() : a.year*1e9
      const db = b.transaction_date ? new Date(b.transaction_date).getTime() : b.year*1e9
      return da - db
    })

  function toTs(txn:Txn) {
    if (txn.transaction_date) return new Date(txn.transaction_date).getTime()
    return txn.year * 1e12
  }

  // Slot lookup by manager+year
  const slotMap = new Map<string,RosterSlot>()
  slots.forEach(s => slotMap.set(`${s.year}::${s.manager_name}`, s))

  // ── Build stints and orphaned drops from transaction stream ─────────────────
  const stints: EntryKind[] = []
  let openStint: {manager:string; acq:Txn}|null = null
  const coveredSlotKeys = new Set<string>()

  for (const txn of rawTxns) {
    if (ACQUISITIONS.has(txn.type)) {
      // Close any open stint that has no release (shouldn't normally happen)
      if (openStint) {
        const slot = slotMap.get(`${openStint.acq.year}::${openStint.manager}`) ?? null
        coveredSlotKeys.add(`${openStint.acq.year}::${openStint.manager}`)
        stints.push({ kind:'stint', manager:openStint.manager, slot, acquiredTxn:openStint.acq, releasedTxn:null, sortTs:toTs(openStint.acq) })
      }
      openStint = { manager:txn.manager_name, acq:txn }

    } else if (RELEASES.has(txn.type)) {
      if (openStint) {
        // Normal release closing the current stint
        const slot = slotMap.get(`${openStint.acq.year}::${openStint.manager}`) ?? null
        coveredSlotKeys.add(`${openStint.acq.year}::${openStint.manager}`)
        // Also cover the dropped slot in the release year
        coveredSlotKeys.add(`${txn.year}::${txn.manager_name}`)
        stints.push({ kind:'stint', manager:openStint.manager, slot, acquiredTxn:openStint.acq, releasedTxn:txn, sortTs:toTs(openStint.acq) })
        openStint = null
      } else {
        // Orphaned drop: manager dropped a player they had before our records begin
        const slot = slotMap.get(`${txn.year}::${txn.manager_name}`) ?? null
        coveredSlotKeys.add(`${txn.year}::${txn.manager_name}`)
        stints.push({ kind:'dead', manager:txn.manager_name, slot, dropTxn:txn, sortTs:toTs(txn) })
      }
    }
  }

  // Close any open stint (still active)
  if (openStint) {
    const slot = slotMap.get(`${openStint.acq.year}::${openStint.manager}`) ?? null
    coveredSlotKeys.add(`${openStint.acq.year}::${openStint.manager}`)
    stints.push({ kind:'stint', manager:openStint.manager, slot, acquiredTxn:openStint.acq, releasedTxn:null, sortTs:toTs(openStint.acq) })
  }

  // ── Uncovered slots → season entries or dead money cards ────────────────────
  const uncovered: EntryKind[] = []
  for (const s of slots) {
    const key = `${s.year}::${s.manager_name}`
    if (coveredSlotKeys.has(key)) continue
    if (s.slot_type === 'dropped') {
      // Dead money without a drop transaction in our records
      uncovered.push({ kind:'dead', manager:s.manager_name, slot:s, dropTxn:null, sortTs:s.year*1e12 })
    } else {
      // Non-retained season entry
      uncovered.push({ kind:'season', manager:s.manager_name, slot:s, sortTs:s.year*1e12 })
    }
  }

  // ── Merge and sort all entries oldest → newest ───────────────────────────────
  const allEntries: EntryKind[] = [...stints, ...uncovered]
    .sort((a,b) => a.sortTs - b.sortTs)

  // Header info
  const latestActive = [...slots].filter(s=>s.slot_type!=='dropped').sort((a,b)=>b.year-a.year)[0]
  const isFranchise = latestActive?.is_franchise_player===true || (latestActive?.is_franchise_player as unknown as string)==='true'

  // Is the player currently active (non-dropped slot in current year)?
  const isCurrentlyActive = slots.some(s => s.year===CURRENT_YEAR && s.slot_type!=='dropped')

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:100,backdropFilter:'blur(3px)'}}/>
      <div style={{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        width:'min(580px,95vw)',maxHeight:'88vh',
        background:'#fff',border:'1px solid #e2e6eb',borderRadius:12,
        zIndex:101,display:'flex',flexDirection:'column',
        overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{padding:'18px 20px 14px',borderBottom:'1px solid #f0f2f5'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
            <div>
              <h2 className={isFranchise?'franchise-player':''} style={{margin:0,fontSize:'1.2rem',fontWeight:800,color:'#111827',letterSpacing:'-0.02em'}}>
                {playerName}
                {isFranchise&&<span style={{fontSize:'0.7rem',color:'#1d4ed8',marginLeft:6,fontStyle:'normal',fontFamily:'sans-serif'}}>★</span>}
              </h2>
              {latestActive&&!loading&&(
                <div style={{marginTop:5,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  <ServiceYearBadge year={latestActive.service_year} size="md"/>
                  <span style={{fontSize:'0.8rem',color:'#6b7280'}}>Yr {latestActive.service_year}</span>
                  <span style={{color:'#d1d5db'}}>·</span>
                  <span style={{fontSize:'0.88rem',fontWeight:700,color:'#111827'}}>${latestActive.salary}</span>
                  <span style={{color:'#d1d5db'}}>·</span>
                  <span style={{fontSize:'0.8rem',color:'#6b7280'}}>KP ${getKeeperPrice(latestActive.salary)}</span>
                  {isFranchise&&<span style={{fontSize:'0.72rem',fontWeight:700,color:'#1d4ed8',background:'#eff6ff',padding:'1px 6px',borderRadius:4}}>★ Franchise</span>}
                </div>
              )}
              {!latestActive&&!loading&&slots.length>0&&(
                <div style={{marginTop:4,fontSize:'0.8rem',color:'#9ca3af'}}>Not currently rostered</div>
              )}
            </div>
            <button onClick={onClose} style={{background:'#f4f5f7',border:'none',borderRadius:6,color:'#6b7280',cursor:'pointer',fontSize:'1rem',padding:'4px 8px'}}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{overflowY:'auto',flex:1,padding:'16px 20px 8px'}}>
          {loading&&<div style={{textAlign:'center',padding:40,color:'#9ca3af'}}>Loading…</div>}
          {!loading&&allEntries.length===0&&<div style={{textAlign:'center',padding:40,color:'#9ca3af'}}>No history available.</div>}

          {!loading&&allEntries.length>0&&(
            <div style={{position:'relative'}}>
              {/* Vertical line */}
              <div style={{position:'absolute',left:15,top:0,bottom:0,width:2,background:'#e2e6eb',borderRadius:1}}/>

              <div style={{display:'flex',flexDirection:'column',gap:0}}>
                {allEntries.map((entry, idx) => {
                  const isLast = idx===allEntries.length-1

                  // ── STINT ────────────────────────────────────────────────
                  if (entry.kind==='stint') {
                    const { manager, slot, acquiredTxn, releasedTxn } = entry
                    const slotType = slot?.slot_type ?? 'MLB'
                    const sty = SLOT_STYLES[slotType as keyof typeof SLOT_STYLES] ?? SLOT_STYLES.MLB
                    const isActive = !releasedTxn && isCurrentlyActive && isLast
                    const displaySalary = slotType==='dropped'
                      ? (slot?.dead_money ?? (slot?Math.ceil(slot.salary/2):0))
                      : (slot?.salary ?? '—')
                    const acqLabel = acquiredTxn ? (ACQ_LABEL[acquiredTxn.type]??acquiredTxn.type) : 'Rostered'
                    const acqDate = fmtDate(acquiredTxn?.transaction_date??null)
                    const relDate = fmtDate(releasedTxn?.transaction_date??null)
                    const year = acquiredTxn?.year ?? slot?.year ?? '?'
                    const deadAmt = slot?.dead_money ?? (slot?Math.ceil(slot.salary/2):null)

                    return (
                      <div key={idx}>
                        <div style={{display:'flex',alignItems:'flex-start',gap:12,paddingBottom:4,paddingTop:idx===0?0:4}}>
                          <div style={{width:32,display:'flex',justifyContent:'center',flexShrink:0,paddingTop:10}}>
                            <div style={{background:isActive?sty.color:'#9ca3af',color:'#fff',fontSize:'0.58rem',fontWeight:800,padding:'2px 3px',borderRadius:4,letterSpacing:'0.02em',lineHeight:1.4,textAlign:'center',zIndex:1,minWidth:30}}>
                              {year}
                            </div>
                          </div>
                          <div style={{flex:1,background:sty.bg,border:`1px solid ${sty.border}`,borderRadius:8,padding:'9px 12px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <span style={{fontSize:'0.63rem',fontWeight:700,textTransform:'uppercase',color:sty.color,minWidth:38,letterSpacing:'0.04em'}}>{sty.label}</span>
                              <span style={{flex:1,fontSize:'0.9rem',fontWeight:700,color:'#111827'}}>{manager}</span>
                              {slot&&<ServiceYearBadge year={slot.service_year}/>}
                              {slot&&<span style={{fontSize:'0.87rem',fontWeight:700,color:'#374151',fontVariantNumeric:'tabular-nums'}}>${displaySalary}</span>}
                              {slot&&slotType!=='dropped'&&<span style={{fontSize:'0.78rem',color:'#9ca3af',fontVariantNumeric:'tabular-nums'}}>KP ${getKeeperPrice(slot.salary)}</span>}
                            </div>
                            <div style={{marginTop:4,fontSize:'0.75rem',color:'#6b7280'}}>
                              {acqLabel}
                              {acqDate&&<span style={{fontWeight:500,color:'#374151'}}> {acqDate}</span>}
                              {relDate
                                ? <><span style={{margin:'0 4px',color:'#d1d5db'}}>→</span><span style={{fontWeight:500,color:'#374151'}}>{relDate}</span></>
                                : isActive
                                  ? <><span style={{margin:'0 4px',color:'#d1d5db'}}>→</span><span style={{fontWeight:600,color:sty.color}}>present</span></>
                                  : null
                              }
                            </div>
                          </div>
                        </div>

                        {/* Release connector between stints */}
                        {releasedTxn&&!isLast&&(()=>{
                          const color = REL_COLOR[releasedTxn.type]??'#6b7280'
                          const label = REL_LABEL[releasedTxn.type]??releasedTxn.type
                          const date  = fmtDate(releasedTxn.transaction_date)
                          const priceDisplay = releasedTxn.type==='drop'&&deadAmt!=null ? `$${deadAmt} dead cap` : null
                          return (
                            <div style={{display:'flex',alignItems:'center',gap:12,padding:'2px 0'}}>
                              <div style={{width:32,display:'flex',justifyContent:'center',flexShrink:0}}>
                                <div style={{width:8,height:8,borderRadius:'50%',background:color,border:'2px solid #fff',boxShadow:`0 0 0 2px ${color}40`,zIndex:1}}/>
                              </div>
                              <div style={{flex:1,display:'flex',gap:8,alignItems:'baseline',fontSize:'0.78rem'}}>
                                <span style={{fontWeight:700,color}}>{label}</span>
                                {priceDisplay&&<span style={{color:'#9ca3af'}}>{priceDisplay}</span>}
                                {date&&<span style={{color:'#9ca3af',marginLeft:'auto'}}>{date}</span>}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  }

                  // ── DEAD MONEY ───────────────────────────────────────────
                  if (entry.kind==='dead') {
                    const { manager, slot, dropTxn } = entry
                    const dead = slot?.dead_money ?? (slot?Math.ceil(slot.salary/2):null)
                    const year = dropTxn?.year ?? slot?.year ?? '?'
                    const date = fmtDate(dropTxn?.transaction_date??null)
                    return (
                      <div key={idx} style={{display:'flex',alignItems:'flex-start',gap:12,paddingBottom:4,paddingTop:idx===0?0:4}}>
                        <div style={{width:32,display:'flex',justifyContent:'center',flexShrink:0,paddingTop:10}}>
                          <div style={{background:'#dc2626',color:'#fff',fontSize:'0.58rem',fontWeight:800,padding:'2px 3px',borderRadius:4,lineHeight:1.4,textAlign:'center',zIndex:1,minWidth:30}}>
                            {year}
                          </div>
                        </div>
                        <div style={{flex:1,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'9px 12px',borderLeft:'3px solid #dc2626'}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:'0.63rem',fontWeight:700,textTransform:'uppercase',color:'#dc2626',minWidth:38,letterSpacing:'0.04em'}}>DEAD $</span>
                            <span style={{flex:1,fontSize:'0.9rem',fontWeight:700,color:'#111827'}}>{manager}</span>
                            {dead!=null&&<span style={{fontSize:'0.87rem',fontWeight:700,color:'#dc2626',fontVariantNumeric:'tabular-nums'}}>${dead}</span>}
                          </div>
                          <div style={{marginTop:3,fontSize:'0.75rem',color:'#9ca3af'}}>
                            Dropped
                            {date&&<><span style={{margin:'0 4px',color:'#d1d5db'}}>·</span><span style={{fontWeight:500,color:'#6b7280'}}>{date}</span></>}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // ── SEASON (non-retained) ─────────────────────────────────
                  if (entry.kind==='season') {
                    const { manager, slot } = entry
                    const sty = SLOT_STYLES[slot.slot_type as keyof typeof SLOT_STYLES] ?? SLOT_STYLES.season
                    return (
                      <div key={idx} style={{display:'flex',alignItems:'flex-start',gap:12,paddingBottom:4,paddingTop:idx===0?0:4}}>
                        <div style={{width:32,display:'flex',justifyContent:'center',flexShrink:0,paddingTop:10}}>
                          <div style={{background:'#9ca3af',color:'#fff',fontSize:'0.58rem',fontWeight:800,padding:'2px 3px',borderRadius:4,lineHeight:1.4,textAlign:'center',zIndex:1,minWidth:30}}>
                            {slot.year}
                          </div>
                        </div>
                        <div style={{flex:1,background:'#f8f9fb',border:'1px solid #e2e6eb',borderRadius:8,padding:'9px 12px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:'0.63rem',fontWeight:700,textTransform:'uppercase',color:'#6b7280',minWidth:38,letterSpacing:'0.04em'}}>{sty.label}</span>
                            <span style={{flex:1,fontSize:'0.9rem',fontWeight:700,color:'#374151'}}>{manager}</span>
                            <ServiceYearBadge year={slot.service_year}/>
                            <span style={{fontSize:'0.87rem',fontWeight:700,color:'#6b7280',fontVariantNumeric:'tabular-nums'}}>${slot.salary}</span>
                            <span style={{fontSize:'0.78rem',color:'#9ca3af',fontVariantNumeric:'tabular-nums'}}>KP ${getKeeperPrice(slot.salary)}</span>
                          </div>
                          <div style={{marginTop:3,fontSize:'0.73rem',color:'#9ca3af',fontStyle:'italic'}}>
                            Not retained — re-entered draft pool
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{padding:'10px 20px 14px',borderTop:'1px solid #f0f2f5',background:'#fafbfc'}}>
          <div style={{fontSize:'0.6rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'#9ca3af',marginBottom:6}}>Legend</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[
              {bg:'#f0fdf4',border:'#bbf7d0',color:'#15803d',label:'MLB'},
              {bg:'#eff6ff',border:'#bfdbfe',color:'#1d4ed8',label:'MiLB'},
              {bg:'#fffbeb',border:'#fde68a',color:'#d97706',label:'IL'},
              {bg:'#fef2f2',border:'#fecaca',color:'#dc2626',label:'Dead $'},
              {bg:'#f8f9fb',border:'#e2e6eb',color:'#6b7280',label:'Not retained'},
            ].map(s=>(
              <div key={s.label} style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{width:10,height:10,borderRadius:3,background:s.bg,border:`1px solid ${s.border}`}}/>
                <span style={{fontSize:'0.68rem',color:'#6b7280'}}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
