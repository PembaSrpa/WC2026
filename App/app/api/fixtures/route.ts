import { NextResponse } from "next/server";
import type { Fixture } from "@/lib/types";

const FDORG_KEY = "861e12a102034589a9d26ff8f8007427";
const FDORG_URL = "https://api.football-data.org/v4/competitions/WC/matches";

function get_nst_details(utcIso: string) {
  const utc_ms = Date.parse(utcIso);
  const nst_offset_ms = (5 * 60 + 45) * 60 * 1000;
  const nst_date = new Date(utc_ms + nst_offset_ms);

  const year = nst_date.getUTCFullYear();
  const month = String(nst_date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(nst_date.getUTCDate()).padStart(2, "0");
  
  const hours = String(nst_date.getUTCHours()).padStart(2, "0");
  const minutes = String(nst_date.getUTCMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

export async function GET() {
  try {
    const res = await fetch(FDORG_URL, {
      headers: { "X-Auth-Token": FDORG_KEY },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const fixtures: Fixture[] = (data.matches as any[]).map((m: any) => {
      const nst = get_nst_details(m.utcDate);
      
      return {
        match_id: String(m.id),
        date: nst.date,
        time_nst: nst.time,
        status: m.status,
        stage: m.stage,
        group: m.group ?? null,
        team_home: m.homeTeam.name ?? "TBD",
        team_home_crest: m.homeTeam.crest ?? "",
        team_away: m.awayTeam.name ?? "TBD",
        team_away_crest: m.awayTeam.crest ?? "",
        goals_home: m.score?.fullTime?.home ?? null,
        goals_away: m.score?.fullTime?.away ?? null,
      };
    });
    return NextResponse.json({ fixtures });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}