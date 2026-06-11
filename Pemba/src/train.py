from __future__ import annotations

import logging
import pickle

import numpy as np
import pandas as pd
import shap
from xgboost import XGBRegressor

from config import (
    FEATURE_COLS,
    MODELS_DIR,
    TARGETS,
    TRAIN_END_DATE,
    VAL_END_DATE,
    XGB_PARAMS,
)

logger = logging.getLogger(__name__)


def rps(p_pred: np.ndarray, p_actual: np.ndarray) -> float:
    cum_pred = np.cumsum(p_pred)
    cum_actual = np.cumsum(p_actual)
    return float(np.mean((cum_pred - cum_actual) ** 2))


def rps_dataset(preds: np.ndarray, actuals: np.ndarray) -> float:
    return float(np.mean([rps(preds[i], actuals[i]) for i in range(len(preds))]))


def normalize_preds(raw: np.ndarray) -> np.ndarray:
    clipped = np.clip(raw, 0.0, None)
    total = clipped.sum(axis=1, keepdims=True)
    total = np.where(total == 0, 1.0, total)
    return clipped / total


def split_data(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    train = df[df["date"] <= TRAIN_END_DATE]
    val = df[(df["date"] > TRAIN_END_DATE) & (df["date"] <= VAL_END_DATE)]
    test = df[df["date"] > VAL_END_DATE]
    logger.info("Split — train: %d  val: %d  test: %d", len(train), len(val), len(test))
    return train, val, test


def train(
    df: pd.DataFrame,
) -> tuple[dict[str, XGBRegressor], dict[str, shap.TreeExplainer], dict[str, float]]:
    train_df, val_df, _ = split_data(df)

    if len(train_df) < 10:
        raise ValueError(f"Training set too small: {len(train_df)} rows")

    X_train = train_df[FEATURE_COLS].astype(float)
    X_val = val_df[FEATURE_COLS].astype(float) if not val_df.empty else None

    models: dict[str, XGBRegressor] = {}
    explainers: dict[str, shap.TreeExplainer] = {}
    metrics: dict[str, float] = {}

    for target in TARGETS:
        y_train = train_df[target].astype(float)
        model = XGBRegressor(**XGB_PARAMS)

        if X_val is not None and not val_df.empty:
            y_val = val_df[target].astype(float)
            model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
            val_mse = float(np.mean((model.predict(X_val) - y_val.values) ** 2))
            metrics[f"val_mse_{target}"] = val_mse
            logger.info("Val MSE [%s]: %.6f", target, val_mse)
        else:
            model.fit(X_train, y_train, verbose=False)

        models[target] = model
        explainers[target] = shap.TreeExplainer(model)

    if X_val is not None and not val_df.empty:
        raw = np.column_stack([models[t].predict(X_val.values) for t in TARGETS])
        norm = normalize_preds(raw)
        actuals = val_df[TARGETS].values
        val_rps = rps_dataset(norm, actuals)
        metrics["val_rps"] = val_rps
        logger.info("Val RPS: %.6f  (lower is better, random = 0.333)", val_rps)

    return models, explainers, metrics


def save(
    models: dict[str, XGBRegressor],
    explainers: dict[str, shap.TreeExplainer],
) -> None:
    for target, model in models.items():
        model.save_model(str(MODELS_DIR / f"model_{target}.json"))
    with open(MODELS_DIR / "explainers.pkl", "wb") as f:
        pickle.dump(explainers, f)
    logger.info("Models saved to %s", MODELS_DIR)


def load() -> tuple[dict[str, XGBRegressor], dict[str, shap.TreeExplainer]]:
    models: dict[str, XGBRegressor] = {}
    for target in TARGETS:
        path = MODELS_DIR / f"model_{target}.json"
        if not path.exists():
            raise FileNotFoundError(f"Model not found: {path}. Run run_train.py first.")
        m = XGBRegressor()
        m.load_model(str(path))
        models[target] = m
    with open(MODELS_DIR / "explainers.pkl", "rb") as f:
        explainers = pickle.load(f)
    return models, explainers


def evaluate_test(df: pd.DataFrame, models: dict[str, XGBRegressor]) -> float | None:
    _, _, test_df = split_data(df)
    if test_df.empty:
        logger.info("No test data yet — will evaluate after WC 2026 matches are played")
        return None
    X_test = test_df[FEATURE_COLS].astype(float)
    raw = np.column_stack([models[t].predict(X_test.values) for t in TARGETS])
    norm = normalize_preds(raw)
    actuals = test_df[TARGETS].values
    score = rps_dataset(norm, actuals)
    logger.info("Test RPS: %.6f", score)
    return score
