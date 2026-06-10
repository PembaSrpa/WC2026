from __future__ import annotations

import logging
from datetime import datetime

import numpy as np
import pandas as pd

from config import (
    DATA_PROCESSED,
    FEATURE_COLS,
    MIN_MATCH_DATE,
    STAGE_ENCODING,
    TARGETS,
    TOP_ELO_THRESHOLD,
)
from scrape import fetch_all_elo, fetch_all_fd_matches, normalize_odds

logger = logging.getLogger(__name__)


def _competitive(df: pd.DataFrame) -> pd.DataFrame:
    return df[~df["is_friendly"]].copy()


def _before(df: pd.DataFrame, date: datetime) -> pd.DataFrame:
    return df[df["date"] < pd.Timestamp(date)].copy()


def _ppg(df: pd.DataFrame, n: int) -> float | None:
    sub = df.dropna(subset=["result"]).head(n)
    if sub.empty:
        return None
    return float(sub["result"].map({"W": 3.0, "D": 1.0, "L": 0.0}).mean())


def _avg(df: pd.DataFrame, col: str, n: int) -> float | None:
    vals = df[col].dropna().head(n)
    return float(vals.mean()) if not vals.empty else None


def _win_rate_vs_top(df: pd.DataFrame) -> float | None:
    sub = df[df["elo_opponent"].notna() & (df["elo_opponent"] >= TOP_ELO_THRESHOLD)]
    sub = sub.dropna(subset=["result"])
    if sub.empty:
        return None
    return float((sub["result"] == "W").sum()) / len(sub)


def _defensive_solidity(df: pd.DataFrame) -> float | None:
    sub = df[df["elo_opponent"].notna() & (df["elo_opponent"] >= TOP_ELO_THRESHOLD)]
    vals = sub["goals_against"].dropna()
    return float(vals.mean()) if not vals.empty else None


def _latest_elo(df: pd.DataFrame) -> float | None:
    vals = df["elo_team"].dropna()
    return float(vals.iloc[0]) if not vals.empty else None


def _h2h(
    elo_data: dict[str, pd.DataFrame],
    team_a: str,
    team_b: str,
    before_date: datetime,
    n: int = 5,
) -> float | None:
    df_a = elo_data.get(team_a)
    if df_a is None:
        return None
    sub = _before(df_a, before_date)
    sub = sub[sub["opponent"] == team_b].head(n)
    if sub.empty:
        return None
    sub = sub.dropna(subset=["result"])
    if sub.empty:
        return None
    wins = (sub["result"] == "W").sum()
    return float(wins) / len(sub)


def build_team_features(
    team: str,
    before_date: datetime,
    elo_data: dict[str, pd.DataFrame],
) -> dict[str, float | None]:
    df = elo_data.get(team)
    if df is None:
        return {col: None for col in [
            "elo", "ppg_last5", "ppg_last10",
            "goals_scored_last5", "goals_scored_last10",
            "goals_conceded_last5", "goals_conceded_last10",
            "win_rate_vs_top", "defensive_solidity",
        ]}

    comp = _competitive(_before(df, before_date))
    two_years_ago = pd.Timestamp(before_date) - pd.DateOffset(years=2)
    comp_2yr = comp[comp["date"] >= two_years_ago]

    return {
        "elo": _latest_elo(_before(df, before_date)),
        "ppg_last5": _ppg(comp, 5),
        "ppg_last10": _ppg(comp, 10),
        "goals_scored_last5": _avg(comp, "goals_for", 5),
        "goals_scored_last10": _avg(comp, "goals_for", 10),
        "goals_conceded_last5": _avg(comp, "goals_against", 5),
        "goals_conceded_last10": _avg(comp, "goals_against", 10),
        "win_rate_vs_top": _win_rate_vs_top(comp_2yr),
        "defensive_solidity": _defensive_solidity(comp),
    }


