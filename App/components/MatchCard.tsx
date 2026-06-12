"use client";
import { ProbBar } from "./ProbBar";
import { formatDate } from "@/lib/utils";
import type { EnrichedMatch } from "@/lib/types";

const F = "'JetBrains Mono',monospace";

export function MatchCard({ match }: { match: EnrichedMatch }) {
  const { team_home, team_away, team_home_crest, team_away_crest,
          goals_home, goals_away, status, group, time_nst, date, sunless, frank } = match;

  const isDone = status === "FINISHED";
  const isLive = status === "IN_PLAY";
  const statusLabel = isDone ? "FT" : isLive ? "LIVE" : "UPCOMING";
  const statusColor = isLive ? "#f5f5f5" : isDone ? "#a3a3a3" : "#a3a3a3";

  return (
    <div style={{ background:"#262626",border:"1px solid #404040",borderRadius:8,padding:"16px 18px",transition:"border-color 0.15s" }}
      onMouseEnter={e=>(e.currentTarget.style.borderColor="#666")}
      onMouseLeave={e=>(e.currentTarget.style.borderColor="#404040")}
    >
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
        <span style={{ fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:"#e5e5e5",fontFamily:F }}>
          {group ? `Group ${group.replace("GROUP_","")}` : ""}
        </span>
        <span style={{ fontSize:10,color:"#a3a3a3",fontFamily:F }}>{formatDate(date, time_nst)}</span>
        <span style={{ fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:statusColor,background:"#171717",padding:"3px 8px",borderRadius:4,fontFamily:F,
          ...(isLive ? { animation:"none" } : {})
        }}>{statusLabel}</span>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:12,marginBottom:14 }}>
        <div style={{ display:"flex",flexDirection:"column" as const,gap:4 }}>
          <img src={team_home_crest} alt={team_home} width={28} height={28} style={{ objectFit:"contain" }} onError={e=>(e.currentTarget.style.visibility="hidden")} />
          <div style={{ fontSize:14,fontWeight:700,color:"#f5f5f5",fontFamily:F,lineHeight:1.2 }}>{team_home}</div>
        </div>
        <div style={{ textAlign:"center" as const,fontFamily:F,minWidth:60 }}>
          {isDone
            ? <span style={{ fontSize:22,fontWeight:700,color:"#f5f5f5",letterSpacing:3 }}>{goals_home} · {goals_away}</span>
            : <span style={{ fontSize:11,color:"#a3a3a3",letterSpacing:2 }}>VS</span>
          }
        </div>
        <div style={{ display:"flex",flexDirection:"column" as const,alignItems:"flex-end",gap:4 }}>
          <img src={team_away_crest} alt={team_away} width={28} height={28} style={{ objectFit:"contain" }} onError={e=>(e.currentTarget.style.visibility="hidden")} />
          <div style={{ fontSize:14,fontWeight:700,color:"#f5f5f5",fontFamily:F,textAlign:"right" as const,lineHeight:1.2 }}>{team_away}</div>
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
        {sunless
          ? <ProbBar label="Sunless" color="blue" p_win={sunless.p_win} p_draw={sunless.p_draw} p_loss={sunless.p_loss} />
          : <div style={{ border:"1px solid #333",background:"#1a1a1a",borderRadius:6,padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ fontSize:10,color:"#666",fontFamily:F }}>no prediction</span></div>
        }
        {frank
          ? <ProbBar label="Frank" color="red" p_win={frank.p_win} p_draw={frank.p_draw} p_loss={frank.p_loss} />
          : <div style={{ border:"1px solid #333",background:"#1a1a1a",borderRadius:6,padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ fontSize:10,color:"#666",fontFamily:F }}>no prediction</span></div>
        }
      </div>
    </div>
  );
}
