import React, { useState, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, Legend, ReferenceLine
} from 'recharts';

const S = {
  title:{ fontFamily:"'Space Mono',monospace", fontSize:'2rem', color:'#e8d5b7', marginBottom:'0.3rem' },
  sub:{ color:'#4b5563', fontSize:'0.9rem', marginBottom:'1.5rem' },
  filterBar:{ background:'#080818', border:'1px solid #12122a', borderRadius:12, padding:'1rem 1.2rem', marginBottom:'1.5rem', display:'flex', gap:'1.5rem', flexWrap:'wrap', alignItems:'center' },
  filterLabel:{ fontSize:'0.75rem', color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 },
  select:{ background:'#060612', border:'1px solid #1a1a30', borderRadius:6, padding:'0.4rem 0.7rem', color:'#e8d5b7', fontSize:'0.82rem', fontFamily:"'Inter',sans-serif" },
  kpiGrid:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.8rem', marginBottom:'1.5rem' },
  kpi:{ background:'#080818', border:'1px solid #12122a', borderRadius:10, padding:'1rem', textAlign:'center' },
  kpiVal:{ fontFamily:"'Space Mono',monospace", fontSize:'1.5rem', color:'#e8d5b7' },
  kpiLbl:{ fontSize:'0.68rem', color:'#374151', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 },
  chartsGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.2rem', marginBottom:'1.2rem' },
  card:{ background:'#080818', border:'1px solid #12122a', borderRadius:14, padding:'1.3rem' },
  cardTitle:{ fontFamily:"'Space Mono',monospace", fontSize:'0.7rem', color:'#374151', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'1rem' },
  table:{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' },
  th:{ textAlign:'left', padding:'0.5rem 0.6rem', color:'#4b5563', fontWeight:600, borderBottom:'1px solid #0f1117', fontSize:'0.7rem', textTransform:'uppercase' },
  td:{ padding:'0.45rem 0.6rem', borderBottom:'1px solid #0a0a18', color:'#9ca3af' },
};

const TT = ({active,payload,label}) => active&&payload?.length ? (
  <div style={{background:'#0f1117',border:'1px solid #1f2937',borderRadius:8,padding:'8px 12px',fontSize:11,color:'#e8d5b7'}}>
    {payload.map((p,i)=><div key={i} style={{color:p.color||'#e8d5b7'}}>{p.name}: {typeof p.value==='number'?p.value.toFixed(3):p.value}</div>)}
  </div>
) : null;

export default function Dashboard({dataset}){
  const [elemFilter, setElemFilter] = useState('all');
  const [stabFilter, setStabFilter] = useState('all');

  const filtered = useMemo(()=> dataset.filter(r=>{
    if(elemFilter!=='all' && r.element!==elemFilter) return false;
    if(stabFilter==='stable' && r.stable!==1) return false;
    if(stabFilter==='unstable' && r.stable!==0) return false;
    return true;
  }), [dataset, elemFilter, stabFilter]);

  const stableCount   = filtered.filter(r=>r.stable===1).length;
  const avgGap        = (filtered.reduce((a,r)=>a+r.homo_lumo_gap_eV,0)/filtered.length||0).toFixed(2);
  const avgEf         = (filtered.reduce((a,r)=>a+r.formation_energy_eV,0)/filtered.length||0).toFixed(2);

  // Scatter: HL gap vs size
  const scatterStable   = filtered.filter(r=>r.stable===1).map(r=>({x:r.n_atoms, y:r.homo_lumo_gap_eV}));
  const scatterUnstable = filtered.filter(r=>r.stable===0).map(r=>({x:r.n_atoms, y:r.homo_lumo_gap_eV}));

  // Formation energy histogram buckets
  const buckets = {};
  filtered.forEach(r=>{
    const b = Math.round(r.formation_energy_eV*2)/2;
    if(!buckets[b]) buckets[b]={x:b,stable:0,unstable:0};
    r.stable===1 ? buckets[b].stable++ : buckets[b].unstable++;
  });
  const histData = Object.values(buckets).sort((a,b)=>a.x-b.x);

  // Odd-even line
  const lineAu={}, lineAg={};
  filtered.forEach(r=>{
    if(r.element==='Au'){ if(!lineAu[r.n_atoms]) lineAu[r.n_atoms]=[]; lineAu[r.n_atoms].push(r.homo_lumo_gap_eV); }
    else { if(!lineAg[r.n_atoms]) lineAg[r.n_atoms]=[]; lineAg[r.n_atoms].push(r.homo_lumo_gap_eV); }
  });
  const lineData = [...new Set(filtered.map(r=>r.n_atoms))].sort((a,b)=>a-b).map(n=>({
    n, Au: lineAu[n] ? lineAu[n].reduce((a,v)=>a+v,0)/lineAu[n].length : null,
    Ag: lineAg[n] ? lineAg[n].reduce((a,v)=>a+v,0)/lineAg[n].length : null,
  }));

  return (
    <div>
      <div style={S.title}>📊 Dataset Dashboard</div>
      <div style={S.sub}>Explore the 200-sample DFT-curated nanocluster dataset.</div>

      <div style={S.filterBar}>
        <div>
          <div style={S.filterLabel}>Element</div>
          <select style={S.select} value={elemFilter} onChange={e=>setElemFilter(e.target.value)}>
            <option value="all">All</option><option value="Au">Au — Gold</option><option value="Ag">Ag — Silver</option>
          </select>
        </div>
        <div>
          <div style={S.filterLabel}>Stability</div>
          <select style={S.select} value={stabFilter} onChange={e=>setStabFilter(e.target.value)}>
            <option value="all">All</option><option value="stable">Stable only</option><option value="unstable">Unstable only</option>
          </select>
        </div>
        <div style={{marginLeft:'auto',color:'#374151',fontSize:'0.8rem'}}>
          Showing <strong style={{color:'#6b7280'}}>{filtered.length}</strong> of {dataset.length} clusters
        </div>
      </div>

      <div style={S.kpiGrid}>
        {[[filtered.length,'Clusters','#3b82f6'],[stableCount,'Stable','#10b981'],
          [`${avgGap} eV`,'Avg HL Gap','#8b5cf6'],[`${avgEf}`,'Avg Ef (eV/at)','#f59e0b']
        ].map(([v,l,c])=>(
          <div key={l} style={S.kpi}>
            <div style={{...S.kpiVal,color:c}}>{v}</div>
            <div style={S.kpiLbl}>{l}</div>
          </div>
        ))}
      </div>

      <div style={S.chartsGrid}>
        <div style={S.card}>
          <div style={S.cardTitle}>HOMO-LUMO Gap vs Cluster Size</div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{top:5,right:10,left:-15,bottom:5}}>
              <XAxis dataKey="x" name="Atoms" tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false} label={{value:'Atoms',position:'insideBottom',offset:-2,fill:'#4b5563',fontSize:11}}/>
              <YAxis dataKey="y" name="HL Gap" tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip cursor={{fill:'transparent'}} content={<TT/>}/>
              <ReferenceLine y={0.5} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}/>
              <Scatter name="Stable"   data={scatterStable}   fill="#10b981" opacity={0.75} r={4}/>
              <Scatter name="Unstable" data={scatterUnstable} fill="#ef4444" opacity={0.65} r={4}/>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:12,marginTop:6,fontSize:'0.72rem',color:'#4b5563'}}>
            <span style={{color:'#10b981'}}>● Stable</span>
            <span style={{color:'#ef4444'}}>● Unstable</span>
            <span style={{color:'#f59e0b'}}>— 0.5 eV threshold</span>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Formation Energy Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={histData} margin={{top:5,right:10,left:-15,bottom:5}}>
              <XAxis dataKey="x" tick={{fill:'#6b7280',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v.toFixed(1)}/>
              <YAxis tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <ReferenceLine x={-1} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}/>
              <Bar dataKey="stable"   name="Stable"   fill="#10b981" opacity={0.8} radius={[3,3,0,0]}/>
              <Bar dataKey="unstable" name="Unstable" fill="#ef4444" opacity={0.7} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:12,marginTop:6,fontSize:'0.72rem',color:'#4b5563'}}>
            <span style={{color:'#10b981'}}>■ Stable</span>
            <span style={{color:'#ef4444'}}>■ Unstable</span>
            <span style={{color:'#f59e0b'}}>— −1.0 eV/atom threshold</span>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Odd-Even Oscillation in HL Gap</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{top:5,right:10,left:-15,bottom:5}}>
              <XAxis dataKey="n" tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <ReferenceLine y={0.5} stroke="#374151" strokeDasharray="3 3"/>
              <Line type="monotone" dataKey="Au" stroke="#f59e0b" strokeWidth={2} dot={{r:3,fill:'#f59e0b'}} name="Au" connectNulls/>
              <Line type="monotone" dataKey="Ag" stroke="#60a5fa" strokeWidth={2} dot={{r:3,fill:'#60a5fa'}} name="Ag" connectNulls/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:12,marginTop:6,fontSize:'0.72rem',color:'#4b5563'}}>
            <span style={{color:'#f59e0b'}}>— Au (Gold)</span>
            <span style={{color:'#60a5fa'}}>— Ag (Silver)</span>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Binding Energy vs Formation Energy</div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{top:5,right:10,left:-15,bottom:5}}>
              <XAxis dataKey="x" name="Binding E" tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false} label={{value:'Binding E (eV/at)',position:'insideBottom',offset:-2,fill:'#4b5563',fontSize:10}}/>
              <YAxis dataKey="y" name="Formation E" tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Scatter name="Stable"   data={filtered.filter(r=>r.stable===1).map(r=>({x:r.binding_energy_eV,y:r.formation_energy_eV}))} fill="#10b981" opacity={0.7} r={4}/>
              <Scatter name="Unstable" data={filtered.filter(r=>r.stable===0).map(r=>({x:r.binding_energy_eV,y:r.formation_energy_eV}))} fill="#ef4444" opacity={0.6} r={4}/>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{fontSize:'0.72rem',color:'#374151',marginTop:6}}>Mixed classes visible — confirming no single-feature separability</div>
        </div>
      </div>

      {/* Raw table */}
      <div style={S.card}>
        <div style={S.cardTitle}>Raw Dataset — {filtered.length} entries</div>
        <div style={{overflowX:'auto',maxHeight:320,overflowY:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>{['ID','Element','Atoms','Formation E','HL Gap','Binding E','Stable'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.slice(0,100).map((r,i)=>(
                <tr key={i} style={{background: i%2===0?'transparent':'rgba(255,255,255,0.01)'}}>
                  <td style={S.td}>{r.cluster_id}</td>
                  <td style={{...S.td, color: r.element==='Au'?'#f59e0b':'#60a5fa'}}>{r.element}</td>
                  <td style={S.td}>{r.n_atoms}</td>
                  <td style={S.td}>{r.formation_energy_eV?.toFixed(3)}</td>
                  <td style={S.td}>{r.homo_lumo_gap_eV?.toFixed(3)}</td>
                  <td style={S.td}>{r.binding_energy_eV?.toFixed(3)}</td>
                  <td style={S.td}><span style={{color:r.stable===1?'#10b981':'#ef4444',fontWeight:600}}>{r.stable===1?'✅ Stable':'❌ Unstable'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
