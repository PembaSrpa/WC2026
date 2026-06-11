"use client";
import { useEffect, useState } from "react";
import { GroupTable } from "@/components/GroupTable";
import { fetchFixtures, fetchAllForStage } from "@/lib/data";
import type { EnrichedMatch } from "@/lib/types";

const F = "'JetBrains Mono',monospace";

export default function GroupsPage() {
  const [grouped, setGrouped] = useState<Record<string,EnrichedMatch[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [fixtures, { sunless, frank }] = await Promise.all([
        fetchFixtures(),
        fetchAllForStage("group"),
      ]);
      const sunlessMap = Object.fromEntries(sunless.map(p=>[p.match_id,p]));
      const frankMap = Object.fromEntries(frank.map(p=>[p.match_id,p]));
      const enriched: EnrichedMatch[] = fixtures
        .filter(f=>f.stage==="GROUP_STAGE")
        .map(f=>({ ...f, sunless:sunlessMap[f.match_id]??null, frank:frankMap[f.match_id]??null, my_pick:null }));
      const g: Record<string,EnrichedMatch[]> = {};
      for (const m of enriched) {
        const key = m.group ?? "OTHER";
        if (!g[key]) g[key] = [];
        g[key].push(m);
      }
      setGrouped(g);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:24 }}>
        <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Group Standings</h1>
        <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>Top 2 + 8 best 3rd place teams qualify</span>
      </div>
      {loading ? (
        <div style={{ textAlign:"center" as const,padding:"60px 0",fontSize:11,color:"#525252",fontFamily:F }}>loading...</div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12 }}>
          {Object.entries(grouped).sort().map(([group,matches]) => (
            <GroupTable key={group} group={group.replace("GROUP_","")} matches={matches} />
          ))}
        </div>
      )}
    </div>
  );
}
