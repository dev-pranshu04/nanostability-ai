import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TT = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div style={{ background: '#0f1117', border: '1px solid #1f2937', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#e8d5b7' }}>
      <div>{label}</div>
      <div style={{ color: '#3b82f6' }}>{payload[0].value} clusters</div>
    </div>
  ) : null;

export default function Overview({ metrics, dataset }) {
  if (!metrics) return null;

  const barData = [
    { name: 'Stable',   value: metrics.stable_count,   fill: '#10b981' },
    { name: 'Unstable', value: metrics.unstable_count, fill: '#ef4444' },
  ];

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0a0a1f,#0d1b3e,#0a1628)', border: '1px solid #1a2a4a', borderRadius: 20, padding: '2.5rem 3rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, background: 'radial-gradient(circle,rgba(59,130,246,0.08),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '2.6rem', color: '#e8d5b7', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
          ⚛ NanoStability AI
        </div>
        <div style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '1.2rem' }}>
          Physics-Informed Machine Learning for Gold & Silver Nanocluster Stability Prediction
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['XGBoost', 'SVM', 'Neural Network', 'DFT Features', 'NSUT 2025'].map(b => (
            <span key={b} style={{ background: 'rgba(30,58,95,0.6)', color: '#7eb8f7', border: '1px solid #1e3a5f', borderRadius: 20, padding: '4px 14px', fontSize: '0.72rem', fontFamily: "'Space Mono', monospace" }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { v: `${(metrics.cv_mean * 100).toFixed(1)}%`, l: 'CV Accuracy',    c: '#3b82f6' },
          { v: metrics.roc_auc.toFixed(3),               l: 'ROC-AUC Score',  c: '#8b5cf6' },
          { v: metrics.total,                             l: 'DFT Samples',    c: '#f59e0b' },
          { v: '3',                                       l: 'ML Models',      c: '#10b981' },
        ].map(({ v, l, c }) => (
          <div key={l} style={{ background: '#080818', border: '1px solid #12122a', borderRadius: 14, padding: '1.4rem', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '2.2rem', fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: '0.72rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: '#080818', border: '1px solid #12122a', borderRadius: 14, padding: '1.5rem' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>What This Tool Does</div>
          <div style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.8 }}>
            Nanoclusters — tiny groups of <strong style={{ color: '#e8d5b7' }}>3 to 20 atoms</strong> — behave very
            differently from bulk metals. Whether a gold or silver nanocluster is{' '}
            <strong style={{ color: '#10b981' }}>stable</strong> depends on its quantum-mechanical
            electronic structure, which takes <strong style={{ color: '#e8d5b7' }}>hours</strong> to compute
            using traditional DFT simulations.
            <br /><br />
            This tool uses a <strong style={{ color: '#93c5fd' }}>physics-informed ML ensemble</strong> trained
            on 200 DFT-curated samples to predict stability in milliseconds — replacing expensive
            quantum computation with interpretable machine learning.
            <br /><br />
            <strong style={{ color: '#e8d5b7' }}>No single feature predicts stability.</strong> The model
            weighs all 11 DFT features together — electronic structure, thermodynamics, geometry,
            and quantum shell-closure effects.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#080818', border: '1px solid #12122a', borderRadius: 14, padding: '1.3rem' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>Dataset Split</div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TT />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: '#0a0f1e', border: '1px solid #1a2a4a', borderRadius: 10, padding: '1.2rem', fontSize: '0.82rem', color: '#9ca3af', lineHeight: 2 }}>
            <div style={{ color: '#e8d5b7', fontWeight: 600, marginBottom: '0.4rem' }}>Stability Criteria</div>
            {[
              { c: '#3b82f6', t: 'HOMO-LUMO Gap > 0.5 eV' },
              { c: '#f59e0b', t: 'Formation Energy < −1.0 eV/atom' },
              { c: '#10b981', t: 'Magic-number shell closure' },
              { c: '#8b5cf6', t: 'Binding energy & isomer quality' },
            ].map(({ c, t }) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: '0.8rem' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
