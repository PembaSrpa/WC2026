"use client";
import { useEffect, useState } from "react";
import { BracketView } from "@/components/BracketView";
import { fetchFixtures, fetchAllForStage } from "@/lib/data";
import type { EnrichedMatch, MatchStage, STAGE_MAP } from "@/lib/types";

const F = "'JetBrains Mono',monospace";
const KNOCKOUT_STAGES: Array<{ stage: MatchStage; key: string }> = [
  { stage:"LAST_32", key:"r32" },
  { stage:"LAST_16", key:"r16" },
  { stage:"QUARTER_FINALS", key:"qf" },
  { stage:"SEMI_FINALS", key:"sf" },
  { stage:"FINAL", key:"final" },
];

export default function BracketPage() {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const fixtures = await fetchFixtures();
      const knockoutFixtures = fixtures.filter(f => f.stage !== "GROUP_STAGE");
      const predResults = await Promise.all(
        KNOCKOUT_STAGES.map(({ key }) => fetchAllForStage(key))
      );
      const sunlessMap: Record<string,any> = {};
      const frankMap: Record<string,any> = {};
      for (const { sunless, frank } of predResults) {
        for (const p of sunless) sunlessMap[p.match_id] = p;
        for (const p of frank) frankMap[p.match_id] = p;
      }
      const enriched: EnrichedMatch[] = knockoutFixtures.map(f => ({
        ...f,
        sunless: sunlessMap[f.match_id] ?? null,
        frank: frankMap[f.match_id] ?? null,
        my_pick: null,
      }));
      setMatches(enriched);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:24 }}>
        <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Knockout Bracket</h1>
        <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>Sunless model win probabilities shown</span>
      </div>
      {loading ? (
        <div style={{ textAlign:"center" as const,padding:"60px 0",fontSize:11,color:"#525252",fontFamily:F }}>loading...</div>
      ) : (
        <BracketView matches={matches} />
      )}
    </div>
  );
}
