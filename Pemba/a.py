import requests
import json

KEY = "861e12a102034589a9d26ff8f8007427"
headers = {"X-Auth-Token": KEY}

competitions = {
    "WC": [2018, 2022, 2026],
    "EC": [2020, 2024],
}

with open("c:/Projects/Prediction/match_counts.txt", "w", encoding="utf-8") as f:
    total_finished = 0
    total_with_odds = 0

    for comp, seasons in competitions.items():
        for season in seasons:
            url = f"https://api.football-data.org/v4/competitions/{comp}/matches?season={season}"
            r = requests.get(url, headers=headers, timeout=15)
            if r.status_code != 200:
                f.write(f"{comp} {season}: HTTP {r.status_code}\n")
                continue
            data = r.json()
            matches = data.get("matches", [])
            finished = [m for m in matches if m["status"] == "FINISHED"]
            with_odds = [m for m in finished if m.get("odds") and m["odds"].get("homeWin")]
            f.write(f"{comp} {season}: total={len(matches)} finished={len(finished)} with_odds={len(with_odds)}\n")
            if with_odds:
                f.write(f"  Sample odds: {with_odds[0]['odds']}\n")
                f.write(f"  Sample match: {with_odds[0]['homeTeam']['name']} vs {with_odds[0]['awayTeam']['name']}\n")
            total_finished += len(finished)
            total_with_odds += len(with_odds)

    f.write(f"\nTOTAL finished: {total_finished}\n")
    f.write(f"TOTAL with odds: {total_with_odds}\n")

print("Written to c:/Projects/Prediction/match_counts.txt")