"use client";
import { useEffect, useState, useCallback } from "react";
import { BracketView } from "@/components/BracketView";
import { fetchFixtures, enrichFixtures } from "@/lib/data";
import type { EnrichedMatch, MatchStage, STAGE_MAP } from "@/lib/types";
import { KNOCKOUT_STAGES, STAGE_MAP as SM } from "@/lib/types";

const F = "'JetBrains Mono',monospace";
const POLL_MS = 60 * 60 * 1000;

export default function BracketPage() {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const fixtures = await fetchFixtures();
    const knockout = fixtures.filter(f=>f.stage!=="GROUP_STAGE");
    const stageKeys = [...new Set(knockout.map(f=>SM[f.stage]))].filter(Boolean);
    const enriched = await Promise.all(
      stageKeys.map(key => enrichFixtures(knockout.filter(f=>SM[f.stage]===key), key))
    );
    setMatches(enriched.flat());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div>
      <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:24 }}>
        <h1 style={{ fontSize:20,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Knockout Bracket</h1>
      </div>
      {loading ? (
        <div style={{ textAlign:"center" as const,padding:"60px 0",fontSize:11,color:"#a3a3a3",fontFamily:F }}>loading...</div>
      ) : (
        <BracketView matches={matches} />
      )}
    </div>
  );
}
