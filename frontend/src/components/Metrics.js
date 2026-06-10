import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://nanostability-ai.onrender.com';

// The 11 core features — all present in every row of the merged dataset
const FIELDS = [
  {
    key: 'homo_lumo_gap_eV',
    label: 'HOMO-LUMO Gap (eV)',
    placeholder: '0.1 – 2.1',
    min: 0.0, max: 3.0, step: 0.001,
    hint: 'Primary stability indicator. Typical Au/Ag range: 0.1–2.1 eV',
  },
  {
    key: 'formation_energy_eV_per_atom',
    label: 'Formation Energy (eV/atom)',
    placeholder: '-3.0 – -0.05',
    min: -4.0, max: 0.0, step: 0.001,
    hint: 'More negative = more thermodynamically stable',
  },
  {
    key: 'binding_energy_eV_per_atom',
    label: 'Binding Energy (eV/atom)',
    placeholder: '0.6 – 3.5',
    min: 0.0, max: 5.0, step: 0.001,
    hint: 'Au clusters: ~1.5–3.2; Ag clusters: ~0.8–2.8',
  },
  {
    key: 'coordination_number',
    label: 'Coordination Number',
    placeholder: '1.5 – 12.0',
    min: 0.0, max: 12.0, step: 0.01,
    hint: 'Average bonds per atom. Higher = more bulk-like',
  },
  {
    key: 'ionization_potential_eV',
    label: 'Ionization Potential (eV)',
    placeholder: '6.5 – 8.8',
    min: 5.0, max: 12.0, step: 0.001,
    hint: 'Energy to remove one electron',
  },
  {
    key: 'electron_affinity_eV',
    label: 'Electron Affinity (eV)',
    placeholder: '1.8 – 3.8',
    min: 0.0, max: 6.0, step: 0.001,
    hint: 'Energy gained by adding one electron',
  },
  {
    key: 'chemical_hardness_eV',
    label: 'Chemical Hardness (eV)',
    placeholder: '0.3 – 1.5',
    min: 0.0, max: 4.0, step: 0.001,
    hint: '(IP − EA) / 2 — HSAB principle. Higher = more stable',
  },
  {
    key: 'electronegativity_eV',
    label: 'Electronegativity (eV)',
    placeholder: '4.5 – 8.0',
    min: 0.0, max: 12.0, step: 0.001,
    hint: '(IP + EA) / 2 — Mulliken electronegativity',
  },
  {
    key: 'au_fraction',
    label: 'Au Fraction',
    placeholder: '0.0 – 1.0',
    min: 0.0, max: 1.0, step: 0.001,
    hint: '0 = pure Ag, 1 = pure Au, 0.5 = equal mix',
  },
  {
    key: 'n_atoms',
    label: 'Number of Atoms',
    placeholder: '3 – 20',
    min: 2, max: 30, step: 1,
    hint: 'Cluster size. Model trained on n = 3–20',
  },
  {
    key: 'n_valence_electrons',
    label: 'Total Valence Electrons',
    placeholder: 'n_atoms × 11',
    min: 1, max: 250, step: 1,
    hint: 'Au and Ag both have 11 valence electrons. For pure clusters: n_atoms × 11',
  },
];

const EXAMPLE = {
  homo_lumo_gap_eV: 0.91,
  formation_energy_eV_per_atom: -1.42,
  binding_energy_eV_per_atom: 2.35,
  coordination_number: 5.2,
  ionization_potential_eV: 7.64,
  electron_affinity_eV: 2.73,
  chemical_hardness_eV: 2.455,
  electronegativity_eV: 5.185,
  au_fraction: 0.5,
  n_atoms: 12,
  n_valence_electrons: 132,
};

export default function Predict() {
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const loadExample = () => {
    setForm(EXAMPLE);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const payload = {};
      FIELDS.forEach(f => {
        payload[f.key] = parseFloat(form[f.key]);
      });
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const allFilled = FIELDS.every(f => form[f.key] !== undefined && form[f.key] !== '');

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Predict Stability</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Enter all 11 core features for an Au/Ag nanocluster. The ensemble model (XGBoost + SVM + MLP)
        returns a stability prediction and probability.
      </p>

      <button
        onClick={loadExample}
        style={{
          marginBottom: '1.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem',
          background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Load example (Au₆Ag₆, n=12)
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {FIELDS.map(f => (
          <div key={f.key}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
              {f.label}
            </label>
            <input
              type="number"
              min={f.min} max={f.max} step={f.step}
              placeholder={f.placeholder}
              value={form[f.key] ?? ''}
              onChange={e => handleChange(f.key, e.target.value)}
              style={{
                width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.9rem',
                border: '1px solid #d1d5db', borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem' }}>{f.hint}</div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allFilled || loading}
        style={{
          width: '100%', padding: '0.75rem', fontSize: '1rem', fontWeight: 600,
          background: allFilled && !loading ? '#2563eb' : '#93c5fd',
          color: '#fff', border: 'none', borderRadius: '8px',
          cursor: allFilled && !loading ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Predicting…' : 'Predict Stability'}
      </button>

      {error && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '1.5rem', padding: '1.5rem', borderRadius: '8px',
          background: result.stable === 1 ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${result.stable === 1 ? '#22c55e' : '#ef4444'}`,
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: result.stable === 1 ? '#16a34a' : '#dc2626' }}>
            {result.stable === 1 ? '✅ Stable' : '❌ Unstable'}
          </div>
          {result.probability !== undefined && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
              Confidence: <strong>{(result.probability * 100).toFixed(1)}%</strong>
            </div>
          )}
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.75rem' }}>
            Prediction from VotingClassifier ensemble. Trained on 600 literature-informed samples.
            For research/educational use only — not validated for production nanoscience.
          </p>
        </div>
      )}
    </div>
  );
}