def build_match_features(
    team_a: str,
    team_b: str,
    match_date: datetime,
    stage: str,
    elo_data: dict[str, pd.DataFrame],
) -> dict[str, float | None]:
    fa = build_team_features(team_a, match_date, elo_data)
    fb = build_team_features(team_b, match_date, elo_data)
    h2h = _h2h(elo_data, team_a, team_b, match_date)

    elo_a = fa["elo"]
    elo_b = fb["elo"]
    elo_diff = (elo_a - elo_b) if (elo_a is not None and elo_b is not None) else None

    return {
        "elo_diff": elo_diff,
        "elo_a": elo_a,
        "elo_b": elo_b,
        "ppg_last5_a": fa["ppg_last5"],
        "ppg_last5_b": fb["ppg_last5"],
        "ppg_last10_a": fa["ppg_last10"],
        "ppg_last10_b": fb["ppg_last10"],
        "goals_scored_last5_a": fa["goals_scored_last5"],
        "goals_scored_last5_b": fb["goals_scored_last5"],
        "goals_scored_last10_a": fa["goals_scored_last10"],
        "goals_scored_last10_b": fb["goals_scored_last10"],
        "goals_conceded_last5_a": fa["goals_conceded_last5"],
        "goals_conceded_last5_b": fb["goals_conceded_last5"],
        "goals_conceded_last10_a": fa["goals_conceded_last10"],
        "goals_conceded_last10_b": fb["goals_conceded_last10"],
        "win_rate_vs_top_a": fa["win_rate_vs_top"],
        "win_rate_vs_top_b": fb["win_rate_vs_top"],
        "defensive_solidity_a": fa["defensive_solidity"],
        "defensive_solidity_b": fb["defensive_solidity"],
        "h2h_win_rate_a": h2h,
        "stage_encoded": float(STAGE_ENCODING.get(stage, 1)),
    }


def build_training_matrix(
    elo_data: dict[str, pd.DataFrame],
    fd_matches: pd.DataFrame,
) -> pd.DataFrame:
    fd_matches = fd_matches.copy()
    fd_matches = fd_matches[fd_matches["status"] == "FINISHED"]
    fd_matches = fd_matches[fd_matches["date"] >= MIN_MATCH_DATE]
    fd_matches = fd_matches.dropna(subset=["goals_home", "goals_away"])
    fd_matches = fd_matches.dropna(subset=["odds_home_win", "odds_draw", "odds_away_win"])

    rows: list[dict] = []
    for _, match in fd_matches.iterrows():
        p_win, p_draw, p_loss = normalize_odds(match)
        if p_win is None:
            continue

        features = build_match_features(
            team_a=match["team_home"],
            team_b=match["team_away"],
            match_date=match["date"].to_pydatetime(),
            stage=match["stage"],
            elo_data=elo_data,
        )

        row = {
            "match_id": match["match_id"],
            "date": match["date"],
            "team_home": match["team_home"],
            "team_away": match["team_away"],
            "competition": match["competition"],
            "stage": match["stage"],
            "p_win": p_win,
            "p_draw": p_draw,
            "p_loss": p_loss,
            **features,
        }
        rows.append(row)

    df = pd.DataFrame(rows)
    out_path = DATA_PROCESSED / "training_matrix.csv"
    df.to_csv(out_path, index=False)
    logger.info("Training matrix: %d rows saved to %s", len(df), out_path)
    return df


def build_prediction_features(
    fixtures: list[dict],
    elo_data: dict[str, pd.DataFrame],
) -> pd.DataFrame:
    rows: list[dict] = []
    for fix in fixtures:
        features = build_match_features(
            team_a=fix["team_a"],
            team_b=fix["team_b"],
            match_date=fix["match_date"],
            stage=fix["stage"],
            elo_data=elo_data,
        )
        row = {
            "match_id": fix["match_id"],
            "team_a": fix["team_a"],
            "team_b": fix["team_b"],
            "stage": fix["stage"],
            "match_date": fix["match_date"],
            **features,
        }
        rows.append(row)
    return pd.DataFrame(rows)
