"use client";
import type { PredictionWithUser } from "@/lib/types";
import { modelTextColor } from "@/lib/utils";

const F = "'JetBrains Mono',monospace";

export function ProbBar({ prediction }: { prediction: PredictionWithUser }) {
  const { p_win, p_draw, p_loss, username, is_model, model_color } = prediction;
  const tc = is_model ? modelTextColor(model_color) : "#d4d4d4";

  return (
    <div style={{ border:"1px solid #404040",background:"#1a1a1a",borderRadius:6,padding:"10px 12px" }}>
      <div style={{ fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:tc,marginBottom:7,fontFamily:F }}>
        {username}
      </div>
      <div style={{ height:5,background:"#262626",borderRadius:3,display:"flex",overflow:"hidden",gap:2,marginBottom:6 }}>
        <div style={{ height:"100%",background:tc,borderRadius:2,width:`${p_win*100}%`,transition:"width 0.5s ease" }} />
        <div style={{ height:"100%",background:"#525252",borderRadius:2,width:`${p_draw*100}%`,transition:"width 0.5s ease" }} />
        <div style={{ height:"100%",background:"#333",borderRadius:2,width:`${p_loss*100}%`,transition:"width 0.5s ease" }} />
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,fontWeight:600,fontFamily:F }}>
        <span style={{ color:tc }}>{(p_win*100).toFixed(0)}% W</span>
        <span style={{ color:"#525252" }}>{(p_draw*100).toFixed(0)}% D</span>
        <span style={{ color:"#404040" }}>{(p_loss*100).toFixed(0)}% L</span>
      </div>
    </div>
  );
}
