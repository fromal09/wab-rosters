'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getServiceYearColor } from '@/lib/constants'

interface Result { id:string; name:string; current:{slot_type:string;salary:number;service_year:number;manager_name:string}|null }
interface Props { onSelect:(name:string)=>void; year?:number }

const SLOT_COLORS: Record<string,string> = { MLB:'#166534', MiLB:'#1a56db', IL:'#b45309' }

export default function GlobalSearch({ onSelect, year }: Props) {
  const [query,setQuery]=useState('')
  const [results,setResults]=useState<Result[]>([])
  const [open,setOpen]=useState(false)
  const [active,setActive]=useState(-1)
  const [loading,setLoading]=useState(false)
  const inputRef=useRef<HTMLInputElement>(null)
  const debounceRef=useRef<ReturnType<typeof setTimeout>|null>(null)

  const search=useCallback(async(q:string)=>{
    if(q.length<2){setResults([]);setOpen(false);return}
    setLoading(true)
    try{
      const data=await (await fetch(`/api/search?q=${encodeURIComponent(q)}${year?`&year=${year}`:''}`)).json()
      setResults(data);setOpen(data.length>0);setActive(-1)
    }finally{setLoading(false)}
  },[year])

  useEffect(()=>{
    if(debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current=setTimeout(()=>search(query),200)
    return()=>{if(debounceRef.current) clearTimeout(debounceRef.current)}
  },[query,search])

  function select(name:string){setQuery('');setOpen(false);setResults([]);onSelect(name)}

  function onKeyDown(e:React.KeyboardEvent){
    if(!open) return
    if(e.key==='ArrowDown'){e.preventDefault();setActive(a=>Math.min(a+1,results.length-1))}
    if(e.key==='ArrowUp'){e.preventDefault();setActive(a=>Math.max(a-1,0))}
    if(e.key==='Enter'&&active>=0){e.preventDefault();select(results[active].name)}
    if(e.key==='Escape'){setOpen(false);inputRef.current?.blur()}
  }

  return (
    <div style={{position:'relative'}}>
      <div style={{position:'relative',display:'flex',alignItems:'center'}}>
        <span style={{position:'absolute',left:8,color:'#9ca3af',fontSize:'0.8rem',pointerEvents:'none'}}>🔍</span>
        <input ref={inputRef} value={query}
          onChange={e=>setQuery(e.target.value)} onKeyDown={onKeyDown}
          onFocus={e=>{if(results.length>0)setOpen(true);e.currentTarget.style.borderColor='#1a56db'}}
          onBlur={e=>{e.currentTarget.style.borderColor='#e4e7ec';setTimeout(()=>setOpen(false),150)}}
          placeholder="Search players…"
          style={{width:200,padding:'6px 8px 6px 28px',background:'#f6f7f9',border:'1px solid #e4e7ec',borderRadius:6,color:'#0f1117',fontSize:'0.8rem',outline:'none',transition:'border-color 0.15s'}}
        />
        {loading&&<span style={{position:'absolute',right:8,color:'#9ca3af',fontSize:'0.65rem'}}>…</span>}
      </div>
      {open&&results.length>0&&(
        <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,background:'#fff',border:'1px solid #e4e7ec',borderRadius:8,zIndex:200,overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,0.1)',minWidth:260,right:0}}>
          {results.map((r,i)=>(
            <button key={r.id} onMouseDown={()=>select(r.name)} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'7px 10px',background:i===active?'#f6f7f9':'transparent',border:'none',borderBottom:i<results.length-1?'1px solid #f0f2f5':'none',cursor:'pointer',textAlign:'left'}}>
              <span style={{width:7,height:7,borderRadius:'50%',flexShrink:0,background:r.current?getServiceYearColor(r.current.service_year):'#e4e7ec',border:'1px solid rgba(0,0,0,0.1)'}}/>
              <span style={{flex:1,fontSize:'0.82rem',color:'#0f1117',fontWeight:500}}>{r.name}</span>
              {r.current?(
                <div style={{display:'flex',gap:5,alignItems:'center'}}>
                  <span style={{fontSize:'0.62rem',fontWeight:700,color:SLOT_COLORS[r.current.slot_type]??'#6b7280',textTransform:'uppercase'}}>{r.current.slot_type}</span>
                  <span style={{fontSize:'0.7rem',color:'#9ca3af'}}>{r.current.manager_name?.split(' ')[0]}</span>
                  <span style={{fontSize:'0.72rem',fontWeight:700,color:'#374151'}}>${r.current.salary}</span>
                </div>
              ):(
                <span style={{fontSize:'0.68rem',color:'#9ca3af'}}>FA</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
