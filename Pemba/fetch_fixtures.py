import json
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, "src")
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

FD_API_KEY = os.environ.get("FD_API_KEY", "")
FD_BASE_URL = "https://api.football-data.org/v4"

BASE_DIR = Path(__file__).parent
FIXTURES_DIRS = [
    BASE_DIR / "data" / "fixtures",
    BASE_DIR.parent / "App" / "public" / "fixtures",
]

NST_OFFSET = timedelta(hours=5, minutes=45)


def parse_utc_to_nst(utc_str: str) -> datetime:
    """Parses a UTC string and returns an NST-adjusted datetime object."""
    utc_dt = datetime.strptime(utc_str, "%Y-%m-%dT%H:%M:%SZ")
    return utc_dt + NST_OFFSET


def fetch_and_save_fixtures() -> None:
    if not FD_API_KEY:
        logger.error("FD_API_KEY environment variable not set")
        sys.exit(1)

    url = f"{FD_BASE_URL}/competitions/WC/matches?season=2026"
    headers = {"X-Auth-Token": FD_API_KEY}

    logger.info("Fetching WC 2026 fixtures from football-data.org")
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        matches = resp.json().get("matches", [])
    except Exception as exc:
        logger.error("Failed to fetch fixtures: %s", exc)
        sys.exit(1)

    rows = []
    for m in matches:
        score = m.get("score", {}).get("fullTime", {})
        nst_dt = parse_utc_to_nst(m["utcDate"])
        
        rows.append({
            "match_id": str(m["id"]),
            "date": nst_dt.strftime("%Y-%m-%d"),
            "time_nst": nst_dt.strftime("%H:%M"),
            "status": m.get("status", ""),
            "stage": m.get("stage", ""),
            "group": m.get("group", ""),
            "team_home": m["homeTeam"]["name"],
            "team_home_crest": m["homeTeam"].get("crest", ""),
            "team_away": m["awayTeam"]["name"],
            "team_away_crest": m["awayTeam"].get("crest", ""),
            "goals_home": score.get("home"),
            "goals_away": score.get("away"),
        })

    output = {
        "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(rows),
        "matches": rows,
    }

    for out_dir in FIXTURES_DIRS:
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "wc2026_fixtures.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        logger.info("Fixtures written to %s", out_path)

    logger.info("Done. %d fixtures saved.", len(rows))


if __name__ == "__main__":
    fetch_and_save_fixtures()