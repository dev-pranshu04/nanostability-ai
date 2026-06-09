# ⚛ NanoStability AI

Physics-informed ML for Au/Ag nanocluster stability prediction.  
**XGBoost + SVM + Neural Network ensemble | 85% accuracy | 0.912 ROC-AUC**

---

## 🗂 Repository Structure

```
nanostability-ai/
├── backend/
│   ├── main.py                          ← FastAPI server
│   ├── model.joblib                     ← Pre-trained ML model (loads instantly)
│   ├── metrics.json                     ← Pre-computed model metrics
│   ├── au_ag_nanocluster_stability.csv  ← 200-sample dataset
│   └── requirements.txt                 ← Python dependencies
├── frontend/
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── index.js
│       ├── App.js                       ← Main app + API connection
│       └── components/
│           ├── Overview.js
│           ├── Predict.js
│           ├── Dashboard.js
│           └── Metrics.js
├── render.yaml                          ← Render auto-deploy config
├── vercel.json                          ← Vercel auto-deploy config
└── README.md
```

---

## 🚀 Deploy in 4 Steps (no coding, no terminal)

### STEP 1 — Upload to GitHub

1. Go to **https://github.com** → sign in → click **+** → **New repository**
2. Name: `nanostability-ai` | **Public** | click **Create repository**
3. Click **uploading an existing file**
4. Drag and drop **ALL files from this folder** keeping the folder structure
5. Click **Commit changes**

---

### STEP 2 — Deploy Backend on Render (free)

1. Go to **https://render.com** → **Sign up with GitHub**
2. Click **New +** → **Web Service**
3. Select your `nanostability-ai` repository
4. Fill in these fields **exactly**:

   | Field | Value |
   |---|---|
   | Name | `nanostability-ai` |
   | Root Directory | `backend` |
   | Language | `Python 3` |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
   | Instance Type | **Free** |

5. Click **Create Web Service**
6. Wait ~2 minutes for the green **Live** badge
7. Copy your URL — it looks like: `https://nanostability-ai.onrender.com`
8. **Test it**: open `YOUR_RENDER_URL/metrics` in browser → you should see JSON data ✅

---

### STEP 3 — Edit ONE line in App.js

1. In your GitHub repo → click `frontend` → `src` → `App.js`
2. Click the **pencil icon** (Edit)
3. Find this line:
   ```js
   const API_URL = process.env.REACT_APP_API_URL || 'https://nanostability-ai.onrender.com';
   ```
4. Replace `https://nanostability-ai.onrender.com` with **your actual Render URL**
5. Click **Commit changes**

---

### STEP 4 — Deploy Frontend on Vercel (free)

1. Go to **https://vercel.com** → **Sign up with GitHub**
2. Click **Add New Project** → import `nanostability-ai`
3. Fill in:

   | Field | Value |
   |---|---|
   | Framework Preset | **Other** |
   | Root Directory | *(leave blank — vercel.json handles it)* |

4. Click **Deploy**
5. Wait ~2 minutes
6. Your live URL: `https://nanostability-ai.vercel.app` ✅

---

## ✏️ Updating

Change any file on GitHub → both Render and Vercel **auto-redeploy in ~2 minutes**.

---

## 📊 Model Details

| Metric | Value |
|---|---|
| Test Accuracy | 85.0% |
| ROC-AUC | 0.912 |
| 5-Fold CV | 77.5% ± 5.2% |
| Dataset | 200 Au/Ag nanoclusters (n = 3–20 atoms) |
| Features | 11 DFT-derived (HOMO-LUMO gap, formation energy, binding energy, etc.) |
| Ensemble | XGBoost (300 trees) + SVM (RBF kernel) + MLP (64-32-16) |

---

*Built for NSUT Computational Chemistry Lab Internship, May–Aug 2025*
