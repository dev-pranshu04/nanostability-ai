import React, { useState } from 'react';
import { API } from '../App';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

const S = {
  page:{ maxWidth:1000 },
  title:{ fontFamily:"'Space Mono',monospace", fontSize:'2rem', color:'#e8d5b7', marginBottom:'0.3rem' },
  sub:{ color:'#4b5563', fontSize:'0.9rem', marginBottom:'2rem' },
  sectionLabel:{ fontFamily:"'Space Mono',monospace", fontSize:'0.72rem', color:'#374151', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:'1px solid #0f1117' },
  grid3:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' },
  field:{ display:'flex', flexDirection:'column', gap:6 },
  label:{ fontSize:'0.8rem', color:'#9ca3af', fontWeight:500 },
  input:{ background:'#080818', border:'1px solid #1a1a30', borderRadius:8, padding:'0.6rem 0.8rem', color:'#e8d5b7', fontSize:'0.9rem', fontFamily:"'Inter',sans-serif", outline:'none', transition:'border-color 0.15s' },
  select:{ background:'#080818', border:'1px solid #1a1a30', borderRadius:8, padding:'0.6rem 0.8rem', color:'#e8d5b7', fontSize:'0.9rem', fontFamily:"'Inter',sans-serif", outline:'none' },
  btn:{ width:'100%', padding:'1rem', background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', border:'none', borderRadius:10, color:'white', fontSize:'1rem', fontWeight:600, cursor:'pointer', fontFamily:"'Space Mono',monospace", letterSpacing:'0.05em', marginTop:'0.5rem', transition:'opacity 0.15s' },
  btnDisabled:{ opacity:0.6, cursor:'not-allowed' },
  resultGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginTop:'2rem' },
  stableCard:{ background:'linear-gradient(135deg,#022c22,#064e3b)', border:'1px solid #10b981', borderRadius:16, padding:'2rem', textAlign:'center' },
  unstableCard:{ background:'linear-gradient(135deg,#2d0a0a,#450a0a)', border:'1px solid #ef4444', borderRadius:16, padding:'2rem', textAlign:'center' },
  resultLabel:{ fontFamily:"'Space Mono',monospace", fontSize:'2rem', fontWeight:700, marginBottom:'0.5rem' },
  confText:{ color:'#9ca3af', fontSize:'0.9rem' },
  insightCard:{ background:'#080818', border:'1px solid #12122a', borderRadius:12, padding:'1.2rem 1.4rem', marginTop:'1rem' },
  insightTitle:{ fontFamily:"'Space Mono',monospace", fontSize:'0.72rem', color:'#374151', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'0.8rem' },
  insightRow:{ display:'flex', alignItems:'flex-start', gap:'0.6rem', marginBottom:'0.6rem', fontSize:'0.85rem', color:'#9ca3af', lineHeight:1.6 },
};

const FIELDS = [
  ['formation_energy_eV','Formation Energy (eV/atom)',-1.72,-3,0,0.01,'More negative = thermodynamically stable'],
  ['homo_lumo_gap_eV','HOMO-LUMO Gap (eV)',1.42,0,4,0.01,'Large gap = electronically stable'],
  ['binding_energy_eV','Binding Energy (eV/atom)',2.18,0,4,0.01,'Energy holding the cluster together'],
  ['coord_number_avg','Avg Coordination Number',3.25,1,7,0.05,'Average atomic neighbors'],
  ['magnetic_moment_bohr','Magnetic Moment (Bohr)',0,0,5,1,'0 for closed-shell clusters'],
  ['ionization_potential_eV','Ionization Potential (eV)',8.21,5,12,0.01,'Energy to remove one electron'],
  ['electron_affinity_eV','Electron Affinity (eV)',2.68,0.5,5,0.01,'Energy when gaining one electron'],
  ['energy_above_lowest_eV','Energy Above Minimum (eV/at)',0,0,1,0.01,'0 = ground state structure'],
];

