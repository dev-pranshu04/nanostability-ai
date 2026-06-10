import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://nanostability-ai.onrender.com';

const STATIC = {
  dataset: { total_samples: 600, stable: 406, unstable: 194, stable_pct: 67.7, unstable_pct: 32.3, n_features_core: 11, n_features_total: 26 },
  model: { type: 'VotingClassifier (XGBoost + SVM + MLP)', voting: 'soft', test_accuracy: 0.85, roc_auc: 0.912, cv_accuracy_mean: 0.775, cv_accuracy_std: 0.052, cv_folds: 5, precision_stable: 0.87, recall_stable: 0.96, f1_stable: 0.91, precision_unstable: 0.79, recall_unstable: 0.53, f1_unstable: 0.63 },
  top_features: [
    { feature: 'homo_lumo_gap_eV',             importance: 0.31 },
    { feature: 'formation_energy_eV_per_atom', importance: 0.24 },
    { feature: 'binding_energy_eV_per_atom',   importance: 0.19 },
    { feature: 'chemical_hardness_eV',         importance: 0.11 },
    { feature: 'coordination_number',          importance: 0.08 },
    { feature: 'au_fraction',                  importance: 0.07 },
  ],
};

function Card({ children, style = {} }) {
  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '10px', padding: '1.25rem', ...style }}>
      {children}
    </div>
  );
}

function StatBig({ label, value, sub, accent = '#2563eb', warn = false }) {
  return (
    <Card style={{ borderLeft: `4px solid ${warn ? '#d97706' : accent}`, background: warn ? '#1c1a0e' : '#1a1d27' }}>
      <div style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: warn ? '#fbbf24' : accent, margin: '0.2rem 0' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: warn ? '#92400e' : '#475569', lineHeight: 1.4 }}>{sub}</div>}
    </Card>
  );
}

function ImportanceBar({ feature, importance }) {
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
        <span style={{ fontFamily: 'monospace', color: '#93c5fd' }}>{feature}</span>
        <span style={{ color: '#64748b' }}>{(importance * 100).toFixed(0)}%</span>
      </div>
      <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px' }}>
        <div style={{ height: '100%', width: `${(importance / 0.35) * 100}%`, background: '#2563eb', borderRadius: '3px' }} />
      </div>
    </div>
  );
}

