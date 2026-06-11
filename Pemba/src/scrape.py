from __future__ import annotations

import io
import logging
import time

import pandas as pd
import requests

from config import DATA_RAW, ELO_BASE_URL, ELO_HEADERS, FD_API_KEY, FD_BASE_URL, WC2026_TEAMS
from team_codes import CODE_TO_NAME

logger = logging.getLogger(__name__)


def _code_to_name(code: str) -> str:
    return CODE_TO_NAME.get(str(code).strip(), code)


def fetch_elo_tsv(team: str, delay: float = 1.5, force: bool = False) -> pd.DataFrame:
    slug = team.replace(" ", "_")
    cache_path = DATA_RAW / f"elo_{slug}.tsv"

    if cache_path.exists() and not force:
        logger.info("Elo cache hit: %s", team)
        raw = pd.read_csv(cache_path, sep="\t", header=None, encoding="utf-8")
    else:
        url = f"{ELO_BASE_URL}/{team.replace(' ', '_')}.tsv"
        try:
            resp = requests.get(url, headers=ELO_HEADERS, timeout=15)
            resp.raise_for_status()
            time.sleep(delay)
            raw = pd.read_csv(
                io.StringIO(resp.content.decode("utf-8")),
                sep="\t",
                header=None,
            )
            raw.to_csv(cache_path, sep="\t", index=False, header=False)
            logger.info("Fetched Elo TSV: %s (%d rows)", team, len(raw))
        except Exception as exc:
            logger.warning("Failed to fetch Elo TSV for %s: %s", team, exc)
            return pd.DataFrame()

    cols = [
        "year", "month", "day", "team_home", "team_away",
        "goals_home", "goals_away", "tournament_code", "col8",
        "elo_change", "elo_home_after", "elo_away_after",
        "rank_change_home", "rank_change_away", "rank_home", "rank_away",
    ]
    if len(raw.columns) >= len(cols):
        raw.columns = cols + [f"extra_{i}" for i in range(len(raw.columns) - len(cols))]
    else:
        raw.columns = cols[:len(raw.columns)]

    raw["date"] = pd.to_datetime(
        dict(year=raw["year"], month=raw["month"], day=raw["day"]),
        errors="coerce",
    )
    raw = raw.dropna(subset=["date"])

    for col in ["goals_home", "goals_away", "elo_home_after", "elo_away_after", "elo_change"]:
        if col in raw.columns:
            raw[col] = pd.to_numeric(raw[col], errors="coerce")

    raw["team_home_name"] = raw["team_home"].apply(_code_to_name)
    raw["team_away_name"] = raw["team_away"].apply(_code_to_name)

    raw["team"] = team
    raw["is_home"] = raw["team_home_name"] == team
    raw["goals_for"] = raw.apply(
        lambda r: r["goals_home"] if r["is_home"] else r["goals_away"], axis=1
    )
    raw["goals_against"] = raw.apply(
        lambda r: r["goals_away"] if r["is_home"] else r["goals_home"], axis=1
    )
    raw["elo_team"] = raw.apply(
        lambda r: r["elo_home_after"] - r["elo_change"]
        if r["is_home"] else r["elo_away_after"] + r["elo_change"],
        axis=1,
    )
    raw["elo_opponent"] = raw.apply(
        lambda r: r["elo_away_after"] if r["is_home"] else r["elo_home_after"], axis=1
    )
    raw["opponent"] = raw.apply(
        lambda r: r["team_away_name"] if r["is_home"] else r["team_home_name"], axis=1
    )
    raw["result"] = raw.apply(
        lambda r: "W" if r["goals_for"] > r["goals_against"]
        else ("D" if r["goals_for"] == r["goals_against"] else "L")
        if pd.notna(r["goals_for"]) and pd.notna(r["goals_against"]) else None,
        axis=1,
    )
    raw["is_friendly"] = raw["tournament_code"].isin({"F", "FR", "FT"})

    return raw.sort_values("date", ascending=False).reset_index(drop=True)


def fetch_all_elo(teams: list[str] | None = None, force: bool = False) -> dict[str, pd.DataFrame]:
    teams = teams or WC2026_TEAMS
    result: dict[str, pd.DataFrame] = {}
    for team in teams:
        df = fetch_elo_tsv(team, force=force)
        if not df.empty:
            result[team] = df
    logger.info("Elo data loaded for %d/%d teams", len(result), len(teams))
    return result


def fetch_wc2026_fixtures() -> pd.DataFrame:
    cache_path = DATA_RAW / "wc2026_fixtures.json"

    url = f"{FD_BASE_URL}/competitions/WC/matches?season=2026"
    headers = {"X-Auth-Token": FD_API_KEY}
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        matches = resp.json().get("matches", [])
    except Exception as exc:
        logger.error("Failed to fetch WC 2026 fixtures: %s", exc)
        if cache_path.exists():
            logger.info("Using cached fixtures")
            return pd.read_json(cache_path)
        return pd.DataFrame()

    rows: list[dict] = []
    for m in matches:
        score = m.get("score", {}).get("fullTime", {})
        rows.append({
            "match_id": str(m["id"]),
            "date": m["utcDate"][:10],
            "stage": m.get("stage", ""),
            "group": m.get("group", ""),
            "status": m.get("status", ""),
            "team_home": m["homeTeam"]["name"],
            "team_away": m["awayTeam"]["name"],
            "goals_home": score.get("home"),
            "goals_away": score.get("away"),
        })

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df.to_json(cache_path, orient="records")
    logger.info("Fetched %d WC 2026 fixtures", len(df))
    return df
