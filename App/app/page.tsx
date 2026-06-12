"use client";
import { useEffect, useState, useCallback } from "react";
import { MatchCard } from "@/components/MatchCard";
import { fetchFixtures, enrichFixtures } from "@/lib/data";
import type { EnrichedMatch } from "@/lib/types";
import { STAGE_MAP } from "@/lib/types";

const F = "'JetBrains Mono',monospace";
const POLL_MS = 60 * 60 * 1000;

export default function MatchesPage() {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);

  const load = useCallback(async () => {
    const fixtures = await fetchFixtures();
    const group = fixtures.filter(f=>f.stage==="GROUP_STAGE");
    const enriched = await enrichFixtures(group, "group");
    enriched.sort((a,b)=>new Date(a.date+' '+a.time_nst).getTime()-new Date(b.date+' '+b.time_nst).getTime());
    setMatches(enriched);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const finished = matches.filter(m=>m.status==="FINISHED").length;
  const next = matches.find(m=>m.status==="TIMED"||m.status==="SCHEDULED");

  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24 }}>
        {[
          { label:"Completed", value:`${finished} / ${matches.length}`, sub:"group stage matches" },
          { label:"Next Match", value:next?next.time_nst+" NST":"—", sub:next?`${next.date}`:"no upcoming" },
          { label:"Updated", value:lastUpdated?lastUpdated.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}):"—", sub:"refreshes hourly" },
        ].map(s=>(
          <div key={s.label} style={{ background:"#262626",border:"1px solid #404040",borderRadius:7,padding:"14px 16px" }}>
            <div style={{ fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:"#a3a3a3",marginBottom:6,fontFamily:F }}>{s.label}</div>
            <div style={{ fontSize:20,fontWeight:700,color:"#f5f5f5",lineHeight:1,fontFamily:F }}>{s.value}</div>
            <div style={{ fontSize:10,color:"#a3a3a3",marginTop:4,fontFamily:F }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:16 }}>
        <h1 style={{ fontSize:20,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Group Stage</h1>
        <span style={{ fontSize:10,color:"#a3a3a3",fontFamily:F }}>sorted by date · times in NST</span>
      </div>

      {loading ? (
        <div style={{ textAlign:"center" as const,padding:"60px 0",fontSize:11,color:"#a3a3a3",fontFamily:F }}>loading fixtures...</div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column" as const,gap:8 }}>
          {matches.map(m=><MatchCard key={m.match_id} match={m} />)}
        </div>
      )}
    </div>
  );
}