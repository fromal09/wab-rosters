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

const DEPARTED    = new Set(['Brendan Prin','Josh Meyerchick','Tom Gieryn'])
const ACQUISITIONS= new Set(['claim','trade_receive','keeper','qualifying_offer'])
const RELEASES    = new Set(['drop','trade_send'])
const CURRENT_YEAR = 2026

const ACQ_LABEL: Record<string,string> = {
  claim:'Picked up', trade_receive:'Acquired via trade',
  keeper:'Kept', qualifying_offer:'Qualifying Offer',
}
const REL_LABEL: Record<string,string> = { drop:'Dropped', trade_send:'Traded away' }
const REL_COLOR: Record<string,string> = { drop:'#dc2626', trade_send:'#d97706' }

const S = {
  MLB:    {color:'#15803d',bg:'#f0fdf4',border:'#bbf7d0',label:'MLB'},
  MiLB:   {color:'#1d4ed8',bg:'#eff6ff',border:'#bfdbfe',label:'MiLB'},
  IL:     {color:'#d97706',bg:'#fffbeb',border:'#fde68a',label:'IL'},
  dead:   {color:'#dc2626',bg:'#fef2f2',border:'#fecaca',label:'Dead $'},
  season: {color:'#6b7280',bg:'#f8f9fb',border:'#e2e6eb',label:'Rostered'},
} as const

function fmtDate(d:string|null) {
  if (!d) return null
  try { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) }
  catch { return null }
}

function txnTs(t:Txn):number {
  return t.transaction_date ? new Date(t.transaction_date).getTime() : t.year*1e12+5e11
}

// ─── Timeline entry types ────────────────────────────────────────────────────
type StintEntry   = {kind:'stint';  manager:string; acq:Txn;     rel:Txn|null; slot:RosterSlot|null; ts:number}
type DeadEntry    = {kind:'dead';   manager:string; dropTxn:Txn|null; slot:RosterSlot|null; ts:number}
type SeasonEntry  = {kind:'season'; manager:string; slot:RosterSlot; ts:number}
type Entry = StintEntry|DeadEntry|SeasonEntry

