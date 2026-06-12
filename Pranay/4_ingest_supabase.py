"""
Step 4 — Ingest to Supabase
Reads output/predictions.json and upserts rows into your Supabase
`predictions` table. Safe to run multiple times — upserts by match_id.

Setup:
  pip install supabase
  Set env vars SUPABASE_URL and SUPABASE_KEY before running.

Expected Supabase table schema:
  create table predictions (
    match_id  text primary key,
    team_a    text not null,
    team_b    text not null,
    stage     text not null,
    p_win     numeric(6,4) not null,
    p_draw    numeric(6,4) not null,
    p_loss    numeric(6,4) not null,
    created_at timestamptz default now()
  );
"""

import json
import os
import sys

# ── Config ────────────────────────────────────────────────────────────────────
PREDICTIONS_PATH = "output/predictions.json"
TABLE_NAME       = "predictions"
# ─────────────────────────────────────────────────────────────────────────────


def load_predictions(path: str) -> list:
    with open(path) as f:
        data = json.load(f)
    print(f"✓ Loaded {len(data)} predictions from {path}")
    return data


def get_supabase_client():
    try:
        from supabase import create_client
    except ImportError:
        print("Install supabase: pip install supabase")
        sys.exit(1)

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    if not url or not key:
        print("Error: set SUPABASE_URL and SUPABASE_KEY environment variables.")
        print("  export SUPABASE_URL=https://your-project.supabase.co")
        print("  export SUPABASE_KEY=your-service-role-key")
        sys.exit(1)

    return create_client(url, key)


def upsert_predictions(client, predictions: list):
    response = (
        client.table(TABLE_NAME)
        .upsert(predictions, on_conflict="match_id")
        .execute()
    )
    print(f"✓ Upserted {len(predictions)} rows into '{TABLE_NAME}'")
    return response


if __name__ == "__main__":
    predictions = load_predictions(PREDICTIONS_PATH)
    client      = get_supabase_client()
    upsert_predictions(client, predictions)
    print("Done. Your webapp can now read predictions from Supabase.")
