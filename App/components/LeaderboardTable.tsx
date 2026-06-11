"use client";
import type { LeaderboardRow } from "@/lib/types";
import { modelTextColor } from "@/lib/utils";

const F = "'JetBrains Mono',monospace";
const GOLD = "#C9A84C";

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <table style={{ width:"100%",borderCollapse:"collapse" as const }}>
      <thead>
        <tr style={{ borderBottom:"1px solid #404040" }}>
          {["Rank","Player","Type","RPS","Predicted","Accuracy"].map((h,i) => (
            <th key={h} style={{ padding:"10px 14px",fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:"#525252",textAlign:i<2?"left" as const:"center" as const,fontFamily:F }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(r => {
          const rankColor = r.rank===1?GOLD:r.rank===2?"#d4d4d4":r.rank===3?"#a3a3a3":"#525252";
          const tc = r.is_model ? modelTextColor(r.model_color) : "#d4d4d4";
          return (
            <tr key={r.user_id} style={{ borderTop:"1px solid #262626",transition:"background 0.1s" }}
              onMouseEnter={e=>(e.currentTarget.style.background="#2a2a2a")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
            >
              <td style={{ padding:"12px 14px",fontSize:18,fontWeight:700,color:rankColor,fontFamily:F }}>{r.rank}</td>
              <td style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <div style={{ width:26,height:26,borderRadius:"50%",background:"#262626",border:"1px solid #404040",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:tc,fontFamily:F }}>{r.username[0].toUpperCase()}</div>
                  <span style={{ fontSize:12,color:tc,fontFamily:F }}>{r.username}</span>
                </div>
              </td>
              <td style={{ padding:"12px 14px",textAlign:"center" as const }}>
                <span style={{ fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:3,textTransform:"uppercase" as const,letterSpacing:1,fontFamily:F,background:"#1a1a1a",color:r.is_model?tc:"#525252",border:"1px solid #404040" }}>
                  {r.is_model?"model":"human"}
                </span>
              </td>
              <td style={{ padding:"12px 14px",textAlign:"center" as const,fontSize:16,fontWeight:700,color:"#e5e5e5",fontFamily:F }}>{r.cumulative_rps.toFixed(3)}</td>
              <td style={{ padding:"12px 14px",textAlign:"center" as const,fontSize:11,color:"#525252",fontFamily:F }}>{r.matches_predicted}</td>
              <td style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                  <div style={{ width:80,height:3,background:"#333",borderRadius:2,overflow:"hidden" }}>
                    <div style={{ height:"100%",background:"#a3a3a3",borderRadius:2,width:`${r.accuracy*100}%` }} />
                  </div>
                  <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>{(r.accuracy*100).toFixed(0)}%</span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
