from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATA_RAW = BASE_DIR / "data" / "raw"
DATA_PROCESSED = BASE_DIR / "data" / "processed"
DATA_FIXTURES = BASE_DIR / "data" / "fixtures"
MODELS_DIR = BASE_DIR / "models"
PREDICTIONS_DIR = BASE_DIR / "predictions"
NEXTJS_FIXTURES_DIR = BASE_DIR.parent / "App" / "public" / "fixtures"
NEXTJS_PREDICTIONS_DIR = BASE_DIR.parent / "App" / "public" / "predictions"

for d in [DATA_RAW, DATA_PROCESSED, DATA_FIXTURES, MODELS_DIR, PREDICTIONS_DIR,
          NEXTJS_FIXTURES_DIR, NEXTJS_PREDICTIONS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

MODEL_NAME = "frank"

# ── Historical match data ────────────────────────────────────────────────────
# 50k+ international results, 1872-present.
RESULTS_URL = "https://raw.githubusercontent.com/martj42/international_results/master/results.csv"
RESULTS_CSV = DATA_RAW / "results.csv"
TRAINING_MATRIX_CSV = DATA_PROCESSED / "training_matrix.csv"

MIN_YEAR = 2000
FORM_WINDOW = 10

COMPETITIVE_TOURNAMENTS = [
    "FIFA World Cup", "FIFA World Cup qualification",
    "UEFA Euro", "Copa América", "AFC Asian Cup",
    "Africa Cup of Nations", "CONCACAF Gold Cup",
    "Confederations Cup",
]

# stage_importance weight per tournament (used as a model feature)
STAGE_IMPORTANCE_MAP = {
    "FIFA World Cup": 3,
    "FIFA World Cup qualification": 1,
    "UEFA Euro": 2, "Copa América": 2,
    "AFC Asian Cup": 2, "Africa Cup of Nations": 2,
    "CONCACAF Gold Cup": 2, "Confederations Cup": 2,
}
# WC2026 fixtures are themselves "FIFA World Cup" matches
WC2026_STAGE_IMPORTANCE = 3
NEUTRAL = 1

# ── Model features ────────────────────────────────────────────────────────────
FEATURE_COLS = [
    "elo_diff", "elo_a", "elo_b",
    "form_win_a", "form_draw_a", "form_gf_a", "form_ga_a",
    "form_win_b", "form_draw_b", "form_gf_b", "form_ga_b",
    "h2h_win_rate", "h2h_draw_rate", "h2h_games",
    "stage_importance", "neutral",
]

XGB_PARAMS = {
    "n_estimators": 300,
    "max_depth": 4,
    "learning_rate": 0.05,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "reg_lambda": 1.5,
    "eval_metric": "logloss",
    "random_state": 42,
    "n_jobs": -1,
}

# ── Fixtures / output spec ────────────────────────────────────────────────────
FD_STAGE_MAP = {
    "GROUP_STAGE": "group",
    "LAST_32": "r32",
    "LAST_16": "r16",
    "QUARTER_FINALS": "qf",
    "SEMI_FINALS": "sf",
    "FINAL": "final",
}
VALID_STAGES = list(FD_STAGE_MAP.values())

# Team names differ slightly between the historical results dataset
# (martj42/international_results) and football-data.org. Map the
# fixtures-file name -> results-dataset name where they diverge.
TEAM_NAME_MAP = {
    "Bosnia-Herzegovina": "Bosnia and Herzegovina",
    "Cape Verde Islands": "Cape Verde",
    "Congo DR": "DR Congo",
    "Czechia": "Czech Republic",
}
