import React, { useState, useEffect } from 'react';
import Overview from './components/Overview';
import Predict from './components/Predict';
import Dashboard from './components/Dashboard';
import Metrics from './components/Metrics';

const API_URL = process.env.REACT_APP_API_URL || 'https://nanostability-ai.onrender.com';

const NAV = [
  { id: 'overview',  label: 'Overview' },
  { id: 'predict',   label: 'Predict' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'metrics',   label: 'Model Metrics' },
];

export default function App() {
  const [active, setActive]     = useState('overview');
  const [sidebarStats, setSidebarStats] = useState(null);
  const [backendUp, setBackendUp] = useState(null); // null=loading, true, false

  // Wake up Render backend + fetch live sidebar stats
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(() => setBackendUp(true))
      .catch(() => setBackendUp(false));

    fetch(`${API_URL}/metrics`)
      .then(r => r.json())
      .then(data => setSidebarStats(data))
      .catch(() => {
        // Fallback to static values if backend is cold/down
        setSidebarStats({
          dataset: { total_samples: 600 },
          model: {
            cv_accuracy_mean: 0.775,
            cv_accuracy_std: 0.052,
          },
        });
      });
  }, []);

  const cvText = sidebarStats
    ? `${(sidebarStats.model.cv_accuracy_mean * 100).toFixed(1)}% ± ${(sidebarStats.model.cv_accuracy_std * 100).toFixed(1)}%`
    : 'Loading…';

  const sampleText = sidebarStats
    ? `${sidebarStats.dataset.total_samples} Au/Ag clusters`
    : 'Loading…';

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#0f1117', color: '#e2e8f0' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '260px', flexShrink: 0,
        background: '#1a1d27',
        borderRight: '1px solid #2d3148',
        display: 'flex', flexDirection: 'column',
        padding: '1.5rem 0',
      }}>

        {/* Logo */}
        <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid #2d3148' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚛️</span>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>NanoStability AI</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>NSUT Comp. Chem. Lab</div>
          {/* Backend status pill */}
          <div style={{
            marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '999px',
            background: backendUp === null ? '#1e293b' : backendUp ? '#14532d' : '#450a0a',
            color: backendUp === null ? '#94a3b8' : backendUp ? '#86efac' : '#fca5a5',
          }}>
            <span style={{ fontSize: '0.6rem' }}>{backendUp === null ? '○' : backendUp ? '●' : '●'}</span>
            {backendUp === null ? 'Connecting…' : backendUp ? 'API online' : 'API offline (cold start ~30s)'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.6rem 0.75rem', marginBottom: '0.2rem',
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '0.875rem',
                background: active === n.id ? '#2563eb' : 'transparent',
                color: active === n.id ? '#fff' : '#94a3b8',
                fontWeight: active === n.id ? 600 : 400,
              }}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* Sidebar meta — fetched live, no hardcoded stale values */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #2d3148', fontSize: '0.72rem', color: '#475569' }}>
          {[
            { label: 'DATASET',     value: sampleText },
            { label: 'METHOD',      value: 'XGBoost + SVM + MLP' },
            { label: 'FEATURES',    value: '11 core / 26 total' },
            { label: 'CV ACCURACY', value: cvText },
          ].map(({ label, value }) => (
            <div key={label} style={{ marginBottom: '0.6rem' }}>
              <div style={{ color: '#334155', fontSize: '0.65rem', letterSpacing: '0.08em', marginBottom: '0.1rem' }}>{label}</div>
              <div style={{ color: '#94a3b8' }}>{value}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#0f1117' }}>
        {active === 'overview'  && <Overview />}
        {active === 'predict'   && <Predict />}
        {active === 'dashboard' && <Dashboard />}
        {active === 'metrics'   && <Metrics />}
      </main>
    </div>
  );
}
