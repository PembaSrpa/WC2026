import logging
import sys
sys.path.insert(0, "src")

from scrape import fetch_all_elo, fetch_all_fd_matches
from features import build_training_matrix
from train import train, save, evaluate_test
from config import FD_API_KEY

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def main() -> None:
    if not FD_API_KEY:
        logger.error("FD_API_KEY environment variable not set")
        sys.exit(1)

    logger.info("Step 1/4 — Fetching Elo match history")
    elo_data = fetch_all_elo()

    logger.info("Step 2/4 — Fetching football-data.org matches")
    fd_matches = fetch_all_fd_matches()
    if fd_matches.empty:
        logger.error("No match data fetched from football-data.org")
        sys.exit(1)

    finished = fd_matches[fd_matches["status"] == "FINISHED"]
    with_odds = finished.dropna(subset=["odds_home_win", "odds_draw", "odds_away_win"])
    logger.info(
        "Finished matches: %d, with odds: %d",
        len(finished), len(with_odds),
    )

    logger.info("Step 3/4 — Building feature matrix")
    df = build_training_matrix(elo_data, fd_matches)
    if df.empty:
        logger.error("Feature matrix is empty — no matches with odds found")
        sys.exit(1)
    logger.info("Training matrix: %d rows, %d features", len(df), len(df.columns))

    logger.info("Step 4/4 — Training models")
    models, explainers, metrics = train(df)
    save(models, explainers)

    logger.info("Training complete. Metrics:")
    for k, v in metrics.items():
        logger.info("  %s: %.6f", k, v)

    evaluate_test(df, models)


if __name__ == "__main__":
    main()
