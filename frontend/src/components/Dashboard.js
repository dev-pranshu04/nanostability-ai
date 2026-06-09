import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, ReferenceLine, Cell } from 'recharts';

const card    = { background: '#080818', border: '1px solid #12122a', borderRadius: 14, padding: '1.3rem' };
const secLbl  = { fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' };
const TT = ({ active, payload }) => active && payload?.length ? (
  <div style={{ background: '#0f1117', border: '1px solid #1f2937', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#e8d5b7' }}>
    {payload.map((p, i) => <div key={i} style={{ color: p.color || '#e8d5b7' }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</div>)}
  </div>
) : null;

export default function Dashboard({ dataset }) {
  const [elem, setElem]   = useState('all');
  const [stab, setStab]   = useState('all');

  const filtered = useMemo(() => dataset.filter(r => {
    if (elem !== 'all' && r.element !== elem) return false;
    if (stab === 'stable'   && r.stable !== 1) return false;
    if (stab === 'unstable' && r.stable !== 0) return false;
    return true;
  }), [dataset, elem, stab]);

  const stableCount = filtered.filter(r => r.stable === 1).length;
  const avgGap = filtered.length ? (filtered.reduce((a, r) => a + r.homo_lumo_gap_eV, 0) / filtered.length).toFixed(2) : 0;
  const avgEf  = filtered.length ? (filtered.reduce((a, r) => a + r.formation_energy_eV, 0) / filtered.length).toFixed(2) : 0;

  // Histogram buckets for formation energy
  const buckets = {};
  filtered.forEach(r => {
    const b = (Math.round(r.formation_energy_eV * 2) / 2).toFixed(1);
    if (!buckets[b]) buckets[b] = { x: Number(b), stable: 0, unstable: 0 };
    r.stable === 1 ? buckets[b].stable++ : buckets[b].unstable++;
  });
  const histData = Object.values(buckets).sort((a, b) => a.x - b.x);

  // Odd-even line data
  const lineMap = {};
  filtered.forEach(r => {
    if (!lineMap[r.n_atoms]) lineMap[r.n_atoms] = { n: r.n_atoms, Au: [], Ag: [] };
    lineMap[r.n_atoms][r.element].push(r.homo_lumo_gap_eV);
  });
  const lineData = Object.values(lineMap).sort((a, b) => a.n - b.n).map(d => ({
    n:  d.n,
    Au: d.Au.length ? (d.Au.reduce((a, v) => a + v, 0) / d.Au.length) : null,
    Ag: d.Ag.length ? (d.Ag.reduce((a, v) => a + v, 0) / d.Ag.length) : null,
  }));

  const sStable   = filtered.filter(r => r.stable === 1).map(r => ({ x: r.n_atoms,           y: r.homo_lumo_gap_eV }));
  const sUnstable = filtered.filter(r => r.stable === 0).map(r => ({ x: r.n_atoms,           y: r.homo_lumo_gap_eV }));
  const bStable   = filtered.filter(r => r.stable === 1).map(r => ({ x: r.binding_energy_eV, y: r.formation_energy_eV }));
  const bUnstable = filtered.filter(r => r.stable === 0).map(r => ({ x: r.binding_energy_eV, y: r.formation_energy_eV }));

  const sel = { background: '#060612', border: '1px solid #1a1a30', borderRadius: 6, padding: '0.4rem 0.7rem', color: '#e8d5b7', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" };
  const lbl = { fontSize: '0.7rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 };

  return (
    <div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '2rem', color: '#e8d5b7', marginBottom: '0.3rem' }}>Dataset Dashboard</div>
      <div style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Explore the 200-sample DFT-curated nanocluster dataset.</div>

      {/* Filters */}
      <div style={{ ...card, display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div><div style={lbl}>Element</div>
          <select style={sel} value={elem} onChange={e => setElem(e.target.value)}>
            <option value="all">All</option><option value="Au">Au — Gold</option><option value="Ag">Ag — Silver</option>
          </select>
        </div>
        <div><div style={lbl}>Stability</div>
          <select style={sel} value={stab} onChange={e => setStab(e.target.value)}>
            <option value="all">All</option><option value="stable">Stable only</option><option value="unstable">Unstable only</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', color: '#374151', fontSize: '0.8rem' }}>
          Showing <strong style={{ color: '#6b7280' }}>{filtered.length}</strong> of {dataset.length} clusters
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
        {[[filtered.length, 'Clusters', '#3b82f6'], [stableCount, 'Stable', '#10b981'], [`${avgGap} eV`, 'Avg HL Gap', '#8b5cf6'], [avgEf, 'Avg Ef (eV/at)', '#f59e0b']].map(([v, l, c]) => (
          <div key={l} style={{ background: '#080818', border: '1px solid #12122a', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '1.5rem', color: c }}>{v}</div>
            <div style={{ fontSize: '0.68rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
        <div style={card}>
          <div style={secLbl}>HOMO-LUMO Gap vs Cluster Size</div>
          <ResponsiveContainer width="100%" height={210}>
            <ScatterChart margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <XAxis dataKey="x" name="Atoms" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="y" name="Gap" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} cursor={{ fill: 'transparent' }} />
              <ReferenceLine y={0.5} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5} />
              <Scatter name="Stable"   data={sStable}   fill="#10b981" opacity={0.75} r={4} />
              <Scatter name="Unstable" data={sUnstable} fill="#ef4444" opacity={0.65} r={4} />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: '#4b5563', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>● Stable</span>
            <span style={{ color: '#ef4444' }}>● Unstable</span>
            <span style={{ color: '#f59e0b' }}>— 0.5 eV threshold</span>
          </div>
        </div>

        <div style={card}>
          <div style={secLbl}>Formation Energy Distribution</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={histData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <XAxis dataKey="x" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v.toFixed(1)} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Bar dataKey="stable"   name="Stable"   fill="#10b981" opacity={0.8} radius={[3, 3, 0, 0]} />
              <Bar dataKey="unstable" name="Unstable" fill="#ef4444" opacity={0.7} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: '#4b5563', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>■ Stable</span>
            <span style={{ color: '#ef4444' }}>■ Unstable</span>
          </div>
        </div>

        <div style={card}>
          <div style={secLbl}>Odd-Even Oscillation in HL Gap</div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <XAxis dataKey="n" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <ReferenceLine y={0.5} stroke="#374151" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="Au" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} name="Au" connectNulls />
              <Line type="monotone" dataKey="Ag" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: '#60a5fa' }} name="Ag" connectNulls />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: '#4b5563', marginTop: 4 }}>
            <span style={{ color: '#f59e0b' }}>— Au (Gold)</span>
            <span style={{ color: '#60a5fa' }}>— Ag (Silver)</span>
          </div>
        </div>

        <div style={card}>
          <div style={secLbl}>Binding Energy vs Formation Energy</div>
          <ResponsiveContainer width="100%" height={210}>
            <ScatterChart margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <XAxis dataKey="x" name="Binding E" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="y" name="Formation E" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} cursor={{ fill: 'transparent' }} />
              <Scatter name="Stable"   data={bStable}   fill="#10b981" opacity={0.7} r={4} />
              <Scatter name="Unstable" data={bUnstable} fill="#ef4444" opacity={0.6} r={4} />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ fontSize: '0.72rem', color: '#374151', marginTop: 4 }}>Mixed classes — confirming no single-feature separability</div>
        </div>
      </div>

      {/* Table */}
      <div style={card}>
        <div style={secLbl}>Raw Dataset — {filtered.length} entries</div>
        <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr>{['ID', 'Element', 'Atoms', 'Formation E', 'HL Gap', 'Binding E', 'Stable'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.6rem', color: '#4b5563', fontWeight: 600, borderBottom: '1px solid #0f1117', fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid #0a0a18', color: '#6b7280' }}>{r.cluster_id}</td>
                  <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid #0a0a18', color: r.element === 'Au' ? '#f59e0b' : '#60a5fa', fontWeight: 600 }}>{r.element}</td>
                  <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid #0a0a18', color: '#9ca3af' }}>{r.n_atoms}</td>
                  <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid #0a0a18', color: '#9ca3af' }}>{r.formation_energy_eV?.toFixed(3)}</td>
                  <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid #0a0a18', color: '#9ca3af' }}>{r.homo_lumo_gap_eV?.toFixed(3)}</td>
                  <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid #0a0a18', color: '#9ca3af' }}>{r.binding_energy_eV?.toFixed(3)}</td>
                  <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid #0a0a18' }}>
                    <span style={{ color: r.stable === 1 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{r.stable === 1 ? '✅' : '❌'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
