"""
Refresh data/fixtures/wc2026_fixtures.json.

If FD_API_KEY is set, fetches the latest WC 2026 schedule directly from
football-data.org (and writes it to both this project's data/fixtures/
and the Next.js app's public/fixtures/, so both stay in sync).

If FD_API_KEY is not set, just copies the existing fixtures file from the
Next.js app (App/public/fixtures/wc2026_fixtures.json) into this
project's data/fixtures/ folder.
"""

import json
import logging
import os
import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src import config  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

FD_API_KEY = os.environ.get("FD_API_KEY", "")
FD_BASE_URL = "https://api.football-data.org/v4"
NST_OFFSET = timedelta(hours=5, minutes=45)


def parse_utc_to_nst(utc_str: str) -> datetime:
    utc_dt = datetime.strptime(utc_str, "%Y-%m-%dT%H:%M:%SZ")
    return utc_dt + NST_OFFSET


def fetch_from_football_data() -> None:
    import requests

    url = f"{FD_BASE_URL}/competitions/WC/matches?season=2026"
    headers = {"X-Auth-Token": FD_API_KEY}

    logger.info("Fetching WC 2026 fixtures from football-data.org")
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    matches = resp.json().get("matches", [])

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

    for out_dir in (config.DATA_FIXTURES, config.NEXTJS_FIXTURES_DIR):
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "wc2026_fixtures.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        logger.info("Fixtures written to %s", out_path)

    logger.info("Done. %d fixtures saved.", len(rows))


def copy_from_nextjs() -> None:
    src_path = config.NEXTJS_FIXTURES_DIR / "wc2026_fixtures.json"
    if not src_path.exists():
        logger.error("FD_API_KEY not set and %s does not exist.", src_path)
        sys.exit(1)

    dst_path = config.DATA_FIXTURES / "wc2026_fixtures.json"
    config.DATA_FIXTURES.mkdir(parents=True, exist_ok=True)
    shutil.copy(src_path, dst_path)
    logger.info("FD_API_KEY not set - copied existing fixtures: %s -> %s", src_path, dst_path)


if __name__ == "__main__":
    if FD_API_KEY:
        fetch_from_football_data()
    else:
        copy_from_nextjs()
