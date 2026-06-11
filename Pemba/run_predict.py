import argparse
import logging
import sys
sys.path.insert(0, "src")

from config import FD_API_KEY, FD_STAGE_MAP
from scrape import fetch_all_elo, fetch_wc2026_fixtures
from predict import load_wc2026_fixtures, predict_fixtures, write_predictions

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="WC2026 match outcome predictor")
    parser.add_argument(
        "--stage",
        required=True,
        choices=list(FD_STAGE_MAP.keys()),
        help="Tournament stage to predict: group, r32, r16, qf, sf, final",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        default=False,
        help="Force re-fetch all Elo data ignoring local cache",
    )
    args = parser.parse_args()

    if not FD_API_KEY:
        logger.error("FD_API_KEY environment variable not set")
        sys.exit(1)

    if args.no_cache:
        from config import DATA_RAW
        import shutil
        shutil.rmtree(DATA_RAW, ignore_errors=True)
        DATA_RAW.mkdir(parents=True, exist_ok=True)
        logger.info("Cache cleared — will re-fetch all Elo data")

    logger.info("Step 1/3 — Loading Elo data")
    elo_data = fetch_all_elo()
    if not elo_data:
        logger.error("No Elo data available")
        sys.exit(1)

    logger.info("Step 2/3 — Fetching WC 2026 fixtures")
    fd_matches = fetch_wc2026_fixtures()
    if fd_matches.empty:
        logger.error("No fixture data available")
        sys.exit(1)

    fixtures = load_wc2026_fixtures(fd_matches, args.stage)
    if not fixtures:
        logger.error(
            "No upcoming fixtures for stage '%s'. "
            "Either all matches are already played or stage hasn't been scheduled yet.",
            args.stage,
        )
        sys.exit(1)

    logger.info("Found %d fixtures for stage: %s", len(fixtures), args.stage)

    logger.info("Step 3/3 — Predicting")
    predictions = predict_fixtures(fixtures, elo_data, args.stage)
    write_predictions(predictions, args.stage)
    logger.info("Done. %d predictions written to predictions/predictions_%s.json", len(predictions), args.stage)


if __name__ == "__main__":
    main()
