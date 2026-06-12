"""
Feature engineering.

All features are computed "as of" a given date using only matches
strictly before that date (no leakage):

  - elo_a / elo_b / elo_diff   — Elo rating tracked match-by-match
  - form_*_a / form_*_b        — rolling win/draw rate + goals over the
                                  last FORM_WINDOW competitive games
  - h2h_*                       — head-to-head record between the two teams
  - stage_importance            — weight of the competition the match is in
  - neutral                     — 1 for World Cup fixtures (neutral venue)
"""

import logging

import numpy as np
import pandas as pd
import requests

from . import config

logger = logging.getLogger(__name__)


# ── Historical data loading ───────────────────────────────────────────────────

def download_results() -> None:
    if config.RESULTS_CSV.exists():
        logger.info("Using cached results: %s", config.RESULTS_CSV)
        return
    logger.info("Downloading match history from %s", config.RESULTS_URL)
    resp = requests.get(config.RESULTS_URL, timeout=30)
    resp.raise_for_status()
    config.RESULTS_CSV.write_bytes(resp.content)
    logger.info("Saved to %s", config.RESULTS_CSV)


def load_history() -> pd.DataFrame:
    """Download (if needed), filter to competitive matches since MIN_YEAR,
    and add the outcome label (0=loss / 1=draw / 2=win, from home team's POV)."""
    download_results()

    df = pd.read_csv(config.RESULTS_CSV, parse_dates=["date"])
    df = df[df["date"].dt.year >= config.MIN_YEAR].copy()
    df = df.sort_values("date").reset_index(drop=True)
    df = df[df["tournament"].isin(config.COMPETITIVE_TOURNAMENTS)].copy()
    logger.info("%d competitive matches loaded (%d-present)", len(df), config.MIN_YEAR)

    conditions = [
        df["home_score"] > df["away_score"],
        df["home_score"] == df["away_score"],
        df["home_score"] < df["away_score"],
    ]
    df["outcome"] = np.select(conditions, [2, 1, 0])
    return df


# ── Elo ────────────────────────────────────────────────────────────────────────

def compute_elo_history(df: pd.DataFrame, k: int = 32, base: int = 1500) -> dict:
    """Returns {team: [(date, elo_after_match), ...]} across the whole history."""
    elo = {}
    history = {}

    def get_elo(team):
        return elo.get(team, base)

    def expected(ra, rb):
        return 1 / (1 + 10 ** ((rb - ra) / 400))

    for _, row in df.iterrows():
        home, away = row["home_team"], row["away_team"]
        ra, rb = get_elo(home), get_elo(away)
        ea, eb = expected(ra, rb), expected(rb, ra)

        if row["outcome"] == 2:
            sa, sb = 1, 0
        elif row["outcome"] == 1:
            sa, sb = 0.5, 0.5
        else:
            sa, sb = 0, 1

        elo[home] = ra + k * (sa - ea)
        elo[away] = rb + k * (sb - eb)

        for team, val in [(home, elo[home]), (away, elo[away])]:
            history.setdefault(team, []).append((row["date"], val))

    return history


def elo_at(elo_history: dict, team: str, date, base: int = 1500) -> float:
    hist = elo_history.get(team, [])
    past = [(d, e) for d, e in hist if d < date]
    return past[-1][1] if past else base


# ── Rolling form & head-to-head ─────────────────────────────────────────────────

def rolling_form(df: pd.DataFrame, team: str, before_date, window: int = config.FORM_WINDOW) -> dict:
    """Win rate, draw rate, goals scored/conceded over the last `window` games."""
    mask_home = (df["home_team"] == team) & (df["date"] < before_date)
    mask_away = (df["away_team"] == team) & (df["date"] < before_date)

    home_games = df[mask_home].tail(window)
    away_games = df[mask_away].tail(window)

    outs, gf, ga, dates = [], [], [], []

    for _, r in home_games.iterrows():
        outs.append(r["outcome"])
        gf.append(r["home_score"])
        ga.append(r["away_score"])
        dates.append(r["date"])

    for _, r in away_games.iterrows():
        flipped = {2: 0, 1: 1, 0: 2}[r["outcome"]]
        outs.append(flipped)
        gf.append(r["away_score"])
        ga.append(r["home_score"])
        dates.append(r["date"])

    combined = sorted(zip(dates, outs, gf, ga))[-window:]

    if not combined:
        return {"win_rate": 0.45, "draw_rate": 0.22, "avg_gf": 1.2, "avg_ga": 1.3, "games": 0}

    _, outs, gf, ga = zip(*combined)
    n = len(outs)
    return {
        "win_rate": sum(o == 2 for o in outs) / n,
        "draw_rate": sum(o == 1 for o in outs) / n,
        "avg_gf": sum(gf) / n,
        "avg_ga": sum(ga) / n,
        "games": n,
    }


