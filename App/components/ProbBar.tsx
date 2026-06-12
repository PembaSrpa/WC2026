import { modelTextColor } from "@/lib/utils";
import type { ModelColor } from "@/lib/types";

const F = "'JetBrains Mono',monospace";

type Props = {
  label: string;
  color: ModelColor;
  p_win: number;
  p_draw: number;
  p_loss: number;
};

export function ProbBar({ label, color, p_win, p_draw, p_loss }: Props) {
  const tc = modelTextColor(color);
  return (
    <div style={{ border:"1px solid #404040",background:"#1a1a1a",borderRadius:6,padding:"10px 12px" }}>
      <div style={{ fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:tc,marginBottom:7,fontFamily:F }}>{label}</div>
      <div style={{ height:5,background:"#262626",borderRadius:3,display:"flex",overflow:"hidden",gap:2,marginBottom:6 }}>
        <div style={{ height:"100%",background:tc,borderRadius:2,width:`${p_win*100}%`,transition:"width 0.5s ease" }} />
        <div style={{ height:"100%",background:"#666",borderRadius:2,width:`${p_draw*100}%`,transition:"width 0.5s ease" }} />
        <div style={{ height:"100%",background:"#444",borderRadius:2,width:`${p_loss*100}%`,transition:"width 0.5s ease" }} />
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,fontWeight:600,fontFamily:F }}>
        <span style={{ color:tc }}>{(p_win*100).toFixed(0)}% W</span>
        <span style={{ color:"#a3a3a3" }}>{(p_draw*100).toFixed(0)}% D</span>
        <span style={{ color:"#a3a3a3" }}>{(p_loss*100).toFixed(0)}% L</span>
      </div>
    </div>
  );
}
