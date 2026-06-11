"use client";
import { useEffect, useState } from "react";
import { MatchCard } from "@/components/MatchCard";
import { supabase } from "@/lib/supabase";
import { fetchFixtures, fetchAllForStage } from "@/lib/data";
import type { EnrichedMatch, Fixture, Prediction } from "@/lib/types";

const F = "'JetBrains Mono',monospace";

export default function MatchesPage() {
  const [userId, setUserId] = useState<string|null>(null);
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [stats, setStats] = useState({ rank:0, rps:"—", predicted:0, total:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supabase) supabase.auth.getUser().then((res: any) => setUserId(res.data.user?.id ?? null));
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [fixtures, { sunless, frank }] = await Promise.all([
        fetchFixtures(),
        fetchAllForStage("group"),
      ]);

      const groupFixtures = fixtures.filter(f => f.stage === "GROUP_STAGE");
      const sunlessMap = Object.fromEntries(sunless.map(p => [p.match_id, p]));
      const frankMap = Object.fromEntries(frank.map(p => [p.match_id, p]));

      let myPicks: Record<string,string> = {};
      if (userId && supabase) {
        const { data } = await supabase.from("picks").select("match_id,pick").eq("user_id", userId);
        for (const p of data ?? []) myPicks[p.match_id] = p.pick;
      }

      const enriched: EnrichedMatch[] = groupFixtures.map(f => ({
        ...f,
        sunless: sunlessMap[f.match_id] ?? null,
        frank: frankMap[f.match_id] ?? null,
        my_pick: (myPicks[f.match_id] as any) ?? null,
      }));

      setMatches(enriched);

      if (userId && supabase) {
        const { data: lb } = await supabase.from("leaderboard").select("rps_score").eq("user_id", userId);
        const { data: picks } = await supabase.from("picks").select("id").eq("user_id", userId);
        const { data: allLb } = await supabase.from("leaderboard").select("user_id,rps_score");
        const totals: Record<string,number> = {};
        for (const r of allLb ?? []) totals[r.user_id] = (totals[r.user_id]??0) + r.rps_score;
        const sorted = Object.entries(totals).sort((a,b)=>a[1]-b[1]);
        const rank = sorted.findIndex(([id])=>id===userId)+1;
        const myRps = lb?.reduce((s: number,r: any)=>s+r.rps_score,0)??0;
        setStats({ rank:rank||0, rps:lb?.length?myRps.toFixed(3):"—", predicted:picks?.length??0, total:groupFixtures.length });
      } else {
        setStats(s => ({ ...s, total:groupFixtures.length }));
      }

      setLoading(false);
    }
    load();
  }, [userId]);

  const grouped: Record<string,EnrichedMatch[]> = {};
  for (const m of matches) {
    const key = m.group ?? "OTHER";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }

  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24 }}>
        {[
          { label:"Your Rank", value:stats.rank?`#${stats.rank}`:"—", sub:"of all players" },
          { label:"Your RPS", value:stats.rps, sub:"lower is better" },
          { label:"Predicted", value:`${stats.predicted} / ${stats.total}`, sub:"group stage matches" },
        ].map(s => (
          <div key={s.label} style={{ background:"#262626",border:"1px solid #404040",borderRadius:7,padding:"14px 18px" }}>
            <div style={{ fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:"#525252",marginBottom:6,fontFamily:F }}>{s.label}</div>
            <div style={{ fontSize:26,fontWeight:700,color:"#f5f5f5",lineHeight:1,fontFamily:F }}>{s.value}</div>
            <div style={{ fontSize:10,color:"#525252",marginTop:4,fontFamily:F }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:16 }}>
        <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Group Stage</h1>
        <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>Predictions lock at kickoff · Times in NST</span>
      </div>

      {loading ? (
        <div style={{ textAlign:"center" as const,padding:"60px 0",fontSize:11,color:"#525252",fontFamily:F }}>loading fixtures...</div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column" as const,gap:16 }}>
          {Object.entries(grouped).sort().map(([group,ms]) => (
            <div key={group}>
              <div style={{ fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:"#525252",marginBottom:8,fontFamily:F }}>
                Group {group.replace("GROUP_","")}
              </div>
              <div style={{ display:"flex",flexDirection:"column" as const,gap:8 }}>
                {ms.map(m => <MatchCard key={m.match_id} match={m} userId={userId} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
