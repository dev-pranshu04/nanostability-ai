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
  const [dots,    setDots]    = useState('');

  // Animated dots for loading
  useEffect(()=>{
    if(!loading) return;
    const t = setInterval(()=>setDots(d=> d.length>=3 ? '' : d+'.'), 500);
    return ()=>clearInterval(t);
  },[loading]);

  useEffect(()=>{
    let attempts = 0;
    const maxAttempts = 10;   // retry up to 10× (handles Render cold start ~30s)

    const fetchData = async () => {
      try {
        // First check health
        const health = await fetch(`${API}/health`);
        if(!health.ok) throw new Error('not ready');
        const hData = await health.json();
        if(!hData.model_ready) throw new Error('model training');

        // Fetch metrics and dataset in parallel
        const [mRes, dRes] = await Promise.all([
          fetch(`${API}/metrics`),
          fetch(`${API}/dataset`),
        ]);

        if(!mRes.ok || !dRes.ok) throw new Error('fetch failed');

        const [m, d] = await Promise.all([mRes.json(), dRes.json()]);
        setMetrics(m);
        setDataset(d.data || []);
        setLoading(false);
        setError(null);

      } catch(e) {
        attempts++;
        if(attempts < maxAttempts) {
          setTimeout(fetchData, 4000);  // retry every 4s
        } else {
          setError('Backend is taking too long. Try refreshing in 30 seconds.');
          setLoading(false);
        }
      }
    };

    fetchData();
  }, []);

  return (
    <div style={styles.root}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>⚛</div>
          <div>
            <div style={styles.brandName}>NanoStability AI</div>
            <div style={styles.brandSub}>NSUT Comp. Chem. Lab</div>
          </div>
        </div>
        <div style={styles.divider}/>
        <nav style={styles.nav}>
          {NAV.map(n=>(
            <button key={n.id}
              style={{...styles.navBtn,...(page===n.id?styles.navActive:{})}}
              onClick={()=>setPage(n.id)}>
              <span style={styles.navIcon}>{n.icon}</span>
              <span>{n.label}</span>
              {page===n.id && <div style={styles.navBar}/>}
            </button>
          ))}
        </nav>
        <div style={styles.divider}/>
        {metrics && (
          <div style={styles.sideStats}>
            {[
              ['Dataset','200 Au/Ag clusters'],
              ['Method','XGBoost + SVM + MLP'],
              ['Features','11 DFT-derived'],
              ['CV Accuracy',`${(metrics.cv_mean*100).toFixed(1)}% ± ${(metrics.cv_std*100).toFixed(1)}%`],
            ].map(([k,v])=>(
              <div key={k} style={styles.statRow}>
                <span style={styles.statKey}>{k}</span>
                <span style={styles.statVal}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main style={styles.main}>
        {loading ? (
          <div style={styles.loader}>
            <div style={styles.spinner}/>
            <div style={styles.loaderTitle}>Waking up backend{dots}</div>
            <div style={styles.loaderSub}>Render free tier may take up to 30 seconds on first load</div>
            <div style={styles.loaderSub2}>Training XGBoost + SVM + Neural Network ensemble</div>
          </div>
        ) : error ? (
          <div style={styles.loader}>
            <div style={{fontSize:'2rem'}}>⚠️</div>
            <div style={styles.loaderTitle}>{error}</div>
            <button style={styles.retryBtn} onClick={()=>window.location.reload()}>
              Retry
            </button>
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

const styles = {
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
  loaderTitle:{ fontFamily:"'Space Mono',monospace", color:'#e8d5b7', fontSize:'1rem', minWidth:280 },
  loaderSub:{ color:'#4b5563', fontSize:'0.8rem' },
  loaderSub2:{ color:'#374151', fontSize:'0.75rem' },
  retryBtn:{ marginTop:'0.5rem', padding:'0.6rem 1.5rem', background:'#1d4ed8', border:'none', borderRadius:8, color:'white', cursor:'pointer', fontFamily:"'Inter',sans-serif" },
};
