import argparse
import logging
import sys
sys.path.insert(0, "src")

from scrape import fetch_all_elo, fetch_all_fd_matches
from predict import load_wc2026_fixtures, predict_fixtures, write_predictions
from config import FD_API_KEY, STAGE_ENCODING

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

VALID_STAGES = {
    "group": "GROUP_STAGE",
    "r32": "LAST_32",
    "r16": "LAST_16",
    "qf": "QUARTER_FINALS",
    "sf": "SEMI_FINALS",
    "final": "FINAL",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="WC2026 match outcome predictor")
    parser.add_argument(
        "--stage",
        required=True,
        choices=list(VALID_STAGES.keys()),
        help="Tournament stage to predict",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        default=False,
        help="Force re-fetch all data ignoring cache",
    )
    args = parser.parse_args()

    if not FD_API_KEY:
        logger.error("FD_API_KEY environment variable not set")
        sys.exit(1)

    fd_stage = VALID_STAGES[args.stage]

    if args.no_cache:
        import shutil
        from config import DATA_RAW
        shutil.rmtree(DATA_RAW, ignore_errors=True)
        DATA_RAW.mkdir(parents=True, exist_ok=True)
        logger.info("Cache cleared")

    logger.info("Step 1/3 — Refreshing Elo data")
    elo_data = fetch_all_elo()

    logger.info("Step 2/3 — Fetching WC 2026 fixtures")
    fd_matches = fetch_all_fd_matches()
    if fd_matches.empty:
        logger.error("No fixture data available")
        sys.exit(1)

    fixtures = load_wc2026_fixtures(fd_matches, fd_stage)
    if not fixtures:
        logger.error(
            "No upcoming fixtures found for stage: %s (%s). "
            "Check that matches are scheduled and not yet played.",
            args.stage, fd_stage,
        )
        sys.exit(1)

    logger.info("Found %d fixtures for stage: %s", len(fixtures), args.stage)

    logger.info("Step 3/3 — Predicting")
    predictions = predict_fixtures(fixtures, elo_data, args.stage)
    write_predictions(predictions, args.stage)
    logger.info("Done. %d predictions written.", len(predictions))


if __name__ == "__main__":
    main()
