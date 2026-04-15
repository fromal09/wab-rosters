import Link from 'next/link'

// Full league history from League History tab of WAB Rosters spreadsheet
// All years are WAB era

const ALL_YEARS = [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025]

const CHAMPIONS: Record<number,{winner:string;last:string}> = {
  2007:{winner:'Shorty Hoffman',    last:'Mark Kagika'},
  2008:{winner:'Jack Murphy',       last:'Jake Espenlaub'},
  2009:{winner:'Shashank Bharadwaj',last:'Jake Espenlaub'},
  2010:{winner:'Shorty Hoffman',    last:'Michael Tumey'},
  2011:{winner:'Shorty Hoffman',    last:'Jake Espenlaub'},
  2012:{winner:'Shorty Hoffman',    last:'Chris Cusack'},
  2013:{winner:'Shashank Bharadwaj',last:'Robbie Ottley'},
  2014:{winner:'Adam Fromal',       last:'Zach Morgan'},
  2015:{winner:'Jacob Newcomer',    last:'Arjun Baradwaj'},
  2016:{winner:'Eric Fleury',       last:'Tom Gieryn'},
  2017:{winner:'Jacob Newcomer',    last:'Michael Tumey'},
  2018:{winner:'Michael Tumey',     last:'Nick Juskewycz'},
  2019:{winner:'Jacob Newcomer',    last:'Adam Fromal'},
  2020:{winner:'Jacob Newcomer',    last:'Robert Ray'},
  2021:{winner:'Shorty Hoffman',    last:'Chris Glazier'},
  2022:{winner:'Jacob Newcomer',    last:'Arjun Baradwaj'},
  2023:{winner:'Jacob Newcomer',    last:'Chris Glazier'},
  2024:{winner:'Jacob Newcomer',    last:'Arjun Baradwaj'},
  2025:{winner:'Eric Fleury',       last:'Chris Glazier'},
}

type Finishes = Record<number,number|null>

