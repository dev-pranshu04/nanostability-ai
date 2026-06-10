import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://nanostability-ai.onrender.com';

// Fallback static metrics (matches metrics.json)
const STATIC_METRICS = {
  dataset: {
    total_samples: 600,
    stable: 406,
    unstable: 194,
    stable_pct: 67.7,
    unstable_pct: 32.3,
    n_features_core: 11,
    n_features_total: 26,
  },
  model: {
    type: 'VotingClassifier (XGBoost + SVM + MLP)',
    voting: 'soft',
    test_accuracy: 0.85,
    roc_auc: 0.912,
    cv_accuracy_mean: 0.775,
    cv_accuracy_std: 0.052,
    cv_folds: 5,
    precision_stable: 0.87,
    recall_stable: 0.96,
    f1_stable: 0.91,
    precision_unstable: 0.79,
    recall_unstable: 0.53,
    f1_unstable: 0.63,
  },
  top_features: [
    { feature: 'homo_lumo_gap_eV', importance: 0.31 },
    { feature: 'formation_energy_eV_per_atom', importance: 0.24 },
    { feature: 'binding_energy_eV_per_atom', importance: 0.19 },
    { feature: 'chemical_hardness_eV', importance: 0.11 },
    { feature: 'coordination_number', importance: 0.08 },
    { feature: 'au_fraction', importance: 0.07 },
  ],
};

function MetricCard({ label, value, sub, color = '#2563eb', warn = false }) {
  return (
    <div style={{
      background: warn ? '#fffbeb' : '#f8f9fa',
      border: `1px solid ${warn ? '#f59e0b' : '#e2e8f0'}`,
      borderRadius: '8px', padding: '1rem',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color, margin: '0.25rem 0' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: warn ? '#92400e' : '#aaa' }}>{sub}</div>}
    </div>
  );
}

function ClassReport({ label, precision, recall, f1, color }) {
  return (
    <tr>
      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color }}>{label}</td>
      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{precision.toFixed(2)}</td>
      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{recall.toFixed(2)}</td>
      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{f1.toFixed(2)}</td>
    </tr>
  );
}

export default function Metrics() {
  const [metrics, setMetrics] = useState(STATIC_METRICS);
  const [fromAPI, setFromAPI] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/metrics`)
      .then(r => r.json())
      .then(data => {
        setMetrics(data);
        setFromAPI(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const m = metrics.model;
  const d = metrics.dataset;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Model Performance</h2>
        <span style={{
          fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px',
          background: fromAPI ? '#dcfce7' : '#f1f5f9',
          color: fromAPI ? '#166534' : '#64748b'
        }}>
          {loading ? 'Fetching…' : fromAPI ? '● Live from API' : '○ Static fallback'}
        </span>
      </div>
      <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Trained on {d.total_samples} samples. Evaluated on a held-out test split.
        {' '}<strong>Note:</strong> 7.5% gap between CV (77.5%) and test accuracy (85%) — see caveats below.
      </p>

      {/* Primary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <MetricCard label="Test Accuracy" value={`${(m.test_accuracy * 100).toFixed(1)}%`} color="#2563eb" />
        <MetricCard label="ROC-AUC" value={m.roc_auc.toFixed(3)} color="#7c3aed" />
        <MetricCard
          label={`${m.cv_folds}-Fold CV Accuracy`}
          value={`${(m.cv_accuracy_mean * 100).toFixed(1)}%`}
          sub={`± ${(m.cv_accuracy_std * 100).toFixed(1)}% — gap vs test accuracy warrants caution`}
          color="#d97706"
          warn={true}
        />
        <MetricCard label="Dataset Size" value={d.total_samples} sub={`${d.n_features_core} core features, ${d.n_features_total} total columns`} color="#059669" />
      </div>

      {/* Per-class report */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Classification Report</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '2px solid #e2e8f0' }}>Class</th>
              <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', borderBottom: '2px solid #e2e8f0' }}>Precision</th>
              <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', borderBottom: '2px solid #e2e8f0' }}>Recall</th>
              <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', borderBottom: '2px solid #e2e8f0' }}>F1-Score</th>
            </tr>
          </thead>
          <tbody>
            <ClassReport label="Stable (1)" precision={m.precision_stable} recall={m.recall_stable} f1={m.f1_stable} color="#16a34a" />
            <ClassReport label="Unstable (0)" precision={m.precision_unstable} recall={m.recall_unstable} f1={m.f1_unstable} color="#dc2626" />
          </tbody>
        </table>
        <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.75rem' }}>
          Low recall on Unstable (0.53) — model favours the majority class. Expected given 67.7/32.3 class split.
          Consider threshold tuning or class weighting if false negatives are costly.
        </p>
      </div>

      {/* Feature importance */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>XGBoost Feature Importance</h3>
        {metrics.top_features.map(f => (
          <div key={f.feature} style={{ marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
              <span style={{ fontFamily: 'monospace' }}>{f.feature}</span>
              <span style={{ color: '#666' }}>{(f.importance * 100).toFixed(0)}%</span>
            </div>
            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
              <div style={{ height: '100%', width: `${(f.importance / 0.35) * 100}%`, background: '#2563eb', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
        <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.75rem' }}>
          HOMO-LUMO gap as top feature is physically consistent with Coquet et al. (2008).
        </p>
      </div>

      {/* Caveats */}
      <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1rem' }}>
        <strong>⚠️ Interpretation Caveats</strong>
        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem', fontSize: '0.85rem', color: '#555', lineHeight: 1.8 }}>
          <li><strong>CV vs test gap (7.5%)</strong> — on 600 samples this may reflect test-set variance, not generalisation. Treat 85% as an upper bound.</li>
          <li><strong>Label function overlap with features</strong> — the stability label is partly derived from three input features. This can inflate accuracy; interpret metrics accordingly.</li>
          <li><strong>Class imbalance</strong> — recall on Unstable class (0.53) is low. The model correctly identifies most stable clusters but misses ~half of unstable ones.</li>
          <li><strong>Data provenance</strong> — 600 samples are literature-informed computational data, not raw DFT. Metrics reflect performance on the same distribution, not real nanocluster experiments.</li>
        </ul>
      </div>

    </div>
  );
}
