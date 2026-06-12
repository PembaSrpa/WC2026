import { NextResponse } from "next/server";
import type { Fixture } from "@/lib/types";

const FDORG_KEY = "861e12a102034589a9d26ff8f8007427";
const FDORG_URL = "https://api.football-data.org/v4/competitions/WC/matches";

function toNST(utcIso: string): string {
  const d = new Date(new Date(utcIso).getTime() + (5*60+45)*60*1000);
  const h = String(d.getUTCHours()).padStart(2,"0");
  const m = String(d.getUTCMinutes()).padStart(2,"0");
  return `${h}:${m}`;
}

export async function GET() {
  try {
    const res = await fetch(FDORG_URL, {
      headers: { "X-Auth-Token": FDORG_KEY },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const fixtures: Fixture[] = (data.matches as any[]).map((m: any) => ({
      match_id: String(m.id),
      date: m.utcDate.slice(0,10),
      time_nst: toNST(m.utcDate),
      status: m.status,
      stage: m.stage,
      group: m.group ?? null,
      team_home: m.homeTeam.name ?? "TBD",
      team_home_crest: m.homeTeam.crest ?? "",
      team_away: m.awayTeam.name ?? "TBD",
      team_away_crest: m.awayTeam.crest ?? "",
      goals_home: m.score?.fullTime?.home ?? null,
      goals_away: m.score?.fullTime?.away ?? null,
    }));
    return NextResponse.json({ fixtures });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