const MANAGERS: {name:string;slug?:string;finishes:Finishes}[] = [
  {name:'Jacob Newcomer',    slug:'jacob-newcomer',    finishes:{2010:4,2011:3,2012:8,2013:4,2014:3,2015:1,2016:2,2017:1,2018:6,2019:1,2020:1,2021:3,2022:1,2023:1,2024:1,2025:8}},
  {name:'Shorty Hoffman',    slug:'shorty-hoffman',    finishes:{2007:1,2008:5,2009:2,2010:1,2011:1,2012:1,2013:8,2014:5,2015:2,2016:8,2017:2,2018:7,2019:2,2020:2,2021:1,2022:9,2023:2,2024:2,2025:3}},
  {name:'Eric Fleury',       slug:'eric-fleury',       finishes:{2015:6,2016:1,2017:3,2018:3,2019:4,2020:3,2021:4,2022:5,2023:8,2024:3,2025:1}},
  {name:'Matt Amodio',                                 finishes:{2014:4}},
  {name:'Shashank Bharadwaj',slug:'shashank-bharadwaj',finishes:{2007:5,2008:4,2009:1,2010:10,2011:2,2012:2,2013:1,2014:2,2015:3,2016:7,2017:9,2023:5,2024:7}},
  {name:'Jack Murphy',                                  finishes:{2007:7,2008:1,2009:7,2010:3}},
  {name:'Sheldon Taylor',                               finishes:{2007:4,2008:3,2009:5,2010:2,2011:9,2012:7}},
  {name:'Bretton McIlrath',  slug:'bretton-mcilrath',  finishes:{2015:8,2016:3,2017:8,2018:2,2019:3,2020:5,2021:2,2022:8,2023:4,2024:6,2025:6}},
  {name:'Adam Fromal',       slug:'adam-fromal',       finishes:{2007:2,2008:2,2009:3,2010:7,2011:6,2012:5,2013:5,2014:1,2015:7,2016:6,2017:7,2018:5,2019:8,2020:8,2021:9,2022:2,2023:7,2024:7,2025:2}},
  {name:'Michael Tumey',     slug:'michael-tumey',     finishes:{2010:12,2011:7,2012:4,2013:3,2014:7,2015:5,2016:4,2017:3,2018:1,2019:5,2020:4,2021:5,2022:4,2023:3,2024:9,2025:5}},
  {name:'Aditya Baradwaj',                              finishes:{2011:8,2012:3,2013:6,2014:6}},
  {name:'Tom Gieryn',                                   finishes:{2007:3,2008:7,2009:9,2010:8,2011:5,2012:6,2013:2,2014:8,2015:4,2016:10,2017:6,2018:8,2019:6}},
  {name:'Josh Meyerchick',                              finishes:{2018:9,2025:4}},
  {name:'Doug Murphy',                                  finishes:{2007:6,2008:6,2009:4,2010:11}},
  {name:'Arjun Baradwaj',    slug:'arjun-baradwaj',    finishes:{2015:10,2016:5,2017:5,2018:4,2019:7,2020:7,2021:6,2022:10,2023:6,2024:10,2025:7}},
  {name:'Graham Perry',                                 finishes:{2008:9,2009:6,2010:6}},
  {name:'Robert Ray',        slug:'robert-ray',        finishes:{2020:10,2021:8,2022:7,2023:5,2024:4,2025:9}},
  {name:'Chris Cusack',                                 finishes:{2011:4,2012:10,2013:9}},
  {name:'Brendan Prin',                                 finishes:{2020:9,2021:7,2022:6,2023:9}},
  {name:'Chris Glazier',     slug:'chris-glazier',     finishes:{2020:6,2021:10,2022:3,2023:10,2024:8,2025:10}},
  {name:'Nick Juskewycz',                               finishes:{2015:9,2016:9,2017:4,2018:10}},
  {name:'Kyle Mumma',                                   finishes:{2013:7,2014:9}},
  {name:'Joey Mazier',                                  finishes:{2009:8}},
  {name:'Rick Diamond',                                 finishes:{2008:8}},
  {name:'Mark Kagika',                                  finishes:{2007:8,2008:10}},
  {name:'Ethan Mann',                                   finishes:{2012:9}},
  {name:'Todd Mazier',                                  finishes:{2010:9}},
  {name:'Jake Espenlaub',                               finishes:{2008:12,2009:10,2010:5,2011:10}},
  {name:'Zach Morgan',                                  finishes:{2014:10}},
  {name:'Robbie Ottley',                                finishes:{2013:10}},
  {name:'Ishan Nath',                                   finishes:{2008:11}},
]

// Compute stats and sort by avg finish
const managersWithStats = MANAGERS.map(m => {
  const positions = Object.values(m.finishes).filter((p): p is number => p != null)
  const wins  = Object.entries(CHAMPIONS).filter(([,c])=>c.winner===m.name).length
  const lasts = Object.entries(CHAMPIONS).filter(([,c])=>c.last===m.name).length
  const avg   = positions.length>0 ? positions.reduce((a,b)=>a+b,0)/positions.length : 999
  return {...m, wins, lasts, avg, seasons:positions.length}
}).sort((a,b) => a.avg - b.avg)

function posColor(pos:number|null|undefined):{bg:string;color:string;fw:number} {
  if (pos==null) return {bg:'transparent',color:'#d1d5db',fw:400}
  if (pos===1)   return {bg:'#fef9c3',color:'#854d0e',fw:800}
  if (pos===2)   return {bg:'#f1f5f9',color:'#475569',fw:700}
  if (pos===3)   return {bg:'#fff7ed',color:'#9a3412',fw:700}
  if (pos<=5)    return {bg:'#f0fdf4',color:'#15803d',fw:600}
  if (pos>=9)    return {bg:'#fef2f2',color:'#dc2626',fw:600}
  return {bg:'#f8f9fb',color:'#374151',fw:500}
}

// Group years into chunks for display (early era / modern era)
const EARLY_YEARS  = ALL_YEARS.filter(y=>y<=2014)
const MODERN_YEARS = ALL_YEARS.filter(y=>y>=2015)

