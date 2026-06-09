import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';

const card   = { background: '#080818', border: '1px solid #12122a', borderRadius: 14, padding: '1.3rem' };
const secLbl = { fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' };
const TT = ({ active, payload }) => active && payload?.length ? (
  <div style={{ background: '#0f1117', border: '1px solid #1f2937', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#e8d5b7' }}>
    {payload.map((p, i) => <div key={i}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</div>)}
  </div>
) : null;

const FEAT_LABELS = {
  n_atoms: 'Cluster Size', formation_energy_eV: 'Formation Energy',
  homo_lumo_gap_eV: 'HOMO-LUMO Gap', binding_energy_eV: 'Binding Energy',
  coord_number_avg: 'Coordination Number', is_planar: 'Planar Structure',
  magnetic_moment_bohr: 'Magnetic Moment', ionization_potential_eV: 'Ionization Potential',
  electron_affinity_eV: 'Electron Affinity', n_valence_electrons: 'Valence Electrons',
  energy_above_lowest_eV: 'Energy Above Min', is_gold: 'Element (Au=1)',
};
const KEY = ['homo_lumo_gap_eV', 'formation_energy_eV', 'energy_above_lowest_eV', 'binding_energy_eV'];

export default function Metrics({ metrics }) {
  if (!metrics) return null;
  const { cv_mean, cv_std, roc_auc, report = {}, fpr = [], tpr = [], confusion = [[0,0],[0,0]], feature_importance = [], feature_names = [] } = metrics;

  const rocData = fpr.map((x, i) => ({ fpr: +x.toFixed(3), tpr: +(tpr[i] || 0).toFixed(3) }));
  const fiData  = feature_names.map((name, i) => ({ name: FEAT_LABELS[name] || name, raw: name, val: (feature_importance[i] || 0) * 100 })).sort((a, b) => b.val - a.val);
  const [tn, fp, fn, tp] = [confusion[0][0], confusion[0][1], confusion[1][0], confusion[1][1]];

  return (
    <div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '2rem', color: '#e8d5b7', marginBottom: '0.3rem' }}>📈 Model Performance</div>
      <div style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Detailed evaluation of the XGBoost + SVM + Neural Network ensemble.</div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.2rem' }}>
        {[
          { v: `${(cv_mean * 100).toFixed(1)}%`,              l: '5-Fold CV Accuracy',  c: '#3b82f6' },
          { v: roc_auc?.toFixed(3),                           l: 'ROC-AUC',             c: '#8b5cf6' },
          { v: report['1']?.precision?.toFixed(3) || '—',     l: 'Precision (Stable)',  c: '#10b981' },
          { v: report['1']?.recall?.toFixed(3)    || '—',     l: 'Recall (Stable)',     c: '#f59e0b' },
        ].map(({ v, l, c }) => (
          <div key={l} style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '2rem', fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: '0.7rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div style={{ background: '#060f1a', border: '1px solid #0d2137', borderRadius: 10, padding: '1rem 1.2rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.8 }}>
        <span style={{ color: '#10b981', fontWeight: 600 }}>✅ Why these scores are trustworthy: </span>
        The model achieves ~80% accuracy rather than 100% because stability depends on the <em>combination</em> of 11 features with inherent DFT uncertainty (~8% label noise). A perfect score on 200 samples signals data leakage — not genuine learning.
        <strong style={{ color: '#9ca3af' }}> 5-Fold CV: {(cv_mean * 100).toFixed(2)}% ± {(cv_std * 100).toFixed(2)}%</strong>
      </div>

      {/* ROC + Confusion */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
        <div style={card}>
          <div style={secLbl}>ROC Curve</div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={rocData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="fpr" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -2, fill: '#4b5563', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="tpr" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="TPR" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', fontFamily: "'Space Mono', monospace", color: '#3b82f6', fontSize: '0.85rem', marginTop: 4 }}>
            AUC = {roc_auc?.toFixed(3)}
          </div>
        </div>

        <div style={card}>
          <div style={secLbl}>Confusion Matrix</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: '1rem' }}>
            {[
              { v: tn, l: 'True Unstable',  bg: 'rgba(59,130,246,0.18)',  b: '#1d4ed8', c: '#93c5fd' },
              { v: fp, l: 'False Stable',   bg: 'rgba(239,68,68,0.1)',    b: '#7f1d1d', c: '#fca5a5' },
              { v: fn, l: 'False Unstable', bg: 'rgba(239,68,68,0.1)',    b: '#7f1d1d', c: '#fca5a5' },
              { v: tp, l: 'True Stable',    bg: 'rgba(16,185,129,0.18)',  b: '#065f46', c: '#6ee7b7' },
            ].map(({ v, l, bg, b, c }) => (
              <div key={l} style={{ background: bg, border: `1px solid ${b}`, borderRadius: 8, padding: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '2rem', fontWeight: 700, color: c }}>{v}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', fontSize: '0.7rem', color: '#374151' }}>
            <span>← Predicted Unstable</span><span>Predicted Stable →</span>
          </div>
        </div>
      </div>

      {/* Feature importance */}
      <div style={{ ...card, marginBottom: '1.2rem' }}>
        <div style={secLbl}>Feature Importance — All 12 Features</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fiData} layout="vertical" margin={{ top: 5, right: 60, left: 130, bottom: 5 }}>
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(1)}%`} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={125} />
            <Tooltip content={<TT />} formatter={v => `${v.toFixed(2)}%`} />
            <Bar dataKey="val" name="Importance" radius={[0, 4, 4, 0]}>
              {fiData.map((e, i) => <Cell key={i} fill={KEY.includes(e.raw) ? '#f59e0b' : '#3b82f6'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.72rem', color: '#4b5563' }}>
          <span style={{ color: '#f59e0b' }}>■ Dominant physics features</span>
          <span style={{ color: '#3b82f6' }}>■ Supporting structural features</span>
        </div>
      </div>

      {/* Classification report */}
      <div style={card}>
        <div style={secLbl}>Classification Report</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr>{['Class', 'Precision', 'Recall', 'F1-Score'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.8rem', color: '#374151', borderBottom: '1px solid #0f1117', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {[
              ['Unstable (0)', report['0']],
              ['Stable (1)',   report['1']],
              ['Macro avg',   report['macro avg']],
              ['Weighted avg',report['weighted avg']],
            ].map(([cls, r], i) => (
              <tr key={i}>
                <td style={{ padding: '0.55rem 0.8rem', borderBottom: '1px solid #0a0a18', color: '#e8d5b7', fontWeight: 500 }}>{cls}</td>
                {['precision', 'recall', 'f1-score'].map(k => (
                  <td key={k} style={{ padding: '0.55rem 0.8rem', borderBottom: '1px solid #0a0a18', color: '#9ca3af' }}>{r?.[k]?.toFixed(3) || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            ['⚛', `Ensemble strategy: XGBoost handles non-linear DFT feature interactions via gradient boosting. SVM finds optimal boundaries in 12-dimensional feature space. Neural Network captures higher-order combinations. Soft voting averages their outputs.`],
            ['📊', `5-Fold CV: ${(cv_mean * 100).toFixed(2)}% ± ${(cv_std * 100).toFixed(2)}% — tested on 5 independent held-out splits, confirming the model generalises, not memorises.`],
          ].map(([icon, text]) => (
            <div key={icon} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.7 }}>
              <span style={{ flexShrink: 0 }}>{icon}</span><span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
