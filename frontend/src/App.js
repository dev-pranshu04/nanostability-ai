import React, { useState, useEffect, useCallback } from 'react';
import Overview from './components/Overview';
import Predict from './components/Predict';
import Dashboard from './components/Dashboard';
import Metrics from './components/Metrics';

// ── CHANGE THIS to your Render backend URL after deploying ──
const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export { API };

const NAV = [
  { id:'overview',  label:'Overview',       icon:'⚛' },
  { id:'predict',   label:'Predict',         icon:'🔬' },
  { id:'dashboard', label:'Dashboard',       icon:'📊' },
  { id:'metrics',   label:'Model Metrics',   icon:'📈' },
];

export default function App() {
  const [page, setPage]       = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/metrics`).then(r=>r.json()),
      fetch(`${API}/dataset`).then(r=>r.json()),
    ]).then(([m,d]) => {
      setMetrics(m);
      setDataset(d.data || []);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  return (
    <div style={styles.root}>
      {/* ── Sidebar */}
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
          {NAV.map(n => (
            <button key={n.id}
              style={{...styles.navBtn, ...(page===n.id ? styles.navBtnActive : {})}}
              onClick={()=>setPage(n.id)}>
              <span style={styles.navIcon}>{n.icon}</span>
              <span>{n.label}</span>
              {page===n.id && <div style={styles.navIndicator}/>}
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
              ['CV Accuracy', `${(metrics.cv_mean*100).toFixed(1)}% ± ${(metrics.cv_std*100).toFixed(1)}%`],
            ].map(([k,v])=>(
              <div key={k} style={styles.statRow}>
                <span style={styles.statKey}>{k}</span>
                <span style={styles.statVal}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ── Main */}
      <main style={styles.main}>
        {loading ? (
          <div style={styles.loader}>
            <div style={styles.loaderSpinner}/>
            <div style={styles.loaderText}>Training ensemble model…</div>
            <div style={styles.loaderSub}>XGBoost + SVM + Neural Network</div>
          </div>
        ) : (
          <>
            {page==='overview'  && <Overview metrics={metrics} dataset={dataset}/>}
            {page==='predict'   && <Predict  metrics={metrics}/>}
            {page==='dashboard' && <Dashboard dataset={dataset}/>}
            {page==='metrics'   && <Metrics  metrics={metrics}/>}
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
  navBtn:{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.6rem 0.8rem', borderRadius:8, border:'none', background:'transparent', color:'#6b7280', cursor:'pointer', fontSize:'0.88rem', fontFamily:"'Inter',sans-serif", position:'relative', transition:'all 0.15s', textAlign:'left' },
  navBtnActive:{ background:'rgba(59,130,246,0.12)', color:'#93c5fd' },
  navIcon:{ fontSize:16, width:20, textAlign:'center' },
  navIndicator:{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:2, background:'#3b82f6' },
  sideStats:{ display:'flex', flexDirection:'column', gap:'0.6rem' },
  statRow:{ display:'flex', flexDirection:'column', gap:2 },
  statKey:{ fontSize:'0.68rem', color:'#374151', textTransform:'uppercase', letterSpacing:'0.08em' },
  statVal:{ fontSize:'0.78rem', color:'#6b7280' },
  main:{ flex:1, overflowY:'auto', padding:'2rem 2.5rem' },
  loader:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'1rem' },
  loaderSpinner:{ width:48, height:48, border:'3px solid #12122a', borderTop:'3px solid #3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
  loaderText:{ fontFamily:"'Space Mono',monospace", color:'#e8d5b7', fontSize:'1rem' },
  loaderSub:{ color:'#4b5563', fontSize:'0.8rem' },
};
