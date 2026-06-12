"""
Step 3 — Generate Predictions for WC2026 frontend
Loads the trained model, computes live Elo/form/H2H features from the
historical results dataset, and writes one JSON file per stage in the
exact `frank_predictions_{stage}.json` format required by the webapp:

  {
    "match_id": "537333",
    "team_a": "Canada",
    "team_b": "Bosnia-Herzegovina",
    "stage": "group",
    "match_date": "2026-06-13",
    "p_win": 0.5123,
    "p_draw": 0.2456,
    "p_loss": 0.2421,
    "model": "frank",
    "shap_values": {...}
  }

Run after: python 2_train_model.py
"""

import json
import pickle
import os
import numpy as np
import pandas as pd
import shap

from importlib import import_module

# Re-use the feature-engineering helpers from step 1 so the live
# Elo / rolling-form / head-to-head numbers are computed exactly the
# same way they were during training.
build_dataset = import_module("1_build_dataset")

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_PATH    = "model/model.pkl"
RESULTS_PATH  = "data/results.csv"
FIXTURES_PATH = "../WC2026-main/App/public/fixtures/wc2026_fixtures.json"
OUTPUT_DIR    = "../WC2026-main/App/public/predictions"
MODEL_NAME    = "frank"

# football-data.org stage  ->  spec stage
STAGE_MAP = {
    "GROUP_STAGE":     "group",
    "LAST_32":         "r32",
    "LAST_16":         "r16",
    "QUARTER_FINALS":  "qf",
    "SEMI_FINALS":     "sf",
    "FINAL":           "final",
}

# Team names differ slightly between the historical results dataset
# (martj42/international_results) and football-data.org. Map the
# fixtures-file name -> results-dataset name where they diverge.
NAME_MAP = {
    "Bosnia-Herzegovina": "Bosnia and Herzegovina",
    "Cape Verde Islands": "Cape Verde",
    "Congo DR":           "DR Congo",
    "Czechia":            "Czech Republic",
}

DEFAULT_FORM = {"win_rate": 0.45, "draw_rate": 0.22, "avg_gf": 1.2, "avg_ga": 1.3, "games": 0}
DEFAULT_H2H  = {"h2h_win_rate": 0.5, "h2h_draw_rate": 0.2, "h2h_games": 0}

# WC2026 is itself "FIFA World Cup" -> stage_importance 3 (per step-1 stage_map)
STAGE_IMPORTANCE = 3
NEUTRAL = 1
# ─────────────────────────────────────────────────────────────────────────────


def to_dataset_name(team: str) -> str:
    return NAME_MAP.get(team, team)


def load_model():
    with open(MODEL_PATH, "rb") as f:
        bundle = pickle.load(f)
    return bundle["pipeline"], bundle["feature_cols"]


def load_history():
    """Load + filter the historical match dataset exactly like step 1."""
    df = build_dataset.load_and_filter(RESULTS_PATH)
    df = build_dataset.add_outcome(df)
    _, elo_history = build_dataset.compute_elo(df)
    return df, elo_history


def get_elo_at(elo_history: dict, team: str, date) -> float:
    hist = elo_history.get(team, [])
    past = [(d, e) for d, e in hist if d < date]
    return past[-1][1] if past else 1500


def build_feature_row(df, elo_history, team_a, team_b, match_date, feature_cols):
    a_name = to_dataset_name(team_a)
    b_name = to_dataset_name(team_b)

    form_a = build_dataset.rolling_form(df, a_name, match_date, build_dataset.FORM_WINDOW)
    form_b = build_dataset.rolling_form(df, b_name, match_date, build_dataset.FORM_WINDOW)
    h2h    = build_dataset.head_to_head(df, a_name, b_name, match_date)

    elo_a = get_elo_at(elo_history, a_name, match_date)
    elo_b = get_elo_at(elo_history, b_name, match_date)

    row = {
        "elo_diff":         elo_a - elo_b,
        "elo_a":            elo_a,
        "elo_b":            elo_b,
        "form_win_a":       form_a["win_rate"],
        "form_draw_a":      form_a["draw_rate"],
        "form_gf_a":        form_a["avg_gf"],
        "form_ga_a":        form_a["avg_ga"],
        "form_win_b":       form_b["win_rate"],
        "form_draw_b":      form_b["draw_rate"],
        "form_gf_b":        form_b["avg_gf"],
        "form_ga_b":        form_b["avg_ga"],
        "h2h_win_rate":     h2h["h2h_win_rate"],
        "h2h_draw_rate":    h2h["h2h_draw_rate"],
        "h2h_games":        h2h["h2h_games"],
        "stage_importance": STAGE_IMPORTANCE,
        "neutral":          NEUTRAL,
    }
    return pd.DataFrame([row])[feature_cols]


