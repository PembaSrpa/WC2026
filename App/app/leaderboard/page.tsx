"use client";
import { useState } from "react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { MOCK_LEADERBOARD } from "@/lib/mock";

const F = "'JetBrains Mono',monospace";
type Tab = "all"|"models"|"humans";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("all");
  const filtered = tab==="models" ? MOCK_LEADERBOARD.filter(r=>r.is_model) : tab==="humans" ? MOCK_LEADERBOARD.filter(r=>!r.is_model) : MOCK_LEADERBOARD;
  return (
    <div>
      <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:20 }}>
        <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Leaderboard</h1>
        <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>Ranked by cumulative RPS — lower is better</span>
      </div>
      <div style={{ display:"flex",borderBottom:"1px solid #404040",marginBottom:16 }}>
        {(["all","models","humans"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"8px 16px",fontSize:10,fontWeight:600,textTransform:"uppercase" as const,letterSpacing:1,
            cursor:"pointer",border:"none",background:"transparent",fontFamily:F,
            borderBottom: tab===t ? "2px solid #d4d4d4" : "2px solid transparent",
            color: tab===t ? "#d4d4d4" : "#525252",
            marginBottom:-1,transition:"all 0.15s",
          }}>{t}</button>
        ))}
      </div>
      <div style={{ border:"1px solid #404040",borderRadius:8,overflow:"hidden",background:"#262626" }}>
        <LeaderboardTable rows={filtered} />
      </div>
    </div>
  );
}