def head_to_head(df: pd.DataFrame, team_a: str, team_b: str, before_date, last_n: int = 10) -> dict:
    mask = (
        ((df["home_team"] == team_a) & (df["away_team"] == team_b)) |
        ((df["home_team"] == team_b) & (df["away_team"] == team_a))
    ) & (df["date"] < before_date)

    h2h = df[mask].tail(last_n)
    if len(h2h) == 0:
        return {"h2h_win_rate": 0.5, "h2h_draw_rate": 0.2, "h2h_games": 0}

    wins, draws = 0, 0
    for _, r in h2h.iterrows():
        if r["home_team"] == team_a:
            if r["outcome"] == 2:
                wins += 1
            elif r["outcome"] == 1:
                draws += 1
        else:
            if r["outcome"] == 0:
                wins += 1
            elif r["outcome"] == 1:
                draws += 1

    n = len(h2h)
    return {"h2h_win_rate": wins / n, "h2h_draw_rate": draws / n, "h2h_games": n}


# ── Training matrix ────────────────────────────────────────────────────────────

def build_training_matrix(df: pd.DataFrame, elo_history: dict) -> pd.DataFrame:
    """One row per historical match, from the home team's (team_a) perspective."""
    logger.info("Engineering training features for %d matches...", len(df))
    rows = []

    for i, row in df.iterrows():
        if i % 2000 == 0:
            logger.info("  %d/%d", i, len(df))

        home, away, date, tournament = row["home_team"], row["away_team"], row["date"], row["tournament"]

        form_home = rolling_form(df, home, date)
        form_away = rolling_form(df, away, date)
        h2h = head_to_head(df, home, away, date)

        rows.append({
            "date": date,
            "team_a": home,
            "team_b": away,
            "elo_diff": elo_at(elo_history, home, date) - elo_at(elo_history, away, date),
            "elo_a": elo_at(elo_history, home, date),
            "elo_b": elo_at(elo_history, away, date),
            "form_win_a": form_home["win_rate"],
            "form_draw_a": form_home["draw_rate"],
            "form_gf_a": form_home["avg_gf"],
            "form_ga_a": form_home["avg_ga"],
            "form_win_b": form_away["win_rate"],
            "form_draw_b": form_away["draw_rate"],
            "form_gf_b": form_away["avg_gf"],
            "form_ga_b": form_away["avg_ga"],
            "h2h_win_rate": h2h["h2h_win_rate"],
            "h2h_draw_rate": h2h["h2h_draw_rate"],
            "h2h_games": h2h["h2h_games"],
            "stage_importance": config.STAGE_IMPORTANCE_MAP.get(tournament, 1),
            "neutral": int(row.get("neutral", True)),
            "outcome": row["outcome"],
        })

    return pd.DataFrame(rows)


# ── Single prediction row ────────────────────────────────────────────────────

def to_dataset_name(team: str) -> str:
    return config.TEAM_NAME_MAP.get(team, team)


def build_feature_row(df: pd.DataFrame, elo_history: dict, team_a: str, team_b: str, match_date) -> pd.DataFrame:
    a, b = to_dataset_name(team_a), to_dataset_name(team_b)

    form_a = rolling_form(df, a, match_date)
    form_b = rolling_form(df, b, match_date)
    h2h = head_to_head(df, a, b, match_date)

    elo_a = elo_at(elo_history, a, match_date)
    elo_b = elo_at(elo_history, b, match_date)

    row = {
        "elo_diff": elo_a - elo_b,
        "elo_a": elo_a,
        "elo_b": elo_b,
        "form_win_a": form_a["win_rate"],
        "form_draw_a": form_a["draw_rate"],
        "form_gf_a": form_a["avg_gf"],
        "form_ga_a": form_a["avg_ga"],
        "form_win_b": form_b["win_rate"],
        "form_draw_b": form_b["draw_rate"],
        "form_gf_b": form_b["avg_gf"],
        "form_ga_b": form_b["avg_ga"],
        "h2h_win_rate": h2h["h2h_win_rate"],
        "h2h_draw_rate": h2h["h2h_draw_rate"],
        "h2h_games": h2h["h2h_games"],
        "stage_importance": config.WC2026_STAGE_IMPORTANCE,
        "neutral": config.NEUTRAL,
    }
    return pd.DataFrame([row])[config.FEATURE_COLS]