export default function HistoryPage() {
  return (
    <div style={{maxWidth:1300,margin:'0 auto'}}>
      {/* Breadcrumb + header */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:'0.8rem',color:'#9ca3af',marginBottom:8}}>
          <Link href="/" style={{color:'#6b7280',textDecoration:'none'}}>League</Link>
          <span style={{margin:'0 6px',color:'#d1d5db'}}>›</span>
          <span style={{color:'#374151'}}>History</span>
        </div>
        <h1 style={{margin:0,fontSize:'1.5rem',fontWeight:800,color:'#111827',letterSpacing:'-0.02em'}}>League History</h1>
        <p style={{margin:'4px 0 0',color:'#6b7280',fontSize:'0.84rem'}}>
          Westminster Auction Baseball · {ALL_YEARS[0]}–{ALL_YEARS[ALL_YEARS.length-1]} · {managersWithStats.length} managers all-time
        </p>
      </div>

      {/* Champions banner */}
      <div className="card" style={{padding:'16px 20px',marginBottom:20,overflowX:'auto'}}>
        <div style={{fontSize:'0.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'#9ca3af',marginBottom:12}}>Champions by Year</div>
        <div style={{display:'flex',gap:8,minWidth:'max-content'}}>
          {ALL_YEARS.map(y=>{
            const c=CHAMPIONS[y]
            if (!c) return null
            const short = c.winner.split(' ').map((w,i)=>i===0?w:w[0]+'.').join(' ')
            return (
              <div key={y} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'8px 10px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:7,minWidth:72,textAlign:'center'}}>
                <div style={{fontSize:'0.6rem',fontWeight:700,color:'#92400e',letterSpacing:'0.05em'}}>{y}</div>
                <div style={{fontSize:'0.95rem',lineHeight:1}}>🏆</div>
                <div style={{fontSize:'0.7rem',fontWeight:700,color:'#111827',lineHeight:1.2}}>{short}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Career summary table */}
      <div className="card" style={{overflow:'hidden',marginBottom:20}}>
        <div style={{padding:'12px 16px',background:'#f8f9fb',borderBottom:'1px solid #e2e6eb'}}>
          <div style={{fontSize:'0.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'#9ca3af'}}>
            Career Summary — sorted by average finish
          </div>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.83rem'}}>
          <thead>
            <tr style={{background:'#f8f9fb'}}>
              {['Manager','Seasons','Avg','🏆','💩'].map(h=>(
                <th key={h} style={{padding:'6px 12px',textAlign:h==='Manager'?'left':'center',fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.07em',color:'#9ca3af',fontWeight:600,borderBottom:'1px solid #e2e6eb'}}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {managersWithStats.map(m=>(
              <tr key={m.name} style={{borderBottom:'1px solid #f0f2f5'}}>
                <td style={{padding:'6px 12px'}}>
                  {m.slug
                    ? <Link href={`/team/${m.slug}`} style={{fontWeight:600,color:'#111827',textDecoration:'none'}}>{m.name}</Link>
                    : <span style={{color:'#6b7280'}}>{m.name}</span>
                  }
                </td>
                <td style={{padding:'6px 12px',textAlign:'center',color:'#6b7280'}}>{m.seasons}</td>
                <td style={{padding:'6px 12px',textAlign:'center',fontWeight:600,color:'#374151',fontVariantNumeric:'tabular-nums'}}>
                  {m.avg<99?m.avg.toFixed(1):'—'}
                </td>
                <td style={{padding:'6px 12px',textAlign:'center'}}>
                  {m.wins>0?<span style={{fontWeight:800,color:'#854d0e',fontSize:'0.85rem'}}>{'🏆'.repeat(m.wins)}</span>:<span style={{color:'#d1d5db'}}>—</span>}
                </td>
                <td style={{padding:'6px 12px',textAlign:'center'}}>
                  {m.lasts>0?<span style={{fontWeight:700,color:'#dc2626',fontSize:'0.85rem'}}>{'💩'.repeat(m.lasts)}</span>:<span style={{color:'#d1d5db'}}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Full standings grid — Modern era */}
      <StandingsGrid label="Modern Era (2015–2025)" years={MODERN_YEARS} managers={managersWithStats} />

      {/* Full standings grid — Early era */}
      <StandingsGrid label="Early Era (2007–2014)" years={EARLY_YEARS} managers={managersWithStats} />

      {/* Color key */}
      <div style={{marginTop:16,padding:'10px 16px',background:'#fff',border:'1px solid #e2e6eb',borderRadius:8,display:'flex',gap:14,flexWrap:'wrap',alignItems:'center'}}>
        {[
          {bg:'#fef9c3',color:'#854d0e',label:'1st 🏆'},
          {bg:'#f1f5f9',color:'#475569',label:'2nd'},
          {bg:'#fff7ed',color:'#9a3412',label:'3rd'},
          {bg:'#f0fdf4',color:'#15803d',label:'4th–5th'},
          {bg:'#fef2f2',color:'#dc2626',label:'9th–last 💩'},
        ].map(s=>(
          <div key={s.label} style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:13,height:13,borderRadius:3,background:s.bg,border:'1px solid rgba(0,0,0,0.08)',display:'inline-block'}}/>
            <span style={{fontSize:'0.7rem',color:'#6b7280'}}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StandingsGrid({label,years,managers}:{label:string;years:number[];managers:typeof managersWithStats}) {
  // Only show managers who played in at least one of these years
  const relevant = managers.filter(m=>years.some(y=>m.finishes[y]!=null))
  return (
    <div className="card" style={{overflow:'hidden',marginBottom:16}}>
      <div style={{padding:'10px 16px',background:'#f8f9fb',borderBottom:'1px solid #e2e6eb'}}>
        <div style={{fontSize:'0.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'#9ca3af'}}>{label}</div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse',fontSize:'0.82rem',minWidth:'max-content',width:'100%'}}>
          <thead>
            <tr style={{background:'#f8f9fb'}}>
              <th style={{padding:'6px 14px',textAlign:'left',fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.07em',color:'#9ca3af',fontWeight:600,borderBottom:'1px solid #e2e6eb',position:'sticky',left:0,background:'#f8f9fb',zIndex:2}}>
                Manager
              </th>
              {years.map(y=>(
                <th key={y} style={{padding:'6px 8px',textAlign:'center',fontSize:'0.65rem',color:'#9ca3af',fontWeight:600,borderBottom:'1px solid #e2e6eb',minWidth:46}}>
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {relevant.map(m=>(
              <tr key={m.name} style={{borderBottom:'1px solid #f0f2f5'}}>
                <td style={{padding:'5px 14px',whiteSpace:'nowrap',position:'sticky',left:0,background:'#fff',zIndex:1,borderRight:'1px solid #f0f2f5'}}>
                  {m.slug
                    ? <Link href={`/team/${m.slug}`} style={{fontWeight:600,color:'#111827',textDecoration:'none'}}>{m.name}</Link>
                    : <span style={{color:'#6b7280'}}>{m.name}</span>
                  }
                </td>
                {years.map(y=>{
                  const pos = m.finishes[y]??null
                  const {bg,color,fw} = posColor(pos)
                  const isWinner = CHAMPIONS[y]?.winner===m.name
                  const isLast   = CHAMPIONS[y]?.last===m.name
                  return (
                    <td key={y} style={{padding:'5px 8px',textAlign:'center',background:bg}}>
                      {pos!=null?(
                        <span style={{fontSize:'0.82rem',fontWeight:fw,color,display:'inline-flex',alignItems:'center',gap:2}}>
                          {pos}
                          {isWinner&&<span style={{fontSize:'0.65rem'}}>🏆</span>}
                          {isLast&&<span style={{fontSize:'0.65rem'}}>💩</span>}
                        </span>
                      ):(
                        <span style={{color:'#e5e7eb',fontSize:'0.7rem'}}>·</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
