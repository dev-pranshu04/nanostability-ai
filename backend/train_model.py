# Confusion matrix
from sklearn.metrics import ConfusionMatrixDisplay
ConfusionMatrixDisplay.from_estimator(model, X_test, y_test)
plt.savefig("confusion_matrix.png")

# Learning curve
from sklearn.model_selection import learning_curve
# plot train vs CV score vs training size
plt.savefig("learning_curve.png")

# Feature importance (XGBoost)
xgb.plot_importance(xgb_model)
plt.savefig("feature_importance.png")
