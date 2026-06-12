import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src import config, features, train  # noqa: E402
from src.predict import load_wc2026_fixtures, predict_fixtures, write_predictions  # noqa: E402

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
        choices=config.VALID_STAGES,
        help="Tournament stage to predict: group, r32, r16, qf, sf, final",
    )
    args = parser.parse_args()

    logger.info("Step 1/3 - Loading trained models")
    models, explainers = train.load()

    logger.info("Step 2/3 - Loading match history for live Elo/form/H2H features")
    df = features.load_history()
    elo_history = features.compute_elo_history(df)

    logger.info("Step 3/3 - Predicting stage: %s", args.stage)
    fixtures = load_wc2026_fixtures(args.stage)

    if not fixtures:
        logger.warning(
            "No upcoming fixtures for stage '%s' (already played, or bracket "
            "slots not decided yet). Writing an empty predictions file.",
            args.stage,
        )
        write_predictions([], args.stage)
        return

    logger.info("Found %d fixtures for stage: %s", len(fixtures), args.stage)
    predictions = predict_fixtures(fixtures, df, elo_history, models, explainers, args.stage)
    write_predictions(predictions, args.stage)
    logger.info("Done. %d predictions written for stage %s.", len(predictions), args.stage)


if __name__ == "__main__":
    main()
