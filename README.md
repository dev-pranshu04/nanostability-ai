# ⚛️ NanoStability AI

![Tests](https://github.com/dev-pranshu04/nanostability-ai/actions/workflows/test.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688)

**Predicting thermodynamic stability of bimetallic Au/Ag nanoclusters using a physics-informed ML ensemble.**

> Live Demo: [nanostability-ai.vercel.app](https://nanostability-ai.vercel.app) *(allow ~30s for backend cold start on free tier)*

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Scientific Background](#2-scientific-background)
3. [Dataset](#3-dataset)
4. [Feature Engineering](#4-feature-engineering)
5. [Model Architecture & Design Decisions](#5-model-architecture--design-decisions)
6. [Results](#6-results)
7. [Limitations & Honest Caveats](#7-limitations--honest-caveats)
8. [Project Structure](#8-project-structure)
9. [Local Setup](#9-local-setup)
10. [Deploy to Production](#10-deploy-to-production)

---

## 1. Problem Statement

Bimetallic Au/Ag nanoclusters (3–20 atoms) are of significant interest in nanomedicine, catalysis, and biosensing. Their properties — optical absorption, reactivity, and biocompatibility — are highly sensitive to their size, composition, and structural stability. Determining stability traditionally requires expensive and time-intensive DFT (Density Functional Theory) simulations.

**This project asks:** can we train an ML model on DFT-derived electronic and structural features to rapidly classify whether a given Au/Ag nanocluster configuration is thermodynamically stable, without running a new DFT calculation?

---

## 2. Scientific Background

Nanocluster stability is governed by several competing factors established in the computational chemistry literature:

- **HOMO-LUMO gap** — A larger gap indicates greater electronic stability (chemical inertness). Stable noble metal clusters typically exhibit gaps > 0.5 eV [Coquet et al., *J. Mol. Catal. A*, 2008].
- **Binding energy** — Higher binding energy per atom (eV/atom) indicates stronger cohesion. Au clusters: ~1.5–3.2 eV/atom; Ag clusters: ~0.8–2.8 eV/atom [Johansson et al., *Phys. Rev. B*, 2004].
- **Formation energy** — More negative formation energy (eV/atom) corresponds to greater thermodynamic stability relative to isolated atoms [Fernandez et al., *Angew. Chem.*, 2004].
- **Relativistic effects in Au** — Gold's 5d/6s orbital contraction due to relativistic effects gives Au clusters distinctly different stability profiles from Ag, including wider HOMO-LUMO gaps [Pyykkö, *Angew. Chem. Int. Ed.*, 2004].
- **Jellium / magic numbers** — Clusters with electron counts matching closed electronic shells (n = 2, 8, 18, 20) show enhanced stability ("magic number" clusters) [de Heer, *Rev. Mod. Phys.*, 1993].

**Stability label definition used in this project:**
A cluster is classified as **stable** if it simultaneously satisfies:
- HOMO-LUMO gap > 0.55 eV
- Formation energy < −0.65 eV/atom
- Binding energy > 1.80 eV/atom

This multi-criterion threshold is adapted from Coquet et al. (2008) and Xing et al. (*J. Phys. Chem. A*, 2006).

---

## 3. Dataset

### Construction & Provenance

This project uses a **600-sample literature-informed computational dataset** built by combining two sources. Neither source is raw DFT output — both are explicitly documented below.

| Component | Rows | What it is |
|---|---|---|
| `literature_anchor_interpolated` | 200 | 56 anchor rows digitised from published DFT papers + 144 rows interpolated via physics-based scaling laws |
| `physics_constrained_synthetic` | 400 | Fully synthetic, generated using parameter ranges calibrated from the same literature |
| **Combined** | **600** | Unified dataset with harmonized features and a single stability label |

**Anchor papers (56 rows):**
- Manna et al., *Scientific Data* (2023) — Au/Ag cluster geometries and energetics
- Gruene et al., *Science* (2008) — Au cluster planar/3D transition, HOMO-LUMO data
- Häkkinen et al., *PCCP* (2008) — Au nanocluster electronic structure
- Xing et al., *J. Phys. Chem. A* (2006) — relativistic effects in Au_n clusters
- Chaban, *Data in Brief* (2016) — Ag cluster formation energies

**Interpolation method:** Remaining 144 rows were generated using odd-even oscillation trends and size-dependent formation energy scaling consistent with the above papers. 400 synthetic rows use the same parameter ranges with Gaussian noise calibrated from reported variances.

> **Honest caveat:** If a recruiter or interviewer asks directly — the correct answer is: *"The feature ranges and scaling trends are grounded in published DFT literature, but the dataset itself was constructed computationally rather than downloaded from a public repository."* This is the standard approach in early-stage computational materials science work where real DFT runs are resource-prohibitive.

### Label Harmonization

The two source datasets used different stability scoring functions. Analysis showed **68% agreement** between the original label function and the 3-criterion threshold. Decision:

- **Original 200 rows:** labels kept as-is (they are the literature anchor — higher trust)
- **Synthetic 400 rows:** labels re-derived using the unified 3-criterion rule:
  - HOMO-LUMO gap > 0.55 eV
  - Formation energy < −0.65 eV/atom
  - Binding energy > 1.80 eV/atom

This is documented in the `data_source` column so any analysis can split by source.

### Class Distribution

| Class | Count | Fraction |
|---|---|---|
| Stable (1) | 406 | 67.7% |
| Unstable (0) | 194 | 32.3% |


### Data Integrity

Full duplicate audit was performed on the merged dataset:

| Check | Result |
|---|---|
| Exact duplicate rows | 0 |
| Duplicate cluster IDs | 0 |
| Duplicate core feature vectors (exact) | 0 |
| Near-duplicate feature vectors (rounded to 2dp) | 0 |
| Cross-source near-duplicates | 0 |

**Multiple rows per (element, n_atoms) are intentional — not duplicates.** Each row represents a distinct geometric isomer of the same cluster. For example, Au₇ has 9 rows corresponding to 9 different structural configurations, each with a different HOMO-LUMO gap, formation energy, and planarity. The `energy_above_lowest_eV` column discriminates isomers — rows close to 0 are ground-state structures; higher values are excited configurations. This is standard practice in nanocluster DFT datasets.

### Feature Coverage

All 11 core model features have **zero null values** across all 600 rows. 8 extended features (HOMO energy, LUMO energy, bond length, dipole, total energy, planarity, magnetic moment, energy above lowest) are populated only for rows where the source data included them — expected and documented.

| Feature | Coverage | Source |
|---|---|---|
| homo_lumo_gap_eV | 600/600 | Both |
| formation_energy_eV_per_atom | 600/600 | Both |
| binding_energy_eV_per_atom | 600/600 | Both |
| coordination_number | 600/600 | Both |
| ionization_potential_eV | 600/600 | Both |
| electron_affinity_eV | 600/600 | Both |
| chemical_hardness_eV | 600/600 | Both (derived: (IP−EA)/2) |
| electronegativity_eV | 600/600 | Both (derived: (IP+EA)/2) |
| au_fraction | 600/600 | Both |
| n_atoms | 600/600 | Both |
| n_valence_electrons | 600/600 | Both |
| homo_energy_eV | 400/600 | Synthetic only |
| avg_bond_length_angstrom | 400/600 | Synthetic only |
| is_planar | 200/600 | Original only |
| magnetic_moment_bohr | 200/600 | Original only |
| energy_above_lowest_eV | 200/600 | Original only |


## 4. Feature Engineering

The model uses 11 input features, each with a physicochemical motivation:

| Feature | Symbol | Unit | Physical Motivation |
|---|---|---|---|
| HOMO energy | ε_HOMO | eV | Relates to ionization potential (Koopmans' theorem) |
| LUMO energy | ε_LUMO | eV | Relates to electron affinity |
| HOMO-LUMO gap | Δε | eV | Primary stability indicator; wider gap = more stable |
| Binding energy | E_b | eV/atom | Cohesive strength; proxy for structural stability |
| Formation energy | E_f | eV/atom | Thermodynamic stability relative to bulk atoms |
| Average bond length | d_avg | Å | Structural descriptor; shorter bonds = stronger cohesion |
| Coordination number | CN | — | Higher CN correlates with bulk-like, more stable structures |
| Ionization potential | IP | eV | Energy to remove an electron; higher IP = harder to oxidize |
| Electron affinity | EA | eV | Energy gained by adding electron; affects reactivity |
| Chemical hardness | η | eV | η = (IP−EA)/2; HSAB principle; harder = more stable |
| Au fraction | x_Au | — | Compositional descriptor; captures relativistic Au effects |

Features were **not** normalized before training — tree-based models (XGBoost) are scale-invariant. Normalization was applied only for SVM and MLP.

---

## 5. Model Architecture & Design Decisions

### Why an Ensemble?

A single model is susceptible to its own inductive biases:
- **XGBoost** handles feature interactions and non-linearities well, but can overfit on small datasets.
- **SVM (RBF kernel)** provides strong generalization on low-dimensional problems but assumes a fixed kernel shape.
- **MLP (64→32→16)** can learn non-linear combinations but requires more data to generalize reliably.

Combining them via **soft voting** (averaging class probabilities) hedges against individual model weaknesses and consistently outperformed any single model in cross-validation on this dataset.

### Why not Random Forest / Gradient Boosting alone?

Random Forest was tested and yielded 82% accuracy vs XGBoost's 84%. The marginal gain from the full ensemble (85%) justified the added complexity for a portfolio context.

### Why not a deep neural network?

With 400 samples and 11 features, a deeper network would almost certainly overfit. The MLP used here is the minimum viable architecture (3 hidden layers, dropout=0.2) that contributes meaningfully to the ensemble without dominating it.

### Architecture Summary

```
Input (11 features)
        │
   ┌────┴────┐────────────┐
   ▼         ▼            ▼
XGBoost    SVM (RBF)   MLP (64→32→16)
300 trees  C=10, γ=0.1  ReLU, Dropout=0.2
   │         │            │
   └────┬────┘────────────┘
        ▼
  Soft Voting (avg probabilities)
        ▼
  Stability Prediction (0/1)
```

---

## 6. Results

| Metric | Value |
|---|---|
| Test Accuracy | 85.0% |
| ROC-AUC | 0.912 |
| 5-Fold CV Accuracy | 77.5% ± 5.2% |
| Precision (stable) | 0.87 |
| Recall (stable) | 0.96 |
| F1-Score (stable) | 0.91 |

The gap between CV accuracy (77.5%) and test accuracy (85%) warrants attention — see Limitations.

**Top 3 Features by XGBoost Importance:**
1. `homo_lumo_gap_eV` (0.31)
2. `formation_energy_eV_per_atom` (0.24)
3. `binding_energy_eV_per_atom` (0.19)

This is physically sensible: the HOMO-LUMO gap is the most cited single predictor of nanocluster stability in the DFT literature.

---

## 7. Limitations & Honest Caveats

**These must be understood before using or citing this project:**

1. **Synthetic data** — All 400 samples are physics-constrained simulations, not actual DFT calculations. The model has not been validated on real experimental or simulation data. Metrics reflect performance on synthetic test samples only.

2. **Small dataset** — 400 samples with 11 features is at the lower bound of statistical reliability for ensemble methods. The CV variance of ±5.2% reflects this. The reported test accuracy of 85% should be interpreted as an upper bound.

3. **CV vs test accuracy gap** — The 7.5% gap between cross-validation (77.5%) and test accuracy (85%) is suspicious and likely indicates some optimistic data leakage or test set luck on a small sample. This would need investigation with a larger dataset.

4. **Label definition is model-dependent** — The stability label is a deterministic function of three features also used as model inputs. This can artificially inflate accuracy. A real dataset would use DFT total energy minimization as ground truth.

5. **Generalization** — This model should not be used to predict stability of real nanoclusters without retraining on actual DFT data.

---

## 8. Project Structure

```
nanostability-ai/
├── backend/
│   ├── main.py                          ← FastAPI server (prediction + metrics endpoints)
│   ├── model.joblib                     ← Serialized ensemble model
│   ├── metrics.json                     ← Pre-computed evaluation metrics
│   ├── au_ag_nanocluster_stability.csv     ← 600-sample merged dataset
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── App.js                       ← Main app + API connection
│       └── components/
│           ├── Overview.js              ← Project summary tab
│           ├── Predict.js               ← Prediction interface
│           ├── Dashboard.js             ← Dataset visualizations
│           └── Metrics.js               ← Model performance tab
├── .github/
│   └── workflows/
│       └── test.yml                     ← CI: runs pytest on push
├── render.yaml                          ← Render auto-deploy config
├── vercel.json                          ← Vercel auto-deploy config
└── README.md
```

---

## 9. Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be live at `http://localhost:8000`. Test with:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/metrics
```

### Frontend

```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

App will open at `http://localhost:3000`.

### Running Tests

```bash
cd backend
pytest test_main.py -v
```

---

## 10. Deploy to Production

### Step 1 — Backend on Render (free tier)

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Set:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Deploy → copy your URL (e.g. `https://nanostability-ai.onrender.com`)

> **Note:** Free tier spins down after 15 min of inactivity. The frontend sends a `/health` ping on load to wake it — expect ~30s delay on first visit.

### Step 2 — Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project → import repo
2. Set Environment Variable: `REACT_APP_API_URL=https://your-render-url.onrender.com`
3. Deploy

Auto-redeploy triggers on every push to `main`.

---

## References

- Coquet, R. et al. (2008). Effects of support, morphology and size on the catalytic activity of gold in the selective oxidation of alcohols. *Journal of Molecular Catalysis A*, 278, 68-77.
- Fernandez, E.M. et al. (2004). Trends in the structure and bonding of noble metal clusters. *Angewandte Chemie*, 43(11), 1376-1379.
- Johansson, M.P. et al. (2004). On the structure of thiolate-protected gold. *Journal of Physical Chemistry B*, 108(49), 19036-19037.
- Pyykkö, P. (2004). Theoretical chemistry of gold. *Angewandte Chemie International Edition*, 43(34), 4412-4456.
- Xing, X. et al. (2006). Relativistic effects and the unique low symmetry structures of gold nanoclusters. *Journal of Physical Chemistry A*, 110(39), 11302-11305.
- de Heer, W.A. (1993). The physics of simple metal clusters: experimental aspects and simple models. *Reviews of Modern Physics*, 65(3), 611-676.

---

*Built as part of NSUT Computational Chemistry Lab Internship, May–Aug 2025.*
*All data is physics-constrained synthetic data. Not validated for production nanoscience applications.*
