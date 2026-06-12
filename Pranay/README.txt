WC2026 Match Outcome Predictor - frank
=========================================

HOW IT WORKS
------------
- Downloads ~50k international match results (martj42/international_results)
- Builds features: Elo, rolling form (last 10 games), goals for/against,
  head-to-head record, stage importance - all date-gated (no leakage)
- Target variable: actual match results (W/D/L from team_a's perspective)
- Trains 3 XGBoost binary classifiers: one each for p_win, p_draw, p_loss
- Predicts upcoming WC 2026 fixtures from data/fixtures/wc2026_fixtures.json
- Outputs one JSON file per stage to predictions/ and to
  ../App/public/predictions/


SETUP
-----
pip install -r requirements.txt


FIXTURES
--------
   python fetch_fixtures.py

If FD_API_KEY is set, fetches the latest WC 2026 schedule from
football-data.org. Otherwise copies the existing fixtures file from
../App/public/fixtures/wc2026_fixtures.json.


TRAIN (run once before the tournament, re-run anytime to refresh)
-------------------------------------------------------------------
   python run_train.py

First run downloads and caches data/raw/results.csv (~1-2 min to
engineer features).

Output:
- models/model_p_win.json
- models/model_p_draw.json
- models/model_p_loss.json
- models/explainers.pkl
- data/processed/training_matrix.csv


PREDICT (run before each of the 6 stages)
------------------------------------------
   python run_predict.py --stage group
   python run_predict.py --stage r32
   python run_predict.py --stage r16
   python run_predict.py --stage qf
   python run_predict.py --stage sf
   python run_predict.py --stage final

Output: predictions/frank_predictions_{stage}.json
        (also written to ../App/public/predictions/)


OUTPUT FORMAT
-------------
[
  {
    "match_id": "537333",
    "team_a": "Canada",
    "team_b": "Bosnia-Herzegovina",
    "stage": "group",
    "match_date": "2026-06-13",
    "p_win": 0.561,
    "p_draw": 0.1026,
    "p_loss": 0.3364,
    "model": "frank",
    "shap_values": {
      "elo_diff": 0.0979,
      "elo_a": 0.1147,
      ...
    }
  }
]


DEPLOYING TO VERCEL
-------------------
1. run_predict.py already writes directly to:
     ../App/public/predictions/frank_predictions_{stage}.json

2. git add . && git commit -m "add {stage} predictions" && git push

3. Vercel auto-deploys. Frontend reads it at:
     /predictions/frank_predictions_{stage}.json


DATA SOURCES
------------
martj42/international_results - historical match results (GitHub CSV)
football-data.org (optional)   - WC 2026 fixture schedule, via fetch_fixtures.py
