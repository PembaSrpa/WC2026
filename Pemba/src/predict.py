from __future__ import annotations

import json
import logging
from datetime import datetime

import numpy as np
import pandas as pd

from config import FEATURE_COLS, FD_STAGE_MAP, PREDICTIONS_DIR, TARGETS
from features import build_prediction_features
from train import load, normalize_preds

logger = logging.getLogger(__name__)


def _shap_for_match(
    explainers,
    x: np.ndarray,
    feature_names: list[str],
) -> dict[str, float]:
    shap_vals = explainers["p_win"].shap_values(x)
    row = shap_vals[0] if shap_vals.ndim == 2 else shap_vals
    return {feature_names[i]: round(float(row[i]), 6) for i in range(len(feature_names))}


def predict_fixtures(
    fixtures: list[dict],
    elo_data: dict,
    stage: str,
) -> list[dict]:
    if not fixtures:
        logger.warning("No fixtures to predict")
        return []

    models, explainers = load()
    feat_df = build_prediction_features(fixtures, elo_data)
    X = feat_df[FEATURE_COLS].astype(float).values

    raw = np.column_stack([models[t].predict(X) for t in TARGETS])
    norm = normalize_preds(raw)

    results: list[dict] = []
    for i, fix in enumerate(fixtures):
        p_win = round(float(norm[i, 0]), 4)
        p_draw = round(float(norm[i, 1]), 4)
        p_loss = round(float(norm[i, 2]), 4)
        shap_vals = _shap_for_match(explainers, X[i:i + 1], FEATURE_COLS)

        results.append({
            "match_id": fix["match_id"],
            "team_a": fix["team_a"],
            "team_b": fix["team_b"],
            "stage": stage,
            "match_date": fix["match_date"].strftime("%Y-%m-%d")
            if isinstance(fix["match_date"], datetime)
            else str(fix["match_date"]),
            "p_win": p_win,
            "p_draw": p_draw,
            "p_loss": p_loss,
            "shap_values": shap_vals,
        })
        logger.info(
            "%s vs %s — win: %.3f  draw: %.3f  loss: %.3f",
            fix["team_a"], fix["team_b"], p_win, p_draw, p_loss,
        )

    return results


def write_predictions(predictions: list[dict], stage: str) -> None:
    from config import NEXTJS_PREDICTIONS_DIR
    filename = f"sunless_predictions_{stage}.json"

    for out_dir in [PREDICTIONS_DIR, NEXTJS_PREDICTIONS_DIR]:
        path = out_dir / filename
        with open(path, "w", encoding="utf-8") as f:
            json.dump(predictions, f, indent=2, ensure_ascii=False)
        logger.info("Predictions written to %s", path)


def load_wc2026_fixtures(fd_matches: pd.DataFrame, stage: str) -> list[dict]:
    fd_stage = FD_STAGE_MAP.get(stage, "GROUP_STAGE")
    upcoming = fd_matches[
        (fd_matches["status"].isin(["TIMED", "SCHEDULED"]))
        & (fd_matches["stage"] == fd_stage)
    ].copy()

    if upcoming.empty:
        logger.warning(
            "No upcoming fixtures found for stage '%s' (fd_stage='%s'). "
            "Available stages: %s",
            stage, fd_stage, fd_matches["stage"].unique().tolist(),
        )
        return []

    fixtures: list[dict] = []
    for _, row in upcoming.iterrows():
        fixtures.append({
            "match_id": str(row["match_id"]),
            "team_a": row["team_home"],
            "team_b": row["team_away"],
            "match_date": pd.to_datetime(row["date"]).to_pydatetime(),
            "stage": stage,
        })
    return fixtures
