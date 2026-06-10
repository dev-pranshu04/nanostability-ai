import React from 'react';

const STATS = [
  { label: 'Total Samples', value: '600', sub: '200 anchored + 400 synthetic' },
  { label: 'Test Accuracy', value: '85%', sub: 'Ensemble (XGB + SVM + MLP)' },
  { label: 'ROC-AUC', value: '0.912', sub: '5-Fold CV: 77.5% ± 5.2%' },
  { label: 'Core Features', value: '11', sub: '26 total (11 complete across all rows)' },
];

const FEATURES = [
  { name: 'homo_lumo_gap_eV', desc: 'Primary stability indicator — wider gap = more stable' },
  { name: 'formation_energy_eV_per_atom', desc: 'Thermodynamic stability relative to bulk atoms' },
  { name: 'binding_energy_eV_per_atom', desc: 'Cohesive strength of the cluster' },
  { name: 'coordination_number', desc: 'Average bonds per atom — higher = more bulk-like' },
  { name: 'ionization_potential_eV', desc: 'Energy to remove an electron (Koopmans\' theorem)' },
  { name: 'electron_affinity_eV', desc: 'Energy gained by adding an electron' },
  { name: 'chemical_hardness_eV', desc: '(IP − EA) / 2 — HSAB principle; harder = more stable' },
  { name: 'electronegativity_eV', desc: '(IP + EA) / 2 — Mulliken electronegativity' },
  { name: 'au_fraction', desc: 'Compositional descriptor; captures relativistic Au effects' },
  { name: 'n_atoms', desc: 'Cluster size (3–20 atoms)' },
  { name: 'n_valence_electrons', desc: 'Total valence electrons; relates to jellium shell filling' },
];

export default function Overview() {
  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        ⚛️ NanoStability AI
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.6 }}>
        Physics-informed ML ensemble for predicting thermodynamic stability of bimetallic
        Au/Ag nanoclusters (3–20 atoms). Trained on a 600-sample literature-informed dataset
        combining anchored DFT literature values with physics-constrained synthetic data.
      </p>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background: '#f8f9fa', borderRadius: '8px', padding: '1.2rem',
            borderLeft: '4px solid #2563eb'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e40af', margin: '0.25rem 0' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Dataset provenance */}
      <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', padding: '1rem', marginBottom: '2rem' }}>
        <strong>Dataset Provenance</strong>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#555', lineHeight: 1.6 }}>
          600 samples across two sources: <strong>200 literature-anchored rows</strong> (56 digitised
          from Manna et al. 2023, Gruene et al. 2008, Häkkinen et al. 2008, Xing et al. 2006,
          Chaban 2016 + 144 physics-interpolated) and <strong>400 physics-constrained synthetic rows</strong>.
          Neither source is raw DFT output — all feature ranges are grounded in published values.
          A <code>data_source</code> column tags every row for full transparency.
          Class distribution: 67.7% stable / 32.3% unstable.
        </p>
      </div>

      {/* Model architecture */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Model Architecture</h2>
      <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.8 }}>
        <div>Input (11 core features)</div>
        <div style={{ paddingLeft: '1rem', color: '#2563eb' }}>├── XGBoost (300 trees, max_depth=4)</div>
        <div style={{ paddingLeft: '1rem', color: '#7c3aed' }}>├── SVM (RBF kernel, C=10)</div>
        <div style={{ paddingLeft: '1rem', color: '#059669' }}>└── MLP (64→32→16, ReLU, Dropout=0.2)</div>
        <div style={{ marginTop: '0.5rem', color: '#d97706' }}>→ Soft Voting → Stability Prediction (0/1)</div>
      </div>

      {/* Features table */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Core Features</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '2px solid #e2e8f0' }}>Feature</th>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '2px solid #e2e8f0' }}>Physical meaning</th>
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((f, i) => (
            <tr key={f.name} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
              <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', color: '#1e40af', whiteSpace: 'nowrap' }}>
                {f.name}
              </td>
              <td style={{ padding: '0.5rem 0.75rem', color: '#444' }}>{f.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Limitations */}
      <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1rem', marginTop: '2rem' }}>
        <strong>⚠️ Limitations</strong>
        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#555', lineHeight: 1.8 }}>
          <li>Dataset is literature-informed computational data — not raw DFT simulations</li>
          <li>Label function (3-criterion threshold) derived from published stability criteria — not actual energy minimisation</li>
          <li>68% agreement between the two source label functions; original 200 labels preserved as anchor</li>
          <li>CV accuracy 77.5% vs test accuracy 85% — gap warrants caution on small dataset</li>
          <li>Not validated for production nanoscience applications</li>
        </ul>
      </div>

    </div>
  );
}
