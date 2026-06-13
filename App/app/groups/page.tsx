"use client";
import { useEffect, useState, useCallback } from "react";
import { GroupTable } from "@/components/GroupTable";
import { fetchFixtures, enrichFixtures } from "@/lib/data";
import type { EnrichedMatch } from "@/lib/types";

const F = "'JetBrains Mono',monospace";
const POLL_MS = 60 * 60 * 1000;

export default function GroupsPage() {
  const [grouped, setGrouped] = useState<Record<string,EnrichedMatch[]>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const fixtures = await fetchFixtures();
    const group = fixtures.filter(f=>f.stage==="GROUP_STAGE");
    const enriched = await enrichFixtures(group, "group");
    const g: Record<string,EnrichedMatch[]> = {};
    for (const m of enriched) {
      const key = m.group ?? "OTHER";
      if (!g[key]) g[key]=[];
      g[key].push(m);
    }
    setGrouped(g);
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
        <h1 style={{ fontSize:20,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Group Standings</h1>
        <span style={{ fontSize:10,color:"#a3a3a3",fontFamily:F }}>Top 2 + 8 best 3rd place qualify</span>
      </div>
      {loading ? (
        <div style={{ textAlign:"center" as const,padding:"60px 0",fontSize:11,color:"#a3a3a3",fontFamily:F }}>loading...</div>
      ) : (
        <div className="groups-grid">
          {Object.entries(grouped).sort().map(([group,matches])=>(
            <GroupTable key={group} group={group.replace("GROUP_","")} matches={matches} />
          ))}
        </div>
      )}
    </div>
  );
}