def predict_match(X, pipeline, explainer, feature_cols):
    scaler = pipeline.named_steps["scaler"]
    model  = pipeline.named_steps["model"]

    X_scaled = scaler.transform(X)
    proba = model.predict_proba(X_scaled)[0]

    class_order = list(model.classes_)
    p = {c: proba[i] for i, c in enumerate(class_order)}

    raw_win  = p.get(2, 0.0)
    raw_draw = p.get(1, 0.0)
    raw_loss = p.get(0, 0.0)
    total    = raw_win + raw_draw + raw_loss

    p_win  = round(float(raw_win  / total), 4)
    p_draw = round(float(raw_draw / total), 4)
    p_loss = round(float(1.0 - p_win - p_draw), 4)  # force exact sum = 1.0

    # SHAP values explaining the "win" class for this prediction
    shap_values = {}
    try:
        sv = explainer.shap_values(X_scaled)
        # sv shape: (n_samples, n_features, n_classes) for multiclass XGBoost
        win_class_idx = class_order.index(2)
        if isinstance(sv, list):
            row_sv = sv[win_class_idx][0]
        elif sv.ndim == 3:
            row_sv = sv[0, :, win_class_idx]
        else:
            row_sv = sv[0]
        shap_values = {
            col: round(float(val), 4)
            for col, val in zip(feature_cols, row_sv)
        }
    except Exception as e:
        print(f"  (shap unavailable: {e})")
        shap_values = {}

    return p_win, p_draw, p_loss, shap_values


def main():
    pipeline, feature_cols = load_model()
    print("Model loaded")

    df, elo_history = load_history()
    print(f"History loaded ({len(df):,} competitive matches)")

    explainer = shap.TreeExplainer(pipeline.named_steps["model"])

    with open(FIXTURES_PATH) as f:
        fixtures_data = json.load(f)
    matches = fixtures_data["matches"]
    print(f"{len(matches)} fixtures loaded")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Group predictions by spec-stage so every stage gets its own file,
    # even if empty (matches the existing stub files in the repo).
    predictions_by_stage = {stage: [] for stage in STAGE_MAP.values()}

    for m in matches:
        stage = STAGE_MAP.get(m["stage"])
        if stage is None:
            continue  # e.g. THIRD_PLACE, not in spec

        if m["status"] not in ("TIMED", "SCHEDULED"):
            continue

        team_a, team_b = m["team_home"], m["team_away"]
        if not team_a or not team_b:
            continue  # bracket slot not yet determined

        match_date = pd.Timestamp(m["date"])

        X = build_feature_row(df, elo_history, team_a, team_b, match_date, feature_cols)
        p_win, p_draw, p_loss, shap_values = predict_match(X, pipeline, explainer, feature_cols)

        predictions_by_stage[stage].append({
            "match_id":    m["match_id"],
            "team_a":      team_a,
            "team_b":      team_b,
            "stage":       stage,
            "match_date":  m["date"],
            "p_win":       p_win,
            "p_draw":      p_draw,
            "p_loss":      p_loss,
            "model":       MODEL_NAME,
            "shap_values": shap_values,
        })

        print(f"  {team_a:20s} vs {team_b:20s} | win={p_win:.2f} draw={p_draw:.2f} loss={p_loss:.2f}")

    for stage, preds in predictions_by_stage.items():
        out_path = os.path.join(OUTPUT_DIR, f"{MODEL_NAME}_predictions_{stage}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(preds, f, indent=2, ensure_ascii=False)
        print(f"Wrote {out_path}  ({len(preds)} matches)")


if __name__ == "__main__":
    main()
