import matplotlib
matplotlib.use('Agg')  # non-interactive backend — works on Render/servers
import matplotlib.pyplot as plt
from sklearn.metrics import ConfusionMatrixDisplay, classification_report
from sklearn.model_selection import learning_curve
import numpy as np
import os

os.makedirs("../docs", exist_ok=True)

# ── 1. Confusion Matrix ────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(6, 5))
ConfusionMatrixDisplay.from_estimator(
    model, X_test, y_test,
    display_labels=["Unstable", "Stable"],
    cmap="Blues", ax=ax
)
ax.set_title("Confusion Matrix — Ensemble (XGB + SVM + MLP)")
plt.tight_layout()
plt.savefig("../docs/confusion_matrix.png", dpi=150)
plt.close()
print("Saved confusion_matrix.png")

# ── 2. Learning Curve ──────────────────────────────────────────────────────
train_sizes, train_scores, cv_scores = learning_curve(
    model, X, y,
    cv=5,
    n_jobs=-1,
    train_sizes=np.linspace(0.1, 1.0, 10),
    scoring="accuracy"
)

fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(train_sizes, train_scores.mean(axis=1), 'o-', color="#2563eb", label="Train accuracy")
ax.fill_between(train_sizes,
    train_scores.mean(axis=1) - train_scores.std(axis=1),
    train_scores.mean(axis=1) + train_scores.std(axis=1),
    alpha=0.15, color="#2563eb")
ax.plot(train_sizes, cv_scores.mean(axis=1), 'o-', color="#d97706", label="CV accuracy")
ax.fill_between(train_sizes,
    cv_scores.mean(axis=1) - cv_scores.std(axis=1),
    cv_scores.mean(axis=1) + cv_scores.std(axis=1),
    alpha=0.15, color="#d97706")
ax.set_xlabel("Training samples")
ax.set_ylabel("Accuracy")
ax.set_title("Learning Curve — Ensemble Model")
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("../docs/learning_curve.png", dpi=150)
plt.close()
print("Saved learning_curve.png")

# ── 3. XGBoost Feature Importance ─────────────────────────────────────────
# xgb_model is the XGBoost component inside your VotingClassifier
# If your VotingClassifier is named `model` with estimators list:
xgb_model = model.estimators_[0]   # adjust index if XGB isn't first

fig, ax = plt.subplots(figsize=(8, 5))
from xgboost import plot_importance
plot_importance(
    xgb_model,
    ax=ax,
    max_num_features=11,
    importance_type="gain",   # 'gain' is more meaningful than 'weight'
    title="XGBoost Feature Importance (gain)",
    xlabel="Mean Gain"
)
plt.tight_layout()
plt.savefig("../docs/feature_importance.png", dpi=150)
plt.close()
print("Saved feature_importance.png")

print("\nAll 3 plots saved to /docs/")
