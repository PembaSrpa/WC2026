import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src import config, features, train  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def main() -> None:
    logger.info("Step 1/3 - Loading match history")
    df = features.load_history()
    elo_history = features.compute_elo_history(df)

    logger.info("Step 2/3 - Building training matrix")
    matrix = features.build_training_matrix(df, elo_history)
    matrix.to_csv(config.TRAINING_MATRIX_CSV, index=False)
    logger.info("Training matrix: %d rows, %d columns -> %s",
                 len(matrix), len(matrix.columns), config.TRAINING_MATRIX_CSV)

    logger.info("Step 3/3 - Training models")
    models, explainers, metrics = train.train(matrix)
    train.save(models, explainers)

    logger.info("Training complete. Metrics:")
    for k, v in metrics.items():
        logger.info("  %s: %.4f", k, v)

    train.evaluate_test(matrix, models)


if __name__ == "__main__":
    main()
