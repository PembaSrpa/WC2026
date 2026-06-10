WC2026 Match Outcome Predictor
===============================

SETUP
-----
1. Install dependencies:
   pip install -r requirements.txt

2. Set your football-data.org API key:
   Windows PowerShell:
   $env:FD_API_KEY="your_key_here"

   Mac/Linux:
   export FD_API_KEY="your_key_here"


TRAIN THE MODEL (run once before the tournament)
-------------------------------------------------
   python run_train.py

This will:
- Scrape match history for all 48 WC teams from eloratings.net
- Download WC/Euros/Copa America match results + odds from football-data.org
- Build a feature matrix
- Train 3 XGBoost models (p_win, p_draw, p_loss)
- Save models to models/
- Print RPS evaluation score

First run takes ~10 minutes (scraping). Subsequent runs use cache.


PREDICT A STAGE (run before each of the 6 stages)
--------------------------------------------------
   python run_predict.py --stage group
   python run_predict.py --stage r32
   python run_predict.py --stage r16
   python run_predict.py --stage qf
   python run_predict.py --stage sf
   python run_predict.py --stage final

This will:
- Refresh Elo data from cache (re-scrapes if cache is stale)
- Fetch latest WC 2026 fixtures from football-data.org
- Compute features for each upcoming match
- Write predictions to predictions/predictions_{stage}.json

To force a full data refresh (ignore cache):
   python run_predict.py --stage r16 --no-cache


OUTPUT FORMAT (predictions/predictions_{stage}.json)
-----------------------------------------------------
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

Commit this file to your repo and Vercel picks it up automatically.


DATA SOURCES
------------
- eloratings.net  — match history, Elo ratings, scores (scraped via TSV endpoint)
- football-data.org — WC/Euros/Copa America results + odds (API, free tier)
