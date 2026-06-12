# World Cup Prediction Model

XGBoost classifier that outputs match win/draw/loss probabilities
in the exact JSON format your webapp expects.

---

## Setup

```bash
pip install pandas scikit-learn xgboost requests supabase
```

---

## Run Order

```bash
# 1. Download match history & build features (~50k matches, takes ~2 min)
python 1_build_dataset.py

# 2. Train the XGBoost model (~30 sec), prints accuracy report
python 2_train_model.py

# 3. Edit FIXTURES and TEAM_STATS in 3_predict.py, then run:
python 3_predict.py
#    → output/predictions.json

# 4. Upload to Supabase
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_KEY=your-service-role-key
python 4_ingest_supabase.py
```

---

## Before Each Stage

1. Open `3_predict.py`
2. Update `FIXTURES` with the upcoming matches
3. Update `TEAM_STATS` with current Elo ratings from https://www.eloratings.net
4. Run steps 3 → 4

You do **not** need to retrain the model for each stage —
only retrain if you want to incorporate recent tournament results.

---

## Output Format

```json
[
  {
    "match_id": "group_a_bra_mex",
    "team_a":   "Brazil",
    "team_b":   "Mexico",
    "stage":    "group",
    "p_win":    0.61,
    "p_draw":   0.22,
    "p_loss":   0.17
  }
]
```

- `p_win + p_draw + p_loss = 1.0` always (normalized before output)
- `p_win` is always from `team_a`'s perspective
- `stage` is one of: `group | r32 | r16 | qf | sf | final`

---

## Features Used

| Feature | Description |
|---|---|
| `elo_diff` | Elo rating difference (team_a − team_b) |
| `elo_a / elo_b` | Absolute Elo ratings |
| `form_win_a/b` | Win rate over last 10 competitive games |
| `form_draw_a/b` | Draw rate over last 10 games |
| `form_gf_a/b` | Avg goals scored per game (last 10) |
| `form_ga_a/b` | Avg goals conceded per game (last 10) |
| `h2h_win_rate` | Historical head-to-head win rate |
| `h2h_draw_rate` | Historical draw rate in H2H |
| `stage_importance` | Tournament stage weight |
| `neutral` | Always 1 for World Cup (neutral venue) |

---

## Supabase Table

```sql
create table predictions (
  match_id   text primary key,
  team_a     text not null,
  team_b     text not null,
  stage      text not null,
  p_win      numeric(6,4) not null,
  p_draw     numeric(6,4) not null,
  p_loss     numeric(6,4) not null,
  created_at timestamptz default now()
);
```
