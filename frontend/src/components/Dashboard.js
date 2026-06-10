import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://nanostability-ai.onrender.com';

// Static dataset summary (matches au_ag_nanocluster_stability.csv v2 — 600 rows)
const DATASET_SUMMARY = {
  total: 600,
  stable: 406,
  unstable: 194,
  stable_pct: 67.7,
  unstable_pct: 32.3,
  sources: [
    { label: 'Literature-anchored (200)', value: 200, color: '#2563eb' },
    { label: 'Physics-synthetic (400)', value: 400, color: '#7c3aed' },
  ],
  elements: [
    { label: 'Ag only', value: 110, color: '#64748b' },
    { label: 'Au only', value: 90, color: '#d97706' },
    { label: 'AuAg bimetallic', value: 400, color: '#059669' },
  ],
  size_range: '3–20 atoms',
  features_core: 11,
  features_total: 26,
};

const TOP_FEATURES = [
  { name: 'homo_lumo_gap_eV', importance: 0.31 },
  { name: 'formation_energy_eV_per_atom', importance: 0.24 },
  { name: 'binding_energy_eV_per_atom', importance: 0.19 },
  { name: 'chemical_hardness_eV', importance: 0.11 },
  { name: 'coordination_number', importance: 0.08 },
  { name: 'au_fraction', importance: 0.07 },
];

function Bar({ label, value, max, color }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
        <span style={{ fontFamily: 'monospace' }}>{label}</span>
        <span style={{ color: '#666' }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: '4px' }} />
      </div>
    </div>
  );
}

function PieSlice({ pct, color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.85rem' }}>{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/metrics`)
      .then(r => r.json())
      .then(data => { setLiveMetrics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const d = DATASET_SUMMARY;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dataset Dashboard</h2>
      <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>
        600-sample literature-informed computational dataset. Two sources merged with harmonized labels
        and a <code>data_source</code> provenance column.
      </p>

      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Samples', value: d.total, sub: '200 anchored + 400 synthetic' },
          { label: 'Stable Clusters', value: `${d.stable} (${d.stable_pct}%)`, sub: 'HOMO-LUMO > 0.55 eV etc.' },
          { label: 'Unstable Clusters', value: `${d.unstable} (${d.unstable_pct}%)`, sub: 'Below stability threshold' },
        ].map(c => (
          <div key={c.label} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1rem', borderTop: '3px solid #2563eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>{c.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>{c.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Class distribution */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Class Distribution</h3>
          <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ width: `${d.stable_pct}%`, background: '#22c55e' }} />
            <div style={{ width: `${d.unstable_pct}%`, background: '#ef4444' }} />
          </div>
          <PieSlice pct={d.stable_pct} color="#22c55e" label={`Stable — ${d.stable} rows (${d.stable_pct}%)`} />
          <PieSlice pct={d.unstable_pct} color="#ef4444" label={`Unstable — ${d.unstable} rows (${d.unstable_pct}%)`} />
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.75rem' }}>
            Imbalance reflects literature reality: geometry-optimised clusters are predominantly stable.
          </p>
        </div>

        {/* Data source split */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Data Sources</h3>
          {d.sources.map(s => (
            <div key={s.label} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span>{s.label}</span>
                <span style={{ color: '#666' }}>{((s.value / d.total) * 100).toFixed(0)}%</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                <div style={{ height: '100%', width: `${(s.value / d.total) * 100}%`, background: s.color, borderRadius: '4px' }} />
              </div>
            </div>
          ))}
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.75rem' }}>
            See <code>data_source</code> column in CSV for per-row provenance.
          </p>
        </div>
      </div>

      {/* Feature importance */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>XGBoost Feature Importance (top 6 of 11)</h3>
        {TOP_FEATURES.map(f => (
          <Bar key={f.name} label={f.name} value={f.importance} max={0.35} color="#2563eb" />
        ))}
      </div>

      {/* Dataset metadata */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Dataset Metadata</h3>
        <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ['Total rows', d.total],
              ['Cluster size range', d.size_range],
              ['Core features (zero nulls)', d.features_core],
              ['Total columns', d.features_total],
              ['Elements covered', 'Au, Ag, AuAg (bimetallic)'],
              ['Label source (200 rows)', 'Original literature-anchored scoring function'],
              ['Label source (400 rows)', '3-criterion threshold (gap/formation/binding)'],
              ['Label agreement between sources', '68% — documented in README'],
              ['Duplicate rows', '0'],
              ['Provenance column', 'data_source'],
            ].map(([k, v], i) => (
              <tr key={k} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '0.4rem 0.75rem', color: '#555', fontWeight: 500 }}>{k}</td>
                <td style={{ padding: '0.4rem 0.75rem', fontFamily: typeof v === 'number' ? 'inherit' : 'inherit' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