export default function Predict(){
  const [form, setForm] = useState({
    element:'Au', n_atoms:8,
    formation_energy_eV:-1.72, homo_lumo_gap_eV:1.42,
    binding_energy_eV:2.18, coord_number_avg:3.25,
    is_planar:0, magnetic_moment_bohr:0,
    ionization_potential_eV:8.21, electron_affinity_eV:2.68,
    energy_above_lowest_eV:0,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/predict`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({...form, n_atoms:Number(form.n_atoms)})
      });
      const d = await r.json();
      setResult(d);
    } catch(e){ alert('API error — check backend is running'); }
    setLoading(false);
  };

  const stable = result?.prediction === 1;
  const conf   = result ? (result.confidence*100).toFixed(1) : 0;

  const insights = result ? [
    form.homo_lumo_gap_eV > 1.2
      ? ['✅','HOMO-LUMO gap is large — strong electronic shell closure, resistant to chemical attack.']
      : form.homo_lumo_gap_eV > 0.5
        ? ['🟡','HOMO-LUMO gap is moderate — partial electronic stability.']
        : ['⚠️','HOMO-LUMO gap is small — cluster is electronically reactive.'],
    form.formation_energy_eV < -1.8
      ? ['✅',`Formation energy (${form.formation_energy_eV} eV/atom) strongly negative — very thermodynamically stable.`]
      : form.formation_energy_eV < -1.0
        ? ['🟡',`Formation energy (${form.formation_energy_eV} eV/atom) is moderately favorable.`]
        : ['⚠️',`Formation energy (${form.formation_energy_eV} eV/atom) — may not form spontaneously.`],
    [2,8,18,20].includes(Number(form.n_atoms))
      ? ['⭐',`${form.n_atoms} atoms = magic number — fully filled electronic shells greatly boost stability.`]
      : ['ℹ️',`${form.n_atoms} atoms — not a magic number. Shell closure effects are partial.`],
    form.energy_above_lowest_eV < 0.03
      ? ['✅','Energy above minimum ≈ 0 — this is the true ground-state structure.']
      : form.energy_above_lowest_eV < 0.1
        ? ['🟡','Small energy above minimum — likely a low-lying isomer.']
        : ['⚠️','Significant energy above minimum — metastable isomer, not ground state.'],
    form.element==='Au' && form.n_atoms<=12
      ? ['ℹ️','Gold clusters ≤12 atoms show relativistic stabilisation — 6s orbital contraction enhances bonding.']
      : ['ℹ️',`Silver follows regular shell-closing rules with more predictable stability patterns.`],
  ] : [];

  return (
    <div style={S.page}>
      <div style={S.title}>🔬 Predict Stability</div>
      <div style={S.sub}>Enter the DFT-computed properties of your nanocluster.</div>

      <div style={S.sectionLabel}>Cluster Properties</div>

      {/* Row 1 — element + size */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
        <div style={S.field}>
          <label style={S.label}>Element</label>
          <select style={S.select} value={form.element} onChange={e=>set('element',e.target.value)}>
            <option value="Au">Au — Gold</option>
            <option value="Ag">Ag — Silver</option>
          </select>
        </div>
        <div style={S.field}>
          <label style={S.label}>Number of Atoms: <strong style={{color:'#3b82f6'}}>{form.n_atoms}</strong></label>
          <input type="range" min={3} max={20} step={1} value={form.n_atoms}
            onChange={e=>set('n_atoms',Number(e.target.value))}
            style={{accentColor:'#3b82f6', marginTop:8}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.7rem',color:'#374151'}}>
            <span>3</span><span style={{color:'#f59e0b'}}>Magic: 8,18,20</span><span>20</span>
          </div>
        </div>
        <div style={S.field}>
          <label style={S.label}>Structure Type</label>
          <select style={S.select} value={form.is_planar} onChange={e=>set('is_planar',Number(e.target.value))}>
            <option value={0}>3D (non-planar)</option>
            <option value={1}>2D (planar)</option>
          </select>
        </div>
      </div>

      {/* Remaining fields */}
      <div style={S.grid3}>
        {FIELDS.map(([key,label,def,min,max,step,tip])=>(
          <div key={key} style={S.field}>
            <label style={S.label}>{label}</label>
            <input type="number" style={S.input}
              value={form[key]} min={min} max={max} step={step}
              onChange={e=>set(key,parseFloat(e.target.value)||0)}
              onFocus={e=>e.target.style.borderColor='#3b82f6'}
              onBlur={e=>e.target.style.borderColor='#1a1a30'}
            />
            <div style={{fontSize:'0.7rem',color:'#374151'}}>{tip}</div>
          </div>
        ))}
      </div>

      <button style={{...S.btn,...(loading?S.btnDisabled:{})}}
        onClick={run} disabled={loading}>
        {loading ? '⏳ Running Model...' : '⚛ Run Prediction'}
      </button>

      {result && (
        <>
          <div style={S.resultGrid}>
            <div style={stable ? S.stableCard : S.unstableCard}>
              <div style={{...S.resultLabel, color: stable?'#10b981':'#ef4444'}}>
                {stable ? '✅ STABLE' : '❌ UNSTABLE'}
              </div>
              <div style={S.confText}>Model confidence: <strong style={{color:'#e8d5b7'}}>{conf}%</strong></div>
              <div style={{marginTop:'1rem', display:'flex', justifyContent:'center', gap:'1.5rem'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:"'Space Mono',monospace", fontSize:'1.4rem', color:'#10b981'}}>{(result.probability_stable*100).toFixed(1)}%</div>
                  <div style={{fontSize:'0.72rem',color:'#6b7280'}}>P(Stable)</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:"'Space Mono',monospace", fontSize:'1.4rem', color:'#ef4444'}}>{(result.probability_unstable*100).toFixed(1)}%</div>
                  <div style={{fontSize:'0.72rem',color:'#6b7280'}}>P(Unstable)</div>
                </div>
              </div>
            </div>

            {/* Probability bar */}
            <div style={{...S.insightCard, display:'flex', flexDirection:'column', justifyContent:'center'}}>
              <div style={S.insightTitle}>Ensemble Vote Breakdown</div>
              {[
                {label:'Stable',   val:result.probability_stable,   color:'#10b981'},
                {label:'Unstable', val:result.probability_unstable, color:'#ef4444'},
              ].map(({label,val,color})=>(
                <div key={label} style={{marginBottom:'1rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:'0.82rem',color:'#9ca3af'}}>
                    <span>{label}</span><span style={{color,fontWeight:600}}>{(val*100).toFixed(1)}%</span>
                  </div>
                  <div style={{height:10,background:'#0f1117',borderRadius:5,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${val*100}%`,background:color,borderRadius:5,transition:'width 0.6s ease'}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.insightCard}>
            <div style={S.insightTitle}>Physics Interpretation</div>
            {insights.map(([icon,text],i)=>(
              <div key={i} style={S.insightRow}>
                <span style={{fontSize:'1rem',flexShrink:0}}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
