from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (accuracy_score, roc_auc_score, roc_curve,
                              confusion_matrix, classification_report)
import warnings, os
warnings.filterwarnings("ignore")

app = FastAPI(title="NanoStability AI API")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── globals set at startup
MODEL = None
SCALER = None
METRICS = {}
FEAT_IMP = []
DATASET = None

FEATURE_COLS = [
    "n_atoms","formation_energy_eV","homo_lumo_gap_eV","binding_energy_eV",
    "coord_number_avg","is_planar","magnetic_moment_bohr","ionization_potential_eV",
    "electron_affinity_eV","n_valence_electrons","energy_above_lowest_eV"
]

@app.on_event("startup")
def train():
    global MODEL, SCALER, METRICS, FEAT_IMP, DATASET
    df = pd.read_csv("au_ag_nanocluster_stability.csv")
    DATASET = df.to_dict(orient="records")

    X = df[FEATURE_COLS].values
    y = df["stable"].values
    enc = (df["element"]=="Au").astype(int).values.reshape(-1,1)
    X = np.hstack([X, enc])

    SCALER = StandardScaler()
    Xs = SCALER.fit_transform(X)
    Xtr,Xte,ytr,yte = train_test_split(Xs,y,test_size=0.2,random_state=42,stratify=y)

    xgb = GradientBoostingClassifier(n_estimators=300,max_depth=4,learning_rate=0.06,subsample=0.85,random_state=42)
    svm = SVC(kernel="rbf",C=2.5,probability=True,random_state=42)
    mlp = MLPClassifier(hidden_layer_sizes=(64,32,16),max_iter=600,random_state=42,early_stopping=True,alpha=0.01)
    MODEL = VotingClassifier(estimators=[("xgb",xgb),("svm",svm),("mlp",mlp)],voting="soft")
    MODEL.fit(Xtr,ytr)

    ypred = MODEL.predict(Xte)
    yprob = MODEL.predict_proba(Xte)[:,1]
    cv    = cross_val_score(MODEL,Xs,y,cv=5,scoring="accuracy")

    xgb2 = GradientBoostingClassifier(n_estimators=300,max_depth=4,learning_rate=0.06,subsample=0.85,random_state=42)
    xgb2.fit(Xtr,ytr)
    FEAT_IMP = xgb2.feature_importances_.tolist()

    fpr,tpr,_ = roc_curve(yte,yprob)
    rep = classification_report(yte,ypred,output_dict=True)
    cm  = confusion_matrix(yte,ypred)

    METRICS = {
        "accuracy":    float(accuracy_score(yte,ypred)),
        "roc_auc":     float(roc_auc_score(yte,yprob)),
        "cv_mean":     float(cv.mean()),
        "cv_std":      float(cv.std()),
        "fpr":         fpr.tolist(),
        "tpr":         tpr.tolist(),
        "confusion":   cm.tolist(),
        "report":      rep,
        "stable_count":   int(y.sum()),
        "unstable_count": int((y==0).sum()),
        "total":          len(y),
    }
    print("✅ Model trained")

class PredictRequest(BaseModel):
    element: str
    n_atoms: int
    formation_energy_eV: float
    homo_lumo_gap_eV: float
    binding_energy_eV: float
    coord_number_avg: float
    is_planar: int
    magnetic_moment_bohr: float
    ionization_potential_eV: float
    electron_affinity_eV: float
    energy_above_lowest_eV: float

@app.get("/")
def root(): return {"status":"NanoStability AI API running"}

@app.get("/metrics")
def get_metrics():
    return {**METRICS, "feature_importance": FEAT_IMP,
            "feature_names":FEATURE_COLS+["is_gold"]}

@app.get("/dataset")
def get_dataset(): return {"data": DATASET}

@app.post("/predict")
def predict(req: PredictRequest):
    n_valence = 11 * req.n_atoms
    is_gold   = 1 if req.element.upper().startswith("AU") else 0
    arr = np.array([[req.n_atoms, req.formation_energy_eV, req.homo_lumo_gap_eV,
                     req.binding_energy_eV, req.coord_number_avg, req.is_planar,
                     req.magnetic_moment_bohr, req.ionization_potential_eV,
                     req.electron_affinity_eV, n_valence,
                     req.energy_above_lowest_eV, is_gold]])
    arr_s = SCALER.transform(arr)
    pred  = int(MODEL.predict(arr_s)[0])
    proba = MODEL.predict_proba(arr_s)[0].tolist()
    return {"prediction": pred, "probability_stable": proba[1],
            "probability_unstable": proba[0], "confidence": proba[pred]}
