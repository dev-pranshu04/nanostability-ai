import React, { useState } from 'react';
import { API_URL } from '../App';

const card   = { background: '#080818', border: '1px solid #12122a', borderRadius: 14, padding: '1.3rem' };
const label  = { fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500, display: 'block', marginBottom: 6 };
const input  = { width: '100%', background: '#060612', border: '1px solid #1a1a30', borderRadius: 8, padding: '0.6rem 0.8rem', color: '#e8d5b7', fontSize: '0.9rem', fontFamily: "'Inter', sans-serif", outline: 'none' };
const hint   = { fontSize: '0.7rem', color: '#374151', marginTop: 4 };
const secLbl = { fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #0f1117' };

export default function Predict() {
  const [form, setForm] = useState({
    element: 'Au', n_atoms: 8,
    formation_energy_eV: -1.72, homo_lumo_gap_eV: 1.42,
    binding_energy_eV: 2.18,    coord_number_avg: 3.25,
    is_planar: 0,               magnetic_moment_bohr: 0,
    ionization_potential_eV: 8.21, electron_affinity_eV: 2.68,
    energy_above_lowest_eV: 0,
  });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, n_atoms: Number(form.n_atoms) }),
      });
      const d = await res.json();
      setResult(d);
    } catch (e) {
      alert('Prediction failed — check backend is running');
    }
    setLoading(false);
  };

  const stable  = result?.prediction === 1;
  const insights = result ? buildInsights(form) : [];

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '2rem', color: '#e8d5b7', marginBottom: '0.3rem' }}>🔬 Predict Stability</div>
      <div style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter the DFT-computed properties of your nanocluster.</div>

      <div style={card}>
        <div style={secLbl}>Cluster Properties</div>

        {/* Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <span style={label}>Element</span>
            <select style={input} value={form.element} onChange={e => set('element', e.target.value)}>
              <option value="Au">Au — Gold</option>
              <option value="Ag">Ag — Silver</option>
            </select>
          </div>
          <div>
            <span style={label}>Number of Atoms: <strong style={{ color: '#3b82f6' }}>{form.n_atoms}</strong></span>
            <input type="range" min={3} max={20} step={1} value={form.n_atoms}
              onChange={e => set('n_atoms', Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3b82f6', marginTop: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', ...hint }}>
              <span>3</span><span style={{ color: '#f59e0b' }}>Magic: 8, 18, 20</span><span>20</span>
            </div>
          </div>
          <div>
            <span style={label}>Structure Type</span>
            <select style={input} value={form.is_planar} onChange={e => set('is_planar', Number(e.target.value))}>
              <option value={0}>3D (non-planar)</option>
              <option value={1}>2D (planar)</option>
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
          {[
            ['formation_energy_eV', 'Formation Energy (eV/atom)',    -1.72, -3,   0,   0.01, 'More negative = thermodynamically stable'],
            ['homo_lumo_gap_eV',    'HOMO-LUMO Gap (eV)',             1.42,  0,   4,   0.01, 'Large gap = electronically stable'],
            ['binding_energy_eV',   'Binding Energy (eV/atom)',       2.18,  0,   4,   0.01, 'Energy holding the cluster together'],
            ['coord_number_avg',    'Avg Coordination Number',        3.25,  1,   7,   0.05, 'Average number of atomic neighbors'],
            ['magnetic_moment_bohr','Magnetic Moment (Bohr)',         0,     0,   5,   1,    '0 for closed-shell (even-electron) clusters'],
            ['ionization_potential_eV','Ionization Potential (eV)',   8.21,  5,  12,   0.01, 'Energy needed to remove one electron'],
            ['electron_affinity_eV','Electron Affinity (eV)',         2.68,  0.5, 5,  0.01, 'Energy released when gaining one electron'],
            ['energy_above_lowest_eV','Energy Above Minimum (eV/at)',  0,    0,   1,  0.01, '0 = global minimum structure'],
          ].map(([key, lbl, def, min, max, step, tip]) => (
            <div key={key}>
              <span style={label}>{lbl}</span>
              <input type="number" style={input} value={form[key]}
                min={min} max={max} step={step}
                onChange={e => set(key, parseFloat(e.target.value) || 0)} />
              <div style={hint}>{tip}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={run} disabled={loading}
        style={{ width: '100%', marginTop: '1rem', padding: '1rem', background: loading ? '#1e293b' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)', border: 'none', borderRadius: 10, color: 'white', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Space Mono', monospace", letterSpacing: '0.05em' }}
      >
        {loading ? '⏳ Running Model...' : '⚛ Run Prediction'}
      </button>

      {result && (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Result card */}
          <div style={{ ...card, background: stable ? 'linear-gradient(135deg,#022c22,#064e3b)' : 'linear-gradient(135deg,#2d0a0a,#450a0a)', border: `1px solid ${stable ? '#10b981' : '#ef4444'}`, textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '2rem', fontWeight: 700, color: stable ? '#10b981' : '#ef4444', marginBottom: '0.5rem' }}>
              {stable ? '✅ STABLE' : '❌ UNSTABLE'}
            </div>
            <div style={{ color: '#9ca3af' }}>Model confidence: <strong style={{ color: '#e8d5b7' }}>{(result.confidence * 100).toFixed(1)}%</strong></div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '1.2rem' }}>
              {[['P(Stable)', result.probability_stable, '#10b981'], ['P(Unstable)', result.probability_unstable, '#ef4444']].map(([lbl, val, c]) => (
                <div key={lbl} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '1.5rem', color: c }}>{(val * 100).toFixed(1)}%</div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Probability bars */}
          <div style={card}>
            <div style={secLbl}>Ensemble Vote Breakdown</div>
            {[['Stable', result.probability_stable, '#10b981'], ['Unstable', result.probability_unstable, '#ef4444']].map(([lbl, val, c]) => (
              <div key={lbl} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem', color: '#9ca3af' }}>
                  <span>{lbl}</span><span style={{ color: c, fontWeight: 600 }}>{(val * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: 10, background: '#0f1117', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${val * 100}%`, background: c, borderRadius: 5, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Physics insights */}
          <div style={card}>
            <div style={secLbl}>Physics Interpretation</div>
            {insights.map(([icon, text], i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem', fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.6 }}>
                <span style={{ flexShrink: 0 }}>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildInsights(form) {
  const ins = [];
  const gap = form.homo_lumo_gap_eV;
  const ef  = form.formation_energy_eV;
  const n   = Number(form.n_atoms);

  if      (gap > 1.2) ins.push(['✅', `HOMO-LUMO gap (${gap} eV) is large — strong electronic shell closure, highly resistant to chemical attack.`]);
  else if (gap > 0.5) ins.push(['🟡', `HOMO-LUMO gap (${gap} eV) is moderate — partial electronic stability.`]);
  else                ins.push(['⚠️', `HOMO-LUMO gap (${gap} eV) is small — cluster is electronically reactive.`]);

  if      (ef < -1.8) ins.push(['✅', `Formation energy (${ef} eV/atom) strongly negative — very thermodynamically stable.`]);
  else if (ef < -1.0) ins.push(['🟡', `Formation energy (${ef} eV/atom) is moderately favorable.`]);
  else                ins.push(['⚠️', `Formation energy (${ef} eV/atom) is weakly negative — may not form spontaneously.`]);

  if ([2, 8, 18, 20].includes(n))
    ins.push(['⭐', `${n} atoms is a magic number — fully filled electronic shells greatly boost stability (like noble gases).`]);
  else if ([3, 9, 19].includes(n))
    ins.push(['⚠️', `${n} atoms is one past a shell closure — open-shell configuration reduces stability.`]);

  if (form.energy_above_lowest_eV < 0.03)
    ins.push(['✅', 'Energy above minimum ≈ 0 — this is the true ground-state structure.']);
  else if (form.energy_above_lowest_eV < 0.1)
    ins.push(['🟡', `Energy above minimum (${form.energy_above_lowest_eV} eV/atom) — likely a low-lying isomer.`]);
  else
    ins.push(['⚠️', `Energy above minimum (${form.energy_above_lowest_eV} eV/atom) — metastable isomer, not ground state.`]);

  if (form.element === 'Au' && n <= 12)
    ins.push(['ℹ️', 'Gold clusters ≤ 12 atoms show relativistic stabilisation — 6s orbital contraction enhances bonding and planarity.']);
  else
    ins.push(['ℹ️', 'Silver clusters follow regular shell-closing rules with more predictable stability patterns than gold.']);

  return ins;
}
