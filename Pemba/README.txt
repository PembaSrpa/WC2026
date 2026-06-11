WC2026 Match Outcome Predictor
===============================

HOW IT WORKS
------------
- Scrapes full match history for all WC teams from eloratings.net
- Builds features: Elo, PPG, goals, win rates, H2H — all date-gated (no leakage)
- Target variable: actual match results (W=1/D=1/L=1 one-hot)
- Trains 3 XGBoost models: one each for p_win, p_draw, p_loss
- Predicts upcoming WC 2026 fixtures from football-data.org
- Outputs one JSON file per stage to predictions/


SETUP
-----
1. pip install -r requirements.txt

2. Set environment variables (run before each session):

   Windows PowerShell:
   $env:FD_API_KEY="your_football_data_org_key"

   Mac/Linux:
   export FD_API_KEY="your_football_data_org_key"


TRAIN (run once before the tournament)
---------------------------------------
   python run_train.py

First run: ~10-15 minutes (scrapes eloratings for 48 teams, cached after)
Subsequent runs: ~2 minutes (uses cache)

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

Force fresh data (re-scrapes eloratings):
   python run_predict.py --stage r16 --no-cache

Output: predictions/predictions_{stage}.json


OUTPUT FORMAT
-------------
[
  {
    "match_id": "537327",
    "team_a": "Argentina",
    "team_b": "France",
    "stage": "final",
    "match_date": "2026-07-19",
    "p_win": 0.4821,
    "p_draw": 0.2634,
    "p_loss": 0.2545,
    "shap_values": {
      "elo_diff": 0.042,
      "ppg_last10_a": 0.031,
      ...
    }
  }
]


DEPLOYING TO VERCEL
-------------------
1. Copy predictions/predictions_{stage}.json to your Next.js project:
   your-nextjs-app/public/predictions/predictions_{stage}.json

2. git add . && git commit -m "add {stage} predictions" && git push

3. Vercel auto-deploys. Frontend reads it at:
   /predictions/predictions_{stage}.json


DATA SOURCES
------------
eloratings.net  — match history, scores, Elo ratings per team (TSV endpoint)
football-data.org — WC 2026 fixture schedule (free API tier)