export default function PlayerModal({playerName,onClose}:Props) {
  const [data,setData]=useState<{slots:RosterSlot[];transactions:Txn[]}|null>(null)
  const [loading,setLoading]=useState(false)

  const fetchData=useCallback(async(name:string)=>{
    setLoading(true)
    try{setData(await (await fetch(`/api/player?name=${encodeURIComponent(name)}`)).json())}
    finally{setLoading(false)}
  },[])

  useEffect(()=>{if(playerName){setData(null);fetchData(playerName)}},[playerName,fetchData])
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}
    window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)
  },[onClose])

  if(!playerName) return null

  const slots   = (data?.slots??[]).filter(s=>!DEPARTED.has(s.manager_name))
  // Sort ALL transactions oldest → newest
  const rawTxns = (data?.transactions??[])
    .filter(t=>!DEPARTED.has(t.manager_name) && t.type!=='il_move')
    .sort((a,b)=>txnTs(a)-txnTs(b))

  // Slot lookup: manager+year → slot (keep highest salary if duplicates)
  const slotMap=new Map<string,RosterSlot>()
  for(const s of slots){
    const k=`${s.year}::${s.manager_name}`
    const ex=slotMap.get(k)
    if(!ex||s.salary>ex.salary) slotMap.set(k,s)
  }

  // ── Per-manager stint chain algorithm ────────────────────────────────────
  // Each manager has their own independent acquisition→release chain.
  // openStints tracks one open stint per manager at a time.

  const openStints = new Map<string,Txn>() // manager → acquisition txn
  const stintEntries: StintEntry[] = []
  const deadEntries:  DeadEntry[]  = []
  const coveredKeys  = new Set<string>() // "year::manager" slots accounted for

  for(const txn of rawTxns){
    const mgr = txn.manager_name

    if(ACQUISITIONS.has(txn.type)){
      // If this manager already has an open stint (acquired twice, no drop recorded),
      // close the previous one without a release event
      if(openStints.has(mgr)){
        const prevAcq=openStints.get(mgr)!
        const slot=slotMap.get(`${prevAcq.year}::${mgr}`)??null
        coveredKeys.add(`${prevAcq.year}::${mgr}`)
        stintEntries.push({kind:'stint',manager:mgr,acq:prevAcq,rel:null,slot,ts:txnTs(prevAcq)})
      }
      openStints.set(mgr,txn)

    } else if(RELEASES.has(txn.type)){
      if(openStints.has(mgr)){
        const acq=openStints.get(mgr)!
        // Slot is from the acquisition year (salary shown on the active stint)
        const slot=slotMap.get(`${acq.year}::${mgr}`)??null
        coveredKeys.add(`${acq.year}::${mgr}`)
        // The release creates a DROPPED slot in the release year — mark it covered
        coveredKeys.add(`${txn.year}::${mgr}`)
        stintEntries.push({kind:'stint',manager:mgr,acq,rel:txn,slot,ts:txnTs(acq)})
        openStints.delete(mgr)
      } else {
        // Orphaned drop: manager dropped them without a recorded acquisition
        const slot=slotMap.get(`${txn.year}::${mgr}`)??null
        coveredKeys.add(`${txn.year}::${mgr}`)
        deadEntries.push({kind:'dead',manager:mgr,dropTxn:txn,slot,ts:txnTs(txn)})
      }
    }
  }

  // Close any stints still open (currently active)
  for(const [mgr,acq] of openStints){
    const slot=slotMap.get(`${acq.year}::${mgr}`)??null
    coveredKeys.add(`${acq.year}::${mgr}`)
    stintEntries.push({kind:'stint',manager:mgr,acq,rel:null,slot,ts:txnTs(acq)})
  }

  // ── Uncovered slots ──────────────────────────────────────────────────────
  const seasonEntries: (SeasonEntry|DeadEntry)[] = []
  for(const s of slots){
    const k=`${s.year}::${s.manager_name}`
    if(coveredKeys.has(k)) continue
    if(s.slot_type==='dropped'){
      // Dead money from a season-start drop or pre-records drop
      deadEntries.push({kind:'dead',manager:s.manager_name,dropTxn:null,slot:s,ts:s.year*1e12})
    } else {
      // Rostered all season, not retained
      seasonEntries.push({kind:'season',manager:s.manager_name,slot:s,ts:s.year*1e12})
    }
  }

  // ── Merge all entries, sort oldest → newest ──────────────────────────────
  const allEntries: Entry[] = [
    ...stintEntries,
    ...deadEntries,
    ...seasonEntries,
  ].sort((a,b)=>a.ts-b.ts)

  // Header info
  const latestActive=[...slots].filter(s=>s.slot_type!=='dropped').sort((a,b)=>b.year-a.year)[0]
  const isFranchise=latestActive?.is_franchise_player===true||(latestActive?.is_franchise_player as unknown as string)==='true'
  const isCurrentlyActive=slots.some(s=>s.year===CURRENT_YEAR&&s.slot_type!=='dropped')

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:100,backdropFilter:'blur(3px)'}}/>
      <div style={{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        width:'min(580px,95vw)',maxHeight:'88vh',background:'#fff',
        border:'1px solid #e2e6eb',borderRadius:12,zIndex:101,
        display:'flex',flexDirection:'column',overflow:'hidden',
        boxShadow:'0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{padding:'16px 20px 12px',borderBottom:'1px solid #f0f2f5'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
            <div>
              <h2 className={isFranchise?'franchise-player':''} style={{margin:0,fontSize:'1.15rem',fontWeight:800,color:'#111827',letterSpacing:'-0.02em'}}>
                {playerName}
                {isFranchise&&<span style={{fontSize:'0.68rem',color:'#1d4ed8',marginLeft:6,fontStyle:'normal',fontFamily:'sans-serif'}}>★</span>}
              </h2>
              {latestActive&&!loading&&(
                <div style={{marginTop:4,display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>
                  <ServiceYearBadge year={latestActive.service_year} size="md"/>
                  <span style={{fontSize:'0.78rem',color:'#6b7280'}}>Yr {latestActive.service_year}</span>
                  <span style={{color:'#d1d5db'}}>·</span>
                  <span style={{fontSize:'0.85rem',fontWeight:700,color:'#111827'}}>${latestActive.salary}</span>
                  <span style={{color:'#d1d5db'}}>·</span>
                  <span style={{fontSize:'0.78rem',color:'#6b7280'}}>KP ${getKeeperPrice(latestActive.salary)}</span>
                  {isFranchise&&<span style={{fontSize:'0.7rem',fontWeight:700,color:'#1d4ed8',background:'#eff6ff',padding:'1px 5px',borderRadius:3}}>★ Franchise</span>}
                </div>
              )}
              {!latestActive&&!loading&&slots.length>0&&<div style={{marginTop:3,fontSize:'0.78rem',color:'#9ca3af'}}>Not currently rostered</div>}
            </div>
            <button onClick={onClose} style={{background:'#f4f5f7',border:'none',borderRadius:6,color:'#6b7280',cursor:'pointer',fontSize:'0.9rem',padding:'4px 8px'}}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{overflowY:'auto',flex:1,padding:'14px 20px 6px'}}>
          {loading&&<div style={{textAlign:'center',padding:36,color:'#9ca3af'}}>Loading…</div>}
          {!loading&&allEntries.length===0&&<div style={{textAlign:'center',padding:36,color:'#9ca3af'}}>No history available.</div>}

          {!loading&&allEntries.length>0&&(
            <div style={{position:'relative'}}>
              <div style={{position:'absolute',left:15,top:0,bottom:0,width:2,background:'#e2e6eb',borderRadius:1}}/>
              <div style={{display:'flex',flexDirection:'column',gap:0}}>
                {allEntries.map((entry,idx)=>{
                  const isLast=idx===allEntries.length-1

                  // ── STINT ──────────────────────────────────────────────
                  if(entry.kind==='stint'){
                    const {manager,acq,rel,slot}=entry
                    const slotType=(slot?.slot_type??'MLB')
                    const sty=S[(slotType in S ? slotType : 'MLB') as keyof typeof S]
                    const isActive=!rel&&isLast&&isCurrentlyActive
                    const acqYear=acq.year
                    const displaySalary=slotType==='dropped'?(slot?.dead_money??Math.ceil((slot?.salary??0)/2)):slot?.salary
                    const acqLabel=ACQ_LABEL[acq.type]??acq.type
                    const acqDate=fmtDate(acq.transaction_date)
                    const relDate=fmtDate(rel?.transaction_date??null)
                    const deadAmt=slot?.dead_money??Math.ceil((slot?.salary??0)/2)

                    return (
                      <div key={idx}>
                        {/* Year pill + card */}
                        <div style={{display:'flex',alignItems:'flex-start',gap:10,paddingBottom:3,paddingTop:idx===0?0:3}}>
                          <div style={{width:32,display:'flex',justifyContent:'center',flexShrink:0,paddingTop:9}}>
                            <div style={{background:isActive?sty.color:'#9ca3af',color:'#fff',fontSize:'0.56rem',fontWeight:800,padding:'2px 3px',borderRadius:4,lineHeight:1.4,textAlign:'center',zIndex:1,minWidth:30}}>
                              {acqYear}
                            </div>
                          </div>
                          <div style={{flex:1,background:sty.bg,border:`1px solid ${sty.border}`,borderRadius:8,padding:'8px 11px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:7}}>
                              <span style={{fontSize:'0.6rem',fontWeight:700,textTransform:'uppercase',color:sty.color,minWidth:36,letterSpacing:'0.04em'}}>{sty.label}</span>
                              <span style={{flex:1,fontSize:'0.88rem',fontWeight:700,color:'#111827'}}>{manager}</span>
                              {slot&&<ServiceYearBadge year={slot.service_year}/>}
                              {displaySalary!=null&&<span style={{fontSize:'0.85rem',fontWeight:700,color:'#374151',fontVariantNumeric:'tabular-nums'}}>${displaySalary}</span>}
                              {slot&&slotType!=='dropped'&&<span style={{fontSize:'0.75rem',color:'#9ca3af',fontVariantNumeric:'tabular-nums'}}>KP ${getKeeperPrice(slot.salary)}</span>}
                            </div>
                            <div style={{marginTop:3,fontSize:'0.73rem',color:'#6b7280'}}>
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

                        {/* Release connector — only between stints, not at end */}
                        {rel&&!isLast&&(()=>{
                          const color=REL_COLOR[rel.type]??'#6b7280'
                          const label=REL_LABEL[rel.type]??rel.type
                          const date=fmtDate(rel.transaction_date)
                          const priceStr=rel.type==='drop'&&deadAmt?`$${deadAmt} dead cap`:null
                          return (
                            <div style={{display:'flex',alignItems:'center',gap:10,padding:'2px 0 2px 0'}}>
                              <div style={{width:32,display:'flex',justifyContent:'center',flexShrink:0}}>
                                <div style={{width:8,height:8,borderRadius:'50%',background:color,border:'2px solid #fff',boxShadow:`0 0 0 2px ${color}40`,zIndex:1}}/>
                              </div>
                              <div style={{flex:1,display:'flex',gap:8,alignItems:'baseline',fontSize:'0.76rem'}}>
                                <span style={{fontWeight:700,color}}>{label}</span>
                                {priceStr&&<span style={{color:'#9ca3af'}}>{priceStr}</span>}
                                {date&&<span style={{color:'#9ca3af',marginLeft:'auto'}}>{date}</span>}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  }

                  // ── DEAD MONEY ────────────────────────────────────────
                  if(entry.kind==='dead'){
                    const {manager,dropTxn,slot}=entry
                    const dead=slot?.dead_money??Math.ceil((slot?.salary??0)/2)
                    const year=dropTxn?.year??slot?.year??'?'
                    const date=fmtDate(dropTxn?.transaction_date??null)
                    return (
                      <div key={idx} style={{display:'flex',alignItems:'flex-start',gap:10,paddingBottom:3,paddingTop:idx===0?0:3}}>
                        <div style={{width:32,display:'flex',justifyContent:'center',flexShrink:0,paddingTop:9}}>
                          <div style={{background:'#dc2626',color:'#fff',fontSize:'0.56rem',fontWeight:800,padding:'2px 3px',borderRadius:4,lineHeight:1.4,textAlign:'center',zIndex:1,minWidth:30}}>
                            {year}
                          </div>
                        </div>
                        <div style={{flex:1,background:S.dead.bg,border:`1px solid ${S.dead.border}`,borderLeft:'3px solid #dc2626',borderRadius:8,padding:'8px 11px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:7}}>
                            <span style={{fontSize:'0.6rem',fontWeight:700,textTransform:'uppercase',color:'#dc2626',minWidth:36,letterSpacing:'0.04em'}}>DEAD $</span>
                            <span style={{flex:1,fontSize:'0.88rem',fontWeight:700,color:'#111827'}}>{manager}</span>
                            {dead>0&&<span style={{fontSize:'0.85rem',fontWeight:700,color:'#dc2626',fontVariantNumeric:'tabular-nums'}}>${dead}</span>}
                          </div>
                          <div style={{marginTop:2,fontSize:'0.72rem',color:'#9ca3af'}}>
                            Dropped{date&&<><span style={{margin:'0 4px'}}>·</span><span style={{fontWeight:500,color:'#6b7280'}}>{date}</span></>}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // ── SEASON (not retained) ────────────────────────────
                  if(entry.kind==='season'){
                    const {manager,slot}=entry
                    const slotType=slot.slot_type
                    const sty=S[(slotType in S ? slotType : 'season') as keyof typeof S]
                    return (
                      <div key={idx} style={{display:'flex',alignItems:'flex-start',gap:10,paddingBottom:3,paddingTop:idx===0?0:3}}>
                        <div style={{width:32,display:'flex',justifyContent:'center',flexShrink:0,paddingTop:9}}>
                          <div style={{background:'#9ca3af',color:'#fff',fontSize:'0.56rem',fontWeight:800,padding:'2px 3px',borderRadius:4,lineHeight:1.4,textAlign:'center',zIndex:1,minWidth:30}}>
                            {slot.year}
                          </div>
                        </div>
                        <div style={{flex:1,background:'#f8f9fb',border:'1px solid #e2e6eb',borderRadius:8,padding:'8px 11px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:7}}>
                            <span style={{fontSize:'0.6rem',fontWeight:700,textTransform:'uppercase',color:'#6b7280',minWidth:36,letterSpacing:'0.04em'}}>{sty.label}</span>
                            <span style={{flex:1,fontSize:'0.88rem',fontWeight:700,color:'#374151'}}>{manager}</span>
                            <ServiceYearBadge year={slot.service_year}/>
                            <span style={{fontSize:'0.85rem',fontWeight:700,color:'#6b7280',fontVariantNumeric:'tabular-nums'}}>${slot.salary}</span>
                            <span style={{fontSize:'0.75rem',color:'#9ca3af',fontVariantNumeric:'tabular-nums'}}>KP ${getKeeperPrice(slot.salary)}</span>
                          </div>
                          <div style={{marginTop:2,fontSize:'0.72rem',color:'#9ca3af',fontStyle:'italic'}}>
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
        <div style={{padding:'8px 20px 12px',borderTop:'1px solid #f0f2f5',background:'#fafbfc'}}>
          <div style={{fontSize:'0.58rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'#9ca3af',marginBottom:5}}>Legend</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[
              {bg:S.MLB.bg,  border:S.MLB.border,  color:S.MLB.color,  label:'MLB active'},
              {bg:S.MiLB.bg, border:S.MiLB.border, color:S.MiLB.color, label:'MiLB'},
              {bg:S.IL.bg,   border:S.IL.border,   color:S.IL.color,   label:'IL'},
              {bg:S.dead.bg, border:S.dead.border, color:S.dead.color, label:'Dead cap'},
              {bg:'#f8f9fb', border:'#e2e6eb',      color:'#6b7280',    label:'Not retained'},
            ].map(s=>(
              <div key={s.label} style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{width:10,height:10,borderRadius:3,background:s.bg,border:`1px solid ${s.border}`}}/>
                <span style={{fontSize:'0.67rem',color:'#6b7280'}}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
