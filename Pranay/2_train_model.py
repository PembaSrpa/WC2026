"""
Step 2 — Train Model
Trains an XGBoost classifier on the engineered features.
Outputs model/model.pkl + prints validation accuracy.

Run after: python 1_build_dataset.py
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
from xgboost import XGBClassifier

# ── Config ────────────────────────────────────────────────────────────────────
FEATURES_PATH = "data/features.csv"
MODEL_PATH    = "model/model.pkl"

FEATURE_COLS = [
    "elo_diff", "elo_a", "elo_b",
    "form_win_a", "form_draw_a", "form_gf_a", "form_ga_a",
    "form_win_b", "form_draw_b", "form_gf_b", "form_ga_b",
    "h2h_win_rate", "h2h_draw_rate", "h2h_games",
    "stage_importance", "neutral",
]
TARGET = "outcome"   # 0=loss  1=draw  2=win  (from team_a perspective)
# ─────────────────────────────────────────────────────────────────────────────


def load_data():
    df = pd.read_csv(FEATURES_PATH)
    X = df[FEATURE_COLS]
    y = df[TARGET]
    print(f"✓ Loaded {len(df):,} samples")
    print(f"  Class distribution: {dict(y.value_counts().sort_index())}")
    return X, y, df


def build_pipeline() -> Pipeline:
    return Pipeline([
        ("scaler", StandardScaler()),
        ("model", XGBClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_lambda=1.5,
            use_label_encoder=False,
            eval_metric="mlogloss",
            random_state=42,
            n_jobs=-1,
        )),
    ])


def evaluate(pipeline, X, y):
    print("\n── Cross-validation (5-fold stratified) ─────────────────────────")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(pipeline, X, y, cv=cv, scoring="accuracy")
    print(f"  Accuracy: {scores.mean():.3f} ± {scores.std():.3f}")
    print(f"  Folds: {[round(s, 3) for s in scores]}")
    return scores.mean()


def train_final(pipeline, X, y):
    """Temporal split: last 20% of data as held-out test."""
    split = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    print("\n── Hold-out test (most recent 20%) ──────────────────────────────")
    print(f"  Accuracy: {accuracy_score(y_test, y_pred):.3f}")
    print(classification_report(y_test, y_pred, target_names=["Loss", "Draw", "Win"]))

    return pipeline


def save_model(pipeline, feature_cols):
    os.makedirs("model", exist_ok=True)
    bundle = {"pipeline": pipeline, "feature_cols": feature_cols}
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(bundle, f)
    print(f"✓ Model saved → {MODEL_PATH}")


if __name__ == "__main__":
    X, y, df = load_data()
    pipeline  = build_pipeline()

    evaluate(pipeline, X, y)
    trained   = train_final(pipeline, X, y)
    save_model(trained, FEATURE_COLS)
