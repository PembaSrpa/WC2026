import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATA_RAW = BASE_DIR / "data" / "raw"
DATA_PROCESSED = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"
PREDICTIONS_DIR = BASE_DIR / "predictions"

for d in [DATA_RAW, DATA_PROCESSED, MODELS_DIR, PREDICTIONS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

FD_API_KEY = os.environ.get("FD_API_KEY", "")
FD_BASE_URL = "https://api.football-data.org/v4"

FD_COMPETITIONS = {
    "WC": 2000,
    "EC": 2018,
    "CA": 2152,
}

FD_SEASONS = {
    "WC": [2018, 2022, 2026],
    "EC": [2020, 2024],
    "CA": [2021, 2024],
}

ELO_BASE_URL = "https://www.eloratings.net"
ELO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.eloratings.net/",
}

TOP_ELO_THRESHOLD = 1900.0
MIN_MATCH_DATE = "2010-01-01"
FRIENDLY_CODES = {"F", "FR"}

TRAIN_END_DATE = "2024-12-31"
VAL_END_DATE = "2025-12-31"

XGB_PARAMS = {
    "n_estimators": 500,
    "max_depth": 4,
    "learning_rate": 0.05,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "min_child_weight": 5,
    "tree_method": "hist",
    "random_state": 42,
    "n_jobs": -1,
}

FEATURE_COLS = [
    "elo_diff",
    "elo_a",
    "elo_b",
    "ppg_last5_a",
    "ppg_last5_b",
    "ppg_last10_a",
    "ppg_last10_b",
    "goals_scored_last5_a",
    "goals_scored_last5_b",
    "goals_scored_last10_a",
    "goals_scored_last10_b",
    "goals_conceded_last5_a",
    "goals_conceded_last5_b",
    "goals_conceded_last10_a",
    "goals_conceded_last10_b",
    "win_rate_vs_top_a",
    "win_rate_vs_top_b",
    "defensive_solidity_a",
    "defensive_solidity_b",
    "h2h_win_rate_a",
    "stage_encoded",
]

STAGE_ENCODING = {
    "GROUP_STAGE": 1,
    "LAST_32": 2,
    "LAST_16": 3,
    "QUARTER_FINALS": 4,
    "SEMI_FINALS": 5,
    "FINAL": 6,
    "group": 1,
    "r32": 2,
    "r16": 3,
    "qf": 4,
    "sf": 5,
    "final": 6,
}

TARGETS = ["p_win", "p_draw", "p_loss"]

WC2026_TEAMS = [
    "Argentina", "Brazil", "France", "England", "Germany", "Spain",
    "Portugal", "Netherlands", "Belgium", "Croatia", "Uruguay", "Morocco",
    "Japan", "United States", "Mexico", "Senegal", "Ecuador", "Canada",
    "Colombia", "Switzerland", "Denmark", "South Korea", "Serbia", "Ghana",
    "Cameroon", "Poland", "Australia", "Costa Rica", "Tunisia", "Saudi Arabia",
    "Iran", "Qatar", "South Africa", "New Zealand", "Slovenia", "Slovakia",
    "Turkey", "Norway", "Ukraine", "DR Congo", "Mali", "Venezuela",
    "Panama", "Honduras", "Jamaica", "Bahrain", "Indonesia", "Bolivia",
]
