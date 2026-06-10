import type { GroupStanding } from "@/lib/types";

const F = "'JetBrains Mono',monospace";

export function GroupTable({ group, standings }: { group: string; standings: GroupStanding[] }) {
  const sorted = [...standings].sort((a,b) => {
    if (b.points !== a.points) return b.points - a.points;
    if ((b.gf-b.ga) !== (a.gf-a.ga)) return (b.gf-b.ga)-(a.gf-a.ga);
    return b.gf - a.gf;
  });
  return (
    <div style={{ border:"1px solid #404040",borderRadius:8,overflow:"hidden",background:"#262626" }}>
      <div style={{ background:"#1a1a1a",borderBottom:"1px solid #404040",padding:"10px 14px" }}>
        <span style={{ fontFamily:F,fontSize:12,fontWeight:700,letterSpacing:2,color:"#d4d4d4" }}>Group {group}</span>
      </div>
      <table style={{ width:"100%",borderCollapse:"collapse" as const }}>
        <thead>
          <tr>
            {["Team","P","W","D","L","GF","GA","Pts"].map((h,i) => (
              <th key={h} style={{ padding:"6px 10px",fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:"#525252",textAlign:i===0?"left" as const:"center" as const,fontFamily:F,paddingLeft:i===0?14:undefined,paddingRight:i===7?14:undefined }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(s => (
            <tr key={s.team.id} style={{ borderTop:"1px solid #404040" }}>
              <td style={{ padding:"8px 10px 8px 14px",fontSize:11,fontWeight:500,color:s.qualified?"#e5e5e5":"#525252",fontFamily:F }}>
                <span style={{ marginRight:6 }}>{s.team.flag}</span>{s.team.name}
                {s.qualified && <span style={{ marginLeft:6,fontSize:9,color:"#a3a3a3" }}>✓</span>}
              </td>
              {[s.played,s.won,s.drawn,s.lost,s.gf,s.ga].map((v,i) => (
                <td key={i} style={{ padding:"8px 10px",fontSize:11,textAlign:"center" as const,color:s.qualified?"#a3a3a3":"#525252",fontFamily:F }}>{v}</td>
              ))}
              <td style={{ padding:"8px 14px 8px 10px",fontSize:11,textAlign:"center" as const,fontWeight:700,color:s.qualified?"#e5e5e5":"#525252",fontFamily:F }}>{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