export default function Metrics() {
  const [data, setData]     = useState(STATIC);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch(`${API_URL}/metrics`)
      .then(r => r.json())
      .then(d => { setData(d); setStatus('live'); })
      .catch(() => setStatus('fallback'));
  }, []);

  const m = data.model;
  const d = data.dataset;

  return (
    <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto', color: '#e2e8f0' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Model Metrics</h2>
        <span style={{
          fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px',
          background: status === 'live' ? '#14532d' : status === 'fallback' ? '#1c1917' : '#1e293b',
          color: status === 'live' ? '#86efac' : '#94a3b8',
        }}>
          {status === 'loading' ? '○ Fetching…' : status === 'live' ? '● Live from API' : '○ Static fallback'}
        </span>
      </div>
      <p style={{ color: '#475569', marginBottom: '2rem', fontSize: '0.875rem' }}>
        Ensemble performance on held-out test split. Trained on {d.total_samples} samples across two literature-informed sources.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatBig label="Test Accuracy"    value={`${(m.test_accuracy * 100).toFixed(1)}%`} accent="#2563eb" />
        <StatBig label="ROC-AUC"          value={m.roc_auc.toFixed(3)} accent="#7c3aed" />
        <StatBig
          label={`${m.cv_folds}-Fold CV Accuracy`}
          value={`${(m.cv_accuracy_mean * 100).toFixed(1)}% ± ${(m.cv_accuracy_std * 100).toFixed(1)}%`}
          sub="7.5 pt gap vs test accuracy — likely test-set variance on small dataset"
          accent="#d97706" warn
        />
        <StatBig label="Training Samples" value={d.total_samples} sub={`${d.n_features_core} core features · ${d.n_features_total} total columns`} accent="#059669" />
      </div>

      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: '#f1f5f9' }}>Classification Report</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2d3148' }}>
              {['Class', 'Precision', 'Recall', 'F1-Score', 'Support'].map(h => (
                <th key={h} style={{ textAlign: h === 'Class' ? 'left' : 'center', padding: '0.5rem 0.75rem', color: '#475569', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '0.6rem 0.75rem', color: '#4ade80', fontWeight: 600 }}>Stable (1)</td>
              <td style={{ textAlign: 'center', padding: '0.6rem 0.75rem' }}>{m.precision_stable.toFixed(2)}</td>
              <td style={{ textAlign: 'center', padding: '0.6rem 0.75rem' }}>{m.recall_stable.toFixed(2)}</td>
              <td style={{ textAlign: 'center', padding: '0.6rem 0.75rem', fontWeight: 600, color: '#4ade80' }}>{m.f1_stable.toFixed(2)}</td>
              <td style={{ textAlign: 'center', padding: '0.6rem 0.75rem', color: '#475569' }}>{d.stable}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.6rem 0.75rem', color: '#f87171', fontWeight: 600 }}>Unstable (0)</td>
              <td style={{ textAlign: 'center', padding: '0.6rem 0.75rem' }}>{m.precision_unstable.toFixed(2)}</td>
              <td style={{ textAlign: 'center', padding: '0.6rem 0.75rem' }}>{m.recall_unstable.toFixed(2)}</td>
              <td style={{ textAlign: 'center', padding: '0.6rem 0.75rem', fontWeight: 600, color: '#f87171' }}>{m.f1_unstable.toFixed(2)}</td>
              <td style={{ textAlign: 'center', padding: '0.6rem 0.75rem', color: '#475569' }}>{d.unstable}</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.75rem', lineHeight: 1.5 }}>
          Low recall on Unstable (0.53) is expected given 67.7/32.3 class split. Consider threshold tuning or class_weight="balanced".
        </p>
      </Card>

      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: '#f1f5f9' }}>
          XGBoost Feature Importance <span style={{ fontWeight: 400, color: '#475569', fontSize: '0.8rem' }}>(top {data.top_features.length} of {d.n_features_core}, by gain)</span>
        </h3>
        {data.top_features.map(f => <ImportanceBar key={f.feature} {...f} />)}
        <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.5rem' }}>
          HOMO-LUMO gap as dominant feature is consistent with Coquet et al. (2008).
        </p>
      </Card>

      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: '#f1f5f9' }}>Ensemble Components</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { name: 'XGBoost', color: '#2563eb', params: ['300 estimators', 'max_depth = 4', 'learning_rate = 0.1', 'Importance: gain'] },
            { name: 'SVM',     color: '#7c3aed', params: ['Kernel: RBF', 'C = 10', 'γ = 0.1', 'probability = True'] },
            { name: 'MLP',     color: '#059669', params: ['Layers: 64→32→16', 'Activation: ReLU', 'Dropout = 0.2', 'Soft vote weight: 1'] },
          ].map(c => (
            <div key={c.name} style={{ background: '#0f1117', borderRadius: '8px', padding: '1rem', borderTop: `3px solid ${c.color}` }}>
              <div style={{ fontWeight: 600, color: c.color, marginBottom: '0.5rem' }}>{c.name}</div>
              {c.params.map(p => <div key={p} style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.2rem' }}>{p}</div>)}
            </div>
          ))}
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#475569' }}>
          Aggregation: <strong style={{ color: '#93c5fd' }}>soft voting</strong> (average class probabilities across all three)
        </div>
      </Card>

      <Card style={{ border: '1px solid #7f1d1d', background: '#1c0a0a' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fca5a5' }}>⚠️ Interpretation Caveats</h3>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#9ca3af', lineHeight: 2 }}>
          <li><strong style={{ color: '#fca5a5' }}>CV vs test gap (7.5 pt)</strong> — treat 85% as an upper bound on 600 samples</li>
          <li><strong style={{ color: '#fca5a5' }}>Label overlap with features</strong> — stability label is a partial function of 3 input features; inflates accuracy</li>
          <li><strong style={{ color: '#fca5a5' }}>Class imbalance</strong> — recall on Unstable is 0.53; model misses ~half of unstable clusters</li>
          <li><strong style={{ color: '#fca5a5' }}>Data provenance</strong> — literature-informed computational data, not raw DFT; not for production nanoscience</li>
        </ul>
      </Card>

    </div>
  );
}
