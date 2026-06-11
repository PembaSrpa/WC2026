"use client";
import { useState } from "react";
import type { EnrichedMatch } from "@/lib/types";
import { ProbBar } from "./ProbBar";
import { supabase } from "@/lib/supabase";

const GOLD = "#C9A84C";
const F = "'JetBrains Mono',monospace";

export function MatchCard({ match, userId }: { match: EnrichedMatch; userId: string | null }) {
  const [pick, setPick] = useState<"win"|"draw"|"loss"|null>(match.my_pick);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");

  const { team_home, team_away, team_home_crest, team_away_crest,
          goals_home, goals_away, status, group, time_nst, sunless, frank } = match;

  const isLive = status === "IN_PLAY";
  const isDone = status === "FINISHED";
  const isLocked = isLive || isDone;

  async function handlePick(p: "win"|"draw"|"loss") {
    if (isLocked) return;
    if (!userId) { setFlash("sign in to predict"); setTimeout(()=>setFlash(""),2000); return; }
    setSaving(true);
    const { error } = await supabase.from("picks").upsert(
      { user_id:userId, match_id:match.match_id, pick:p },
      { onConflict:"user_id,match_id" }
    );
    if (!error) { setPick(p); setFlash("pick saved"); }
    else setFlash("error saving");
    setSaving(false);
    setTimeout(()=>setFlash(""),1500);
  }

  const statusLabel = isDone?"FT":isLive?"LIVE":"UPCOMING";
  const statusColor = isDone?"#525252":isLive?"#d4d4d4":"#404040";
  const outcome: "win"|"draw"|"loss"|null = isDone
    ? goals_home!>goals_away! ? "win" : goals_home!<goals_away! ? "loss" : "draw"
    : null;

  return (
    <div style={{ background:"#262626",border:"1px solid #404040",borderRadius:8,padding:"18px 22px",transition:"border-color 0.15s" }}
      onMouseEnter={e=>(e.currentTarget.style.borderColor="#525252")}
      onMouseLeave={e=>(e.currentTarget.style.borderColor="#404040")}
    >
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <span style={{ fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:"#d4d4d4",fontFamily:F }}>
          {group ? `Group ${group.replace("GROUP_","")}` : statusLabel}
        </span>
        <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>{time_nst} NST</span>
        <span style={{ fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:statusColor,background:"#171717",padding:"3px 8px",borderRadius:4,fontFamily:F }}>{statusLabel}</span>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:16,marginBottom:16 }}>
        <div style={{ display:"flex",flexDirection:"column" as const,gap:4 }}>
          <img src={team_home_crest} alt={team_home} style={{ width:32,height:32,objectFit:"contain" }} onError={e=>(e.currentTarget.style.display="none")} />
          <div style={{ fontSize:15,fontWeight:700,letterSpacing:0.5,color:"#f5f5f5",fontFamily:F }}>{team_home}</div>
        </div>
        <div style={{ textAlign:"center" as const,fontFamily:F }}>
          {isDone
            ? <span style={{ fontSize:22,fontWeight:700,color:"#f5f5f5",letterSpacing:4 }}>{goals_home} · {goals_away}</span>
            : <span style={{ fontSize:12,color:"#525252",letterSpacing:2 }}>VS</span>
          }
        </div>
        <div style={{ display:"flex",flexDirection:"column" as const,alignItems:"flex-end",gap:4 }}>
          <img src={team_away_crest} alt={team_away} style={{ width:32,height:32,objectFit:"contain" }} onError={e=>(e.currentTarget.style.display="none")} />
          <div style={{ fontSize:15,fontWeight:700,letterSpacing:0.5,color:"#f5f5f5",fontFamily:F,textAlign:"right" as const }}>{team_away}</div>
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12 }}>
        {sunless
          ? <ProbBar label="Sunless Model" color="blue" p_win={sunless.p_win} p_draw={sunless.p_draw} p_loss={sunless.p_loss} />
          : <div style={{ border:"1px solid #404040",background:"#1a1a1a",borderRadius:6,padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ fontSize:10,color:"#404040",fontFamily:F }}>no prediction</span></div>
        }
        {frank
          ? <ProbBar label="Frank Model" color="red" p_win={frank.p_win} p_draw={frank.p_draw} p_loss={frank.p_loss} />
          : <div style={{ border:"1px solid #404040",background:"#1a1a1a",borderRadius:6,padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ fontSize:10,color:"#404040",fontFamily:F }}>no prediction</span></div>
        }
      </div>

      {!isLocked ? (
        <div style={{ display:"flex",gap:6,borderTop:"1px solid #404040",paddingTop:12 }}>
          {(["win","draw","loss"] as const).map(p => {
            const label = p==="win"?`${team_home} Win`:p==="draw"?"Draw":`${team_away} Win`;
            const selected = pick===p;
            return (
              <button key={p} onClick={()=>handlePick(p)} disabled={saving} style={{ flex:1,padding:"7px 4px",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:F,transition:"all 0.15s",border:selected?`1px solid ${GOLD}`:"1px solid #404040",background:selected?"rgba(201,168,76,0.1)":"#171717",color:selected?GOLD:"#525252",boxShadow:selected?`0 0 0 1px rgba(201,168,76,0.2)`:"none" }}>
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid #404040",paddingTop:12 }}>
          {isLive && <span style={{ display:"flex",alignItems:"center",gap:6,fontSize:10,fontWeight:600,color:"#d4d4d4",fontFamily:F }}><span style={{ width:5,height:5,borderRadius:"50%",background:"#d4d4d4",display:"inline-block" }} />Live — predictions locked</span>}
          {isDone && <>
            <span style={{ fontSize:11,color:"#525252",fontFamily:F }}>Your pick: <strong style={{ color:pick&&pick===outcome?"#d4d4d4":"#404040" }}>{pick??"-"}</strong></span>
            <span style={{ fontSize:11,color:"#525252",fontFamily:F }}>Result: <strong style={{ color:"#d4d4d4" }}>{goals_home} - {goals_away}</strong></span>
          </>}
        </div>
      )}
      {flash && <div style={{ marginTop:6,textAlign:"center" as const,fontSize:10,color:flash==="pick saved"?GOLD:"#f87171",fontFamily:F }}>{flash}</div>}
    </div>
  );
}
