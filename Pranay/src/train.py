"""
Train one binary XGBoost classifier per outcome (p_win, p_draw, p_loss),
each predicting "does team_a win / draw / lose this match?" from the
home team's perspective. At prediction time the three raw probabilities
are normalized so they sum to exactly 1.0.

Each model is saved in XGBoost's native JSON format
(models/model_p_win.json, model_p_draw.json, model_p_loss.json) and a
SHAP TreeExplainer for each is pickled together into models/explainers.pkl.
"""

import logging
import pickle

import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score, roc_auc_score
from xgboost import XGBClassifier
import shap

from . import config

logger = logging.getLogger(__name__)

TARGETS = {
    "p_win": 2,   # outcome == 2 -> team_a won
    "p_draw": 1,  # outcome == 1 -> draw
    "p_loss": 0,  # outcome == 0 -> team_a lost
}


def train(df):
    """Train the 3 binary models on a temporal 80/20 split.
    Returns (models, explainers, metrics)."""
    X = df[config.FEATURE_COLS]
    y = df["outcome"]

    split = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    models = {}
    explainers = {}
    metrics = {}

    for name, positive_class in TARGETS.items():
        y_train_bin = (y_train == positive_class).astype(int)
        y_test_bin = (y_test == positive_class).astype(int)

        logger.info("Training %s ...", name)

        model = XGBClassifier(**config.XGB_PARAMS)

        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X_train, y_train_bin, cv=cv, scoring="roc_auc")
        metrics[f"{name}_cv_auc"] = float(cv_scores.mean())

        model.fit(X_train, y_train_bin)

        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1]
        metrics[f"{name}_test_accuracy"] = float(accuracy_score(y_test_bin, y_pred))
        metrics[f"{name}_test_auc"] = float(roc_auc_score(y_test_bin, y_proba))

        models[name] = model
        explainers[name] = shap.TreeExplainer(model)

    return models, explainers, metrics


def save(models, explainers):
    config.MODELS_DIR.mkdir(parents=True, exist_ok=True)

    for name, model in models.items():
        path = config.MODELS_DIR / f"model_{name}.json"
        model.save_model(str(path))
        logger.info("Saved %s", path)

    explainers_path = config.MODELS_DIR / "explainers.pkl"
    with open(explainers_path, "wb") as f:
        pickle.dump(explainers, f)
    logger.info("Saved %s", explainers_path)


def load():
    models = {}
    for name in TARGETS:
        model = XGBClassifier()
        model.load_model(str(config.MODELS_DIR / f"model_{name}.json"))
        models[name] = model

    with open(config.MODELS_DIR / "explainers.pkl", "rb") as f:
        explainers = pickle.load(f)

    return models, explainers


def evaluate_test(df, models):
    """Quick combined-prediction sanity check on the held-out test split."""
    X = df[config.FEATURE_COLS]
    y = df["outcome"]
    split = int(len(df) * 0.8)
    X_test, y_test = X.iloc[split:], y.iloc[split:]

    raw = np.column_stack([
        models["p_loss"].predict_proba(X_test)[:, 1],
        models["p_draw"].predict_proba(X_test)[:, 1],
        models["p_win"].predict_proba(X_test)[:, 1],
    ])
    norm = raw / raw.sum(axis=1, keepdims=True)
    y_pred = norm.argmax(axis=1)

    acc = accuracy_score(y_test, y_pred)
    logger.info("Combined hold-out accuracy (argmax of normalized p_win/draw/loss): %.3f", acc)
    return acc
