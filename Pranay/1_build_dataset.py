"""
Step 1 — Build Dataset
Fetches international match history from a public CSV and engineers
features used for training the prediction model.

Data source: https://github.com/martj42/international_results
(~50k international matches from 1872 onward)
"""

import pandas as pd
import numpy as np
import requests
import os

# ── Config ────────────────────────────────────────────────────────────────────
DATA_URL = "https://raw.githubusercontent.com/martj42/international_results/master/results.csv"
RAW_PATH  = "data/results.csv"
OUT_PATH  = "data/features.csv"
FORM_WINDOW = 10        # last N games for rolling form
MIN_YEAR    = 2000      # ignore very old matches (football changed a lot)
# ─────────────────────────────────────────────────────────────────────────────


def download_data():
    if os.path.exists(RAW_PATH):
        print("✓ Raw data already downloaded.")
        return
    print("Downloading match history...")
    r = requests.get(DATA_URL, timeout=30)
    r.raise_for_status()
    with open(RAW_PATH, "wb") as f:
        f.write(r.content)
    print(f"✓ Saved to {RAW_PATH}")


def load_and_filter(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=["date"])
    df = df[df["date"].dt.year >= MIN_YEAR].copy()
    df = df.sort_values("date").reset_index(drop=True)
    # Only keep competitive matches (World Cup, qualifiers, continental cups)
    competitive = ["FIFA World Cup", "FIFA World Cup qualification",
                   "UEFA Euro", "Copa América", "AFC Asian Cup",
                   "Africa Cup of Nations", "CONCACAF Gold Cup",
                   "Confederations Cup"]
    df = df[df["tournament"].isin(competitive)].copy()
    print(f"✓ {len(df):,} competitive matches loaded ({MIN_YEAR}–present)")
    return df


def add_outcome(df: pd.DataFrame) -> pd.DataFrame:
    """Outcome from home_team perspective: 0=loss, 1=draw, 2=win"""
    conditions = [
        df["home_score"] > df["away_score"],
        df["home_score"] == df["away_score"],
        df["home_score"] < df["away_score"],
    ]
    df["outcome"] = np.select(conditions, [2, 1, 0])
    return df


def compute_elo(df: pd.DataFrame, k: int = 32, base: int = 1500) -> dict:
    """
    Simple Elo tracker. Returns dict of {team: elo} computed from the
    full match history. Used as a feature signal.
    """
    elo = {}
    history = {}  # team -> list of (date, elo)

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
            if team not in history:
                history[team] = []
            history[team].append((row["date"], val))

    return elo, history


def rolling_form(df: pd.DataFrame, team: str, before_date, window: int) -> dict:
    """Win rate, draw rate, goals scored/conceded over last N games."""
    mask_home = (df["home_team"] == team) & (df["date"] < before_date)
    mask_away = (df["away_team"] == team) & (df["date"] < before_date)

    home_games = df[mask_home].tail(window)
    away_games = df[mask_away].tail(window)

    all_outcomes = []
    goals_for = []
    goals_against = []

    for _, r in home_games.iterrows():
        all_outcomes.append(r["outcome"])   # 2=win 1=draw 0=loss
        goals_for.append(r["home_score"])
        goals_against.append(r["away_score"])

    for _, r in away_games.iterrows():
        # flip outcome for away team
        flipped = {2: 0, 1: 1, 0: 2}[r["outcome"]]
        all_outcomes.append(flipped)
        goals_for.append(r["away_score"])
        goals_against.append(r["home_score"])

    # take the most recent `window` games across home+away
    combined = sorted(
        zip(
            list(home_games["date"]) + list(away_games["date"]),
            all_outcomes,
            goals_for,
            goals_against,
        )
    )[-window:]

    if not combined:
        return {"win_rate": 0.5, "draw_rate": 0.2, "avg_gf": 1.2, "avg_ga": 1.2, "games": 0}

    _, outs, gf, ga = zip(*combined)
    n = len(outs)
    return {
        "win_rate":  sum(o == 2 for o in outs) / n,
        "draw_rate": sum(o == 1 for o in outs) / n,
        "avg_gf":    sum(gf) / n,
        "avg_ga":    sum(ga) / n,
        "games":     n,
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
            if r["outcome"] == 2: wins += 1
            elif r["outcome"] == 1: draws += 1
        else:
            if r["outcome"] == 0: wins += 1
            elif r["outcome"] == 1: draws += 1

    n = len(h2h)
    return {
        "h2h_win_rate":  wins / n,
        "h2h_draw_rate": draws / n,
        "h2h_games":     n,
    }


def build_features(df: pd.DataFrame, elo_history: dict) -> pd.DataFrame:
    """
    For every match, build a row of features from team_a's perspective.
    Label: outcome (0=loss, 1=draw, 2=win) from team_a's POV.
    """
    print("Engineering features (this takes ~1–2 min)...")
    rows = []

    # Build a quick elo lookup: (team, date) -> elo at that point
    def get_elo_at(team, date):
        hist = elo_history.get(team, [])
        # most recent elo before this date
        past = [(d, e) for d, e in hist if d < date]
        return past[-1][1] if past else 1500

    for i, row in df.iterrows():
        if i % 2000 == 0:
            print(f"  {i}/{len(df)}")

        home, away, date = row["home_team"], row["away_team"], row["date"]

        # outcome from home team's perspective (home = team_a)
        label = row["outcome"]

        form_home = rolling_form(df, home, date, FORM_WINDOW)
        form_away = rolling_form(df, away, date, FORM_WINDOW)
        h2h       = head_to_head(df, home, away, date)

        elo_home = get_elo_at(home, date)
        elo_away = get_elo_at(away, date)

        stage_map = {
            "FIFA World Cup": 3,
            "FIFA World Cup qualification": 1,
            "UEFA Euro": 2, "Copa América": 2,
            "AFC Asian Cup": 2, "Africa Cup of Nations": 2,
            "CONCACAF Gold Cup": 2, "Confederations Cup": 2,
        }

        rows.append({
            # identifiers (not fed to model)
            "date":   date,
            "team_a": home,
            "team_b": away,
            # features
            "elo_diff":        elo_home - elo_away,
            "elo_a":           elo_home,
            "elo_b":           elo_away,
            "form_win_a":      form_home["win_rate"],
            "form_draw_a":     form_home["draw_rate"],
            "form_gf_a":       form_home["avg_gf"],
            "form_ga_a":       form_home["avg_ga"],
            "form_win_b":      form_away["win_rate"],
            "form_draw_b":     form_away["draw_rate"],
            "form_gf_b":       form_away["avg_gf"],
            "form_ga_b":       form_away["avg_ga"],
            "h2h_win_rate":    h2h["h2h_win_rate"],
            "h2h_draw_rate":   h2h["h2h_draw_rate"],
            "h2h_games":       h2h["h2h_games"],
            "stage_importance": stage_map.get(row["tournament"], 1),
            "neutral":         int(row.get("neutral", True)),
            # label
            "outcome": label,
        })

    return pd.DataFrame(rows)


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    download_data()
    df = load_and_filter(RAW_PATH)
    df = add_outcome(df)
    _, elo_history = compute_elo(df)
    features = build_features(df, elo_history)
    features.to_csv(OUT_PATH, index=False)
    print(f"\n✓ Features saved → {OUT_PATH}  ({len(features):,} rows)")
    print(features.head())
