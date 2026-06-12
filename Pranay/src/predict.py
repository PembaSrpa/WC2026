"""
Prediction pipeline.

  1. load_wc2026_fixtures()  — read App/public/fixtures/wc2026_fixtures.json
                                (or the local copy in data/fixtures/), filter
                                to the requested stage + not-yet-played matches.
  2. predict_fixtures()      — build live Elo/form/H2H features for each
                                fixture, run the 3 binary models, normalize
                                p_win/p_draw/p_loss to sum to 1.0, attach SHAP
                                values for each model's contribution.
  3. write_predictions()     — write frank_predictions_{stage}.json to this
                                project's predictions/ AND to the Next.js
                                app's public/predictions/ folder.
"""

import json
import logging
from pathlib import Path

import pandas as pd

from . import config
from . import features
from .train import TARGETS

logger = logging.getLogger(__name__)


def _fixtures_path() -> Path:
    local = config.DATA_FIXTURES / "wc2026_fixtures.json"
    if local.exists():
        return local
    return config.NEXTJS_FIXTURES_DIR / "wc2026_fixtures.json"


def load_wc2026_fixtures(stage: str) -> list:
    """Return matches for `stage` that haven't been played yet, with team
    names already resolved (skips bracket slots that aren't decided yet)."""
    path = _fixtures_path()
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    fd_stage = {v: k for k, v in config.FD_STAGE_MAP.items()}[stage]

    fixtures = []
    for m in data["matches"]:
        if m["stage"] != fd_stage:
            continue
        if m["status"] not in ("TIMED", "SCHEDULED"):
            continue
        if not m["team_home"] or not m["team_away"]:
            continue
        fixtures.append({
            "match_id": str(m["match_id"]),
            "team_a": m["team_home"],
            "team_b": m["team_away"],
            "stage": stage,
            "match_date": m["date"],
        })

    return fixtures


def predict_fixtures(fixtures: list, df: pd.DataFrame, elo_history: dict,
                      models: dict, explainers: dict, stage: str) -> list:
    predictions = []

    for fx in fixtures:
        match_date = pd.Timestamp(fx["match_date"])
        X = features.build_feature_row(df, elo_history, fx["team_a"], fx["team_b"], match_date)

        raw = {name: float(models[name].predict_proba(X)[0, 1]) for name in TARGETS}
        total = sum(raw.values())

        p_win = round(raw["p_win"] / total, 4)
        p_draw = round(raw["p_draw"] / total, 4)
        p_loss = round(1.0 - p_win - p_draw, 4)  # force exact sum = 1.0

        # SHAP values from the p_win model explain what's driving team_a's
        # win probability for this matchup.
        shap_values = {}
        try:
            sv = explainers["p_win"].shap_values(X)
            row_sv = sv[0]
            shap_values = {col: round(float(val), 4) for col, val in zip(config.FEATURE_COLS, row_sv)}
        except Exception as exc:
            logger.warning("SHAP unavailable for %s vs %s: %s", fx["team_a"], fx["team_b"], exc)

        predictions.append({
            "match_id": fx["match_id"],
            "team_a": fx["team_a"],
            "team_b": fx["team_b"],
            "stage": stage,
            "match_date": fx["match_date"],
            "p_win": p_win,
            "p_draw": p_draw,
            "p_loss": p_loss,
            "model": config.MODEL_NAME,
            "shap_values": shap_values,
        })

        logger.info("%-22s vs %-22s | win=%.2f draw=%.2f loss=%.2f",
                     fx["team_a"], fx["team_b"], p_win, p_draw, p_loss)

    return predictions


def write_predictions(predictions: list, stage: str) -> None:
    filename = f"{config.MODEL_NAME}_predictions_{stage}.json"

    for out_dir in (config.PREDICTIONS_DIR, config.NEXTJS_PREDICTIONS_DIR):
        out_path = out_dir / filename
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(predictions, f, indent=2, ensure_ascii=False)
        logger.info("Wrote %s (%d matches)", out_path, len(predictions))
