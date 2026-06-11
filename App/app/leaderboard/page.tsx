"use client";
import { useState, useEffect } from "react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { supabase } from "@/lib/supabase";
import type { LeaderboardRow } from "@/lib/types";

const F = "'JetBrains Mono',monospace";
type Tab = "all"|"models"|"humans";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const [{ data: lbData }, { data: usersData }, { data: picksData }] = await Promise.all([
        supabase.from("leaderboard").select("user_id,rps_score"),
        supabase.from("users").select("id,username"),
        supabase.from("picks").select("user_id"),
      ]);

      if (!usersData) { setLoading(false); return; }

      const totals: Record<string,number> = {};
      const counts: Record<string,number> = {};
      for (const r of lbData ?? []) {
        totals[r.user_id] = (totals[r.user_id]??0) + r.rps_score;
        counts[r.user_id] = (counts[r.user_id]??0) + 1;
      }
      const pickCounts: Record<string,number> = {};
      for (const p of picksData ?? []) pickCounts[p.user_id] = (pickCounts[p.user_id]??0) + 1;

      const built: LeaderboardRow[] = usersData.map((u: { id: string; username: string }) => ({
        rank:0, user_id:u.id, username:u.username, is_model:false, model_color:null,
        cumulative_rps: totals[u.id] ?? 0,
        matches_predicted: pickCounts[u.id] ?? 0,
        accuracy: counts[u.id] ? Math.max(0,1-(totals[u.id]/counts[u.id])/0.5) : 0,
      }))
      .sort((a: LeaderboardRow,b: LeaderboardRow)=>a.cumulative_rps-b.cumulative_rps)
      .map((r: LeaderboardRow,i: number)=>({...r,rank:i+1}));

      setRows(built);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = tab==="models"?rows.filter(r=>r.is_model):tab==="humans"?rows.filter(r=>!r.is_model):rows;

  return (
    <div>
      <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:20 }}>
        <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Leaderboard</h1>
        <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>Ranked by cumulative RPS — lower is better</span>
      </div>
      <div style={{ display:"flex",borderBottom:"1px solid #404040",marginBottom:16 }}>
        {(["all","models","humans"] as Tab[]).map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 16px",fontSize:10,fontWeight:600,textTransform:"uppercase" as const,letterSpacing:1,cursor:"pointer",border:"none",background:"transparent",fontFamily:F,borderBottom:tab===t?"2px solid #d4d4d4":"2px solid transparent",color:tab===t?"#d4d4d4":"#525252",marginBottom:-1,transition:"all 0.15s" }}>{t}</button>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign:"center" as const,padding:"60px 0",fontSize:11,color:"#525252",fontFamily:F }}>loading...</div>
      ) : rows.length===0 ? (
        <div style={{ textAlign:"center" as const,padding:"60px 0",fontSize:11,color:"#525252",fontFamily:F }}>no entries yet</div>
      ) : (
        <div style={{ border:"1px solid #404040",borderRadius:8,overflow:"hidden",background:"#262626" }}>
          <LeaderboardTable rows={filtered} />
        </div>
      )}
    </div>
  );
}
