import logging
import sys
sys.path.insert(0, "src")

from config import FD_API_KEY
from scrape import fetch_all_elo
from features import build_training_matrix
from train import train, save, evaluate_test

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

    logger.info("Step 1/3 — Fetching Elo match history for all teams")
    elo_data = fetch_all_elo()

    if not elo_data:
        logger.error("No Elo data fetched. Check internet connection.")
        sys.exit(1)

    logger.info("Step 2/3 — Building training matrix")
    df = build_training_matrix(elo_data)

    if df.empty:
        logger.error("Training matrix is empty.")
        sys.exit(1)

    logger.info("Training matrix: %d rows, %d features", len(df), len(df.columns))

    logger.info("Step 3/3 — Training models")
    models, explainers, metrics = train(df)
    save(models, explainers)

    logger.info("Training complete. Metrics:")
    for k, v in metrics.items():
        logger.info("  %s: %.6f", k, v)

    evaluate_test(df, models)


if __name__ == "__main__":
    main()
