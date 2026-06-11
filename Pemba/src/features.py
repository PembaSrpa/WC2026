from __future__ import annotations

import logging
from datetime import datetime

import pandas as pd

from config import (
    DATA_PROCESSED,
    FEATURE_COLS,
    MIN_MATCH_DATE,
    STAGE_ENCODING,
    TOP_ELO_THRESHOLD,
)

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
    df = elo_data.get(team_a)
    if df is None:
        return None
    sub = _before(df, before_date)
    sub = sub[sub["opponent"] == team_b].dropna(subset=["result"]).head(n)
    if sub.empty:
        return None
    return float((sub["result"] == "W").sum()) / len(sub)


def _team_features(
    team: str,
    before_date: datetime,
    elo_data: dict[str, pd.DataFrame],
) -> dict[str, float | None]:
    df = elo_data.get(team)
    if df is None:
        return {
            "elo": None, "ppg_last5": None, "ppg_last10": None,
            "goals_scored_last5": None, "goals_scored_last10": None,
            "goals_conceded_last5": None, "goals_conceded_last10": None,
            "win_rate_vs_top": None, "defensive_solidity": None,
        }

    hist = _before(df, before_date)
    comp = _competitive(hist)
    two_years_ago = pd.Timestamp(before_date) - pd.DateOffset(years=2)
    comp_2yr = comp[comp["date"] >= two_years_ago]

    return {
        "elo": _latest_elo(hist),
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
    fa = _team_features(team_a, match_date, elo_data)
    fb = _team_features(team_b, match_date, elo_data)
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


def build_training_matrix(elo_data: dict[str, pd.DataFrame]) -> pd.DataFrame:
    rows: list[dict] = []

    for team, df in elo_data.items():
        comp = _competitive(df)
        comp = comp[comp["date"] >= MIN_MATCH_DATE]
        comp = comp.dropna(subset=["result", "goals_for", "goals_against"])

        for _, match in comp.iterrows():
            opponent = match["opponent"]
            if opponent not in elo_data:
                continue

            features = build_match_features(
                team_a=team,
                team_b=opponent,
                match_date=match["date"].to_pydatetime(),
                stage="GROUP_STAGE",
                elo_data=elo_data,
            )

            result = match["result"]
            row = {
                "team_a": team,
                "team_b": opponent,
                "date": match["date"],
                "result": result,
                "p_win": 1.0 if result == "W" else 0.0,
                "p_draw": 1.0 if result == "D" else 0.0,
                "p_loss": 1.0 if result == "L" else 0.0,
                **features,
            }
            rows.append(row)

    df_out = pd.DataFrame(rows).drop_duplicates(
        subset=["team_a", "team_b", "date"]
    ).reset_index(drop=True)

    out_path = DATA_PROCESSED / "training_matrix.csv"
    df_out.to_csv(out_path, index=False)
    logger.info("Training matrix: %d rows saved to %s", len(df_out), out_path)
    return df_out


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
        rows.append({
            "match_id": fix["match_id"],
            "team_a": fix["team_a"],
            "team_b": fix["team_b"],
            "stage": fix["stage"],
            "match_date": fix["match_date"],
            **features,
        })
    return pd.DataFrame(rows)
