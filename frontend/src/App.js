import React, { useState, useEffect } from 'react';
import Overview from './components/Overview';
import Predict from './components/Predict';
import Dashboard from './components/Dashboard';
import Metrics from './components/Metrics';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export { API };

const NAV = [
  { id:'overview',  label:'Overview',     icon:'⚛' },
  { id:'predict',   label:'Predict',       icon:'🔬' },
  { id:'dashboard', label:'Dashboard',     icon:'📊' },
  { id:'metrics',   label:'Model Metrics', icon:'📈' },
];

export default function App() {
  const [page, setPage]       = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [dots,    setDots]    = useState('');

  useEffect(()=>{
    if(!loading) return;
    const t = setInterval(()=>setDots(d=>d.length>=3?'':d+'.'),500);
    return ()=>clearInterval(t);
  },[loading]);

  useEffect(()=>{
    let cancelled = false;
    let tries = 0;

    const fetchAll = async () => {
      try {
        const [mRes, dRes] = await Promise.all([
          fetch(`${API}/metrics`),
          fetch(`${API}/dataset`),
        ]);
        if(!mRes.ok || !dRes.ok) throw new Error('bad response');
        const [m, d] = await Promise.all([mRes.json(), dRes.json()]);
        if(cancelled) return;
        setMetrics(m);
        setDataset(d.data || []);
        setLoading(false);
      } catch(e) {
        tries++;
        setAttempt(tries);
        if(tries < 8 && !cancelled) {
          setTimeout(fetchAll, 5000);
        } else if(!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };
    fetchAll();
    return ()=>{ cancelled=true; };
  }, []);

  return (
    <div style={S.root}>
      <aside style={S.sidebar}>
        <div style={S.brand}>
          <div style={S.brandIcon}>⚛</div>
          <div>
            <div style={S.brandName}>NanoStability AI</div>
            <div style={S.brandSub}>NSUT Comp. Chem. Lab</div>
          </div>
        </div>
        <div style={S.divider}/>
        <nav style={S.nav}>
          {NAV.map(n=>(
            <button key={n.id}
              style={{...S.navBtn,...(page===n.id?S.navActive:{})}}
              onClick={()=>setPage(n.id)}>
              <span style={S.navIcon}>{n.icon}</span>
              <span>{n.label}</span>
              {page===n.id && <div style={S.navBar}/>}
            </button>
          ))}
        </nav>
        <div style={S.divider}/>
        {metrics && (
          <div style={S.sideStats}>
            {[
              ['Dataset','200 Au/Ag clusters'],
              ['Method','XGBoost + SVM + MLP'],
              ['Features','11 DFT-derived'],
              ['CV Accuracy',`${(metrics.cv_mean*100).toFixed(1)}% ± ${(metrics.cv_std*100).toFixed(1)}%`],
            ].map(([k,v])=>(
              <div key={k} style={S.statRow}>
                <span style={S.statKey}>{k}</span>
                <span style={S.statVal}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main style={S.main}>
        {loading ? (
          <div style={S.loader}>
            <div style={S.spinner}/>
            <div style={S.loaderTitle}>
              {attempt === 0 ? `Connecting to backend${dots}` : `Waking up server${dots}`}
            </div>
            <div style={S.loaderSub}>
              {attempt === 0
                ? 'Loading pre-trained model'
                : `Attempt ${attempt}/8 — Render free tier takes up to 30s on first visit`}
            </div>
          </div>
        ) : error ? (
          <div style={S.loader}>
            <div style={{fontSize:'2rem'}}>⚠️</div>
            <div style={S.loaderTitle}>Backend unreachable</div>
            <div style={S.loaderSub}>Check your REACT_APP_API_URL in Vercel settings</div>
            <button style={S.retryBtn} onClick={()=>window.location.reload()}>Retry</button>
          </div>
        ) : (
          <>
            {page==='overview'  && <Overview  metrics={metrics} dataset={dataset}/>}
            {page==='predict'   && <Predict   metrics={metrics}/>}
            {page==='dashboard' && <Dashboard dataset={dataset}/>}
            {page==='metrics'   && <Metrics   metrics={metrics}/>}
          </>
        )}
      </main>
    </div>
  );
}

const S = {
  root:{ display:'flex', minHeight:'100vh', background:'#060612', color:'#e8d5b7', fontFamily:"'Inter',sans-serif" },
  sidebar:{ width:260, minWidth:260, background:'#08081a', borderRight:'1px solid #12122a', display:'flex', flexDirection:'column', padding:'1.5rem 1rem', position:'sticky', top:0, height:'100vh', overflowY:'auto' },
  brand:{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem' },
  brandIcon:{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#1e3a8a,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 },
  brandName:{ fontFamily:"'Space Mono',monospace", fontSize:'0.95rem', color:'#e8d5b7', fontWeight:700 },
  brandSub:{ fontSize:'0.7rem', color:'#4b5563', marginTop:2 },
  divider:{ height:1, background:'#12122a', margin:'1rem 0' },
  nav:{ display:'flex', flexDirection:'column', gap:4 },
  navBtn:{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.6rem 0.8rem', borderRadius:8, border:'none', background:'transparent', color:'#6b7280', cursor:'pointer', fontSize:'0.88rem', fontFamily:"'Inter',sans-serif", position:'relative', transition:'all 0.15s', textAlign:'left', width:'100%' },
  navActive:{ background:'rgba(59,130,246,0.12)', color:'#93c5fd' },
  navIcon:{ fontSize:16, width:20, textAlign:'center' },
  navBar:{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:2, background:'#3b82f6' },
  sideStats:{ display:'flex', flexDirection:'column', gap:'0.6rem' },
  statRow:{ display:'flex', flexDirection:'column', gap:2 },
  statKey:{ fontSize:'0.68rem', color:'#374151', textTransform:'uppercase', letterSpacing:'0.08em' },
  statVal:{ fontSize:'0.78rem', color:'#6b7280' },
  main:{ flex:1, overflowY:'auto', padding:'2rem 2.5rem' },
  loader:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'70vh', gap:'1rem', textAlign:'center' },
  spinner:{ width:48, height:48, border:'3px solid #12122a', borderTop:'3px solid #3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
  loaderTitle:{ fontFamily:"'Space Mono',monospace", color:'#e8d5b7', fontSize:'1rem', minWidth:300 },
  loaderSub:{ color:'#4b5563', fontSize:'0.8rem', maxWidth:360 },
  retryBtn:{ marginTop:'0.5rem', padding:'0.6rem 1.5rem', background:'#1d4ed8', border:'none', borderRadius:8, color:'white', cursor:'pointer', fontFamily:"'Inter',sans-serif" },
};
