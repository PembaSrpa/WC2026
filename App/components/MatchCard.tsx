"use client";
import { useState } from "react";
import type { MatchWithDetails } from "@/lib/types";
import { ProbBar } from "./ProbBar";
import { formatNST } from "@/lib/utils";

const GOLD = "#C9A84C";
const F = "'JetBrains Mono',monospace";

export function MatchCard({ match }: { match: MatchWithDetails }) {
  const [pick, setPick] = useState<"win"|"draw"|"loss"|null>(match.my_pick);
  const [flash, setFlash] = useState(false);
  const { team_a, team_b, result, predictions, predictions_locked, kickoff_utc, group_id } = match;
  const isLive = predictions_locked && !result;
  const isDone = !!result;

  function handlePick(p: "win"|"draw"|"loss") {
    if (predictions_locked) return;
    setPick(p);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }

  const statusLabel = isDone ? "FT" : isLive ? "LIVE" : "UPCOMING";
  const statusColor = isDone ? "#525252" : isLive ? "#d4d4d4" : "#404040";

  return (
    <div
      style={{ background:"#262626",border:"1px solid #404040",borderRadius:8,padding:"18px 22px",transition:"border-color 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor="#525252")}
      onMouseLeave={e => (e.currentTarget.style.borderColor="#404040")}
    >
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <span style={{ fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:"#d4d4d4",fontFamily:F }}>Group {group_id}</span>
        <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>{formatNST(kickoff_utc)}</span>
        <span style={{ fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:statusColor,background:"#171717",padding:"3px 8px",borderRadius:4,fontFamily:F }}>{statusLabel}</span>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:16,marginBottom:16 }}>
        <div>
          <div style={{ fontSize:26,lineHeight:1,marginBottom:4 }}>{team_a.flag}</div>
          <div style={{ fontSize:16,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>{team_a.name}</div>
          <div style={{ fontSize:10,color:"#525252",marginTop:2,fontFamily:F }}>ELO #{team_a.elo_rank}</div>
        </div>
        <div style={{ textAlign:"center" as const,fontFamily:F }}>
          {isDone
            ? <span style={{ fontSize:24,fontWeight:700,color:"#f5f5f5",letterSpacing:4 }}>{result!.goals_a} · {result!.goals_b}</span>
            : <span style={{ fontSize:12,color:"#525252",letterSpacing:2 }}>VS</span>
          }
        </div>
        <div style={{ textAlign:"right" as const }}>
          <div style={{ fontSize:26,lineHeight:1,marginBottom:4 }}>{team_b.flag}</div>
          <div style={{ fontSize:16,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>{team_b.name}</div>
          <div style={{ fontSize:10,color:"#525252",marginTop:2,fontFamily:F }}>ELO #{team_b.elo_rank}</div>
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12 }}>
        {predictions.map(p => <ProbBar key={p.user_id} prediction={p} />)}
      </div>

      {!predictions_locked ? (
        <div style={{ display:"flex",gap:6,borderTop:"1px solid #404040",paddingTop:12 }}>
          {(["win","draw","loss"] as const).map(p => {
            const label = p==="win" ? `${team_a.name} Win` : p==="draw" ? "Draw" : `${team_b.name} Win`;
            const selected = pick === p;
            return (
              <button key={p} onClick={() => handlePick(p)} style={{
                flex:1,padding:"7px 4px",borderRadius:5,fontSize:10,fontWeight:600,
                cursor:"pointer",fontFamily:F,transition:"all 0.15s",
                border:selected ? `1px solid ${GOLD}` : "1px solid #404040",
                background:selected ? "rgba(201,168,76,0.1)" : "#171717",
                color:selected ? GOLD : "#525252",
                boxShadow:selected ? `0 0 0 1px rgba(201,168,76,0.2)` : "none",
              }}>
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid #404040",paddingTop:12 }}>
          {isLive && (
            <span style={{ display:"flex",alignItems:"center",gap:6,fontSize:10,fontWeight:600,color:"#d4d4d4",fontFamily:F }}>
              <span style={{ width:5,height:5,borderRadius:"50%",background:"#d4d4d4",display:"inline-block" }} />
              Live — predictions locked
            </span>
          )}
          {isDone && (
            <>
              <span style={{ fontSize:11,color:"#525252",fontFamily:F }}>Your pick: <strong style={{ color:pick===result!.outcome ? "#d4d4d4" : "#404040" }}>{pick ?? "—"}</strong></span>
              <span style={{ fontSize:11,color:"#525252",fontFamily:F }}>Result: <strong style={{ color:"#d4d4d4" }}>{result!.outcome}</strong></span>
            </>
          )}
        </div>
      )}
      {flash && <div style={{ marginTop:6,textAlign:"center" as const,fontSize:10,color:GOLD,fontFamily:F }}>pick saved</div>}
    </div>
  );
}
