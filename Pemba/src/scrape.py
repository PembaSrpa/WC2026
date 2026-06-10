from __future__ import annotations

import io
import logging
import time
from pathlib import Path

import pandas as pd
import requests

from config import (
    DATA_RAW,
    ELO_BASE_URL,
    ELO_HEADERS,
    FD_API_KEY,
    FD_BASE_URL,
    FD_COMPETITIONS,
    FD_SEASONS,
    WC2026_TEAMS,
)

logger = logging.getLogger(__name__)


def fetch_elo_tsv(team: str, delay: float = 1.5) -> pd.DataFrame:
    slug = team.replace(" ", "_")
    cache_path = DATA_RAW / f"elo_{slug}.tsv"

    if cache_path.exists():
        logger.info("Elo cache hit: %s", team)
        df = pd.read_csv(cache_path, sep="\t", header=None, encoding="utf-8")
    else:
        url = f"{ELO_BASE_URL}/{team.replace(' ', '_')}.tsv"
        try:
            resp = requests.get(url, headers=ELO_HEADERS, timeout=15)
            resp.raise_for_status()
            time.sleep(delay)
            df = pd.read_csv(
                io.StringIO(resp.content.decode("utf-8")),
                sep="\t",
                header=None,
            )
            df.to_csv(cache_path, sep="\t", index=False, header=False)
            logger.info("Fetched Elo TSV: %s (%d rows)", team, len(df))
        except Exception as exc:
            logger.warning("Failed to fetch Elo TSV for %s: %s", team, exc)
            return pd.DataFrame()

    df.columns = [
        "year", "month", "day", "team_home", "team_away",
        "goals_home", "goals_away", "tournament_code", "col8",
        "elo_change", "elo_home_after", "elo_away_after",
        "rank_change_home", "rank_change_away", "rank_home", "rank_away",
    ]
    df = df.drop(columns=["col8"], errors="ignore")

    df["date"] = pd.to_datetime(
        df[["year", "month", "day"]].rename(
            columns={"year": "year", "month": "month", "day": "day"}
        ),
        errors="coerce",
    )
    df = df.dropna(subset=["date"])

    for col in ["goals_home", "goals_away", "elo_home_after", "elo_away_after"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["team"] = team
    df["is_home"] = df["team_home"] == team
    df["goals_for"] = df.apply(
        lambda r: r["goals_home"] if r["is_home"] else r["goals_away"], axis=1
    )
    df["goals_against"] = df.apply(
        lambda r: r["goals_away"] if r["is_home"] else r["goals_home"], axis=1
    )
    df["elo_team"] = df.apply(
        lambda r: r["elo_home_after"] - r["elo_change"] if r["is_home"]
        else r["elo_away_after"] + r["elo_change"], axis=1
    )
    df["elo_opponent"] = df.apply(
        lambda r: r["elo_away_after"] if r["is_home"] else r["elo_home_after"], axis=1
    )
    df["opponent"] = df.apply(
        lambda r: r["team_away"] if r["is_home"] else r["team_home"], axis=1
    )
    df["result"] = df.apply(
        lambda r: "W" if r["goals_for"] > r["goals_against"]
        else ("D" if r["goals_for"] == r["goals_against"] else "L")
        if pd.notna(r["goals_for"]) and pd.notna(r["goals_against"]) else None,
        axis=1,
    )
    df["is_friendly"] = df["tournament_code"].isin({"F", "FR"})

    return df.sort_values("date", ascending=False).reset_index(drop=True)


def fetch_all_elo(teams: list[str] | None = None, delay: float = 1.5) -> dict[str, pd.DataFrame]:
    teams = teams or WC2026_TEAMS
    result: dict[str, pd.DataFrame] = {}
    for team in teams:
        df = fetch_elo_tsv(team, delay=delay)
        if not df.empty:
            result[team] = df
    logger.info("Fetched Elo data for %d/%d teams", len(result), len(teams))
    return result


def fetch_fd_matches(competition: str, season: int) -> pd.DataFrame:
    cache_path = DATA_RAW / f"fd_{competition}_{season}.json"
    if cache_path.exists():
        logger.info("FD cache hit: %s %s", competition, season)
        return pd.read_json(cache_path)

    comp_id = FD_COMPETITIONS.get(competition)
    if not comp_id:
        logger.error("Unknown competition: %s", competition)
        return pd.DataFrame()

    url = f"{FD_BASE_URL}/competitions/{competition}/matches"
    headers = {"X-Auth-Token": FD_API_KEY}
    params = {"season": season}

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        matches = data.get("matches", [])
        if not matches:
            return pd.DataFrame()

        rows: list[dict] = []
        for m in matches:
            score = m.get("score", {})
            full = score.get("fullTime", {})
            odds = m.get("odds", {})
            rows.append({
                "match_id": m["id"],
                "date": m["utcDate"][:10],
                "competition": competition,
                "season": season,
                "stage": m.get("stage", ""),
                "group": m.get("group", ""),
                "team_home": m["homeTeam"]["name"],
                "team_away": m["awayTeam"]["name"],
                "goals_home": full.get("home"),
                "goals_away": full.get("away"),
                "status": m.get("status", ""),
                "odds_home_win": odds.get("homeWin"),
                "odds_draw": odds.get("draw"),
                "odds_away_win": odds.get("awayWin"),
            })

        df = pd.DataFrame(rows)
        df.to_json(cache_path, orient="records")
        logger.info("Fetched %d matches: %s %s", len(df), competition, season)
        return df

    except Exception as exc:
        logger.error("Failed to fetch %s %s: %s", competition, season, exc)
        return pd.DataFrame()


def fetch_all_fd_matches() -> pd.DataFrame:
    frames: list[pd.DataFrame] = []
    for comp, seasons in FD_SEASONS.items():
        for season in seasons:
            df = fetch_fd_matches(comp, season)
            if not df.empty:
                frames.append(df)
            time.sleep(0.5)

    if not frames:
        return pd.DataFrame()

    combined = pd.concat(frames, ignore_index=True)
    combined["date"] = pd.to_datetime(combined["date"])
    combined = combined.sort_values("date").reset_index(drop=True)
    logger.info("Total FD matches: %d", len(combined))
    return combined


def normalize_odds(row: pd.Series) -> tuple[float | None, float | None, float | None]:
    try:
        w = float(row["odds_home_win"])
        d = float(row["odds_draw"])
        l = float(row["odds_away_win"])
        if w <= 0 or d <= 0 or l <= 0:
            return None, None, None
        rw, rd, rl = 1.0 / w, 1.0 / d, 1.0 / l
        total = rw + rd + rl
        return rw / total, rd / total, rl / total
    except (TypeError, ValueError, ZeroDivisionError):
        return None, None, None


def refresh_cache(teams: list[str] | None = None) -> None:
    logger.info("Refreshing Elo cache")
    fetch_all_elo(teams)
    logger.info("Refreshing football-data.org cache")
    fetch_all_fd_matches()
