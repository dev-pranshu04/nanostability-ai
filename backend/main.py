from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd, numpy as np, joblib, json, os

app = FastAPI(title="NanoStability AI API")
app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_credentials=False,
    allow_methods=["GET","POST","OPTIONS"], allow_headers=["*"])

# ── Load pre-trained model (instant — no training on startup)
bundle  = joblib.load("model.joblib")
MODEL   = bundle["model"]
SCALER  = bundle["scaler"]
with open("metrics.json") as f:
    METRICS = json.load(f)

df      = pd.read_csv("au_ag_nanocluster_stability.csv")
DATASET = df.fillna(0).to_dict(orient="records")

FEATURE_COLS = [
    "n_atoms","formation_energy_eV","homo_lumo_gap_eV","binding_energy_eV",
    "coord_number_avg","is_planar","magnetic_moment_bohr","ionization_potential_eV",
    "electron_affinity_eV","n_valence_electrons","energy_above_lowest_eV"
]

class PredictRequest(BaseModel):
    element: str; n_atoms: int
    formation_energy_eV: float; homo_lumo_gap_eV: float
    binding_energy_eV: float; coord_number_avg: float
    is_planar: int; magnetic_moment_bohr: float
    ionization_potential_eV: float; electron_affinity_eV: float
    energy_above_lowest_eV: float

@app.get("/")
def root(): return {"status":"NanoStability AI API running","model_ready":True}

@app.get("/health")
def health(): return {"ok":True,"model_ready":True}

@app.get("/metrics")
def get_metrics(): return METRICS

@app.get("/dataset")
def get_dataset(): return {"data":DATASET,"count":len(DATASET)}

@app.post("/predict")
def predict(req: PredictRequest):
    is_gold = 1 if req.element.upper().startswith("AU") else 0
    arr = np.array([[req.n_atoms, req.formation_energy_eV, req.homo_lumo_gap_eV,
                     req.binding_energy_eV, req.coord_number_avg, req.is_planar,
                     req.magnetic_moment_bohr, req.ionization_potential_eV,
                     req.electron_affinity_eV, 11*req.n_atoms,
                     req.energy_above_lowest_eV, is_gold]])
    arr_s = SCALER.transform(arr)
    pred  = int(MODEL.predict(arr_s)[0])
    proba = MODEL.predict_proba(arr_s)[0].tolist()
    return {"prediction":pred,
            "probability_stable":float(proba[1]),
            "probability_unstable":float(proba[0]),
            "confidence":float(proba[pred])}
