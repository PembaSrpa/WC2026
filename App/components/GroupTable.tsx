"use client";
import type { EnrichedMatch } from "@/lib/types";

const F = "'JetBrains Mono',monospace";

type TeamStat = {
  name: string; crest: string;
  played: number; won: number; drawn: number; lost: number;
  gf: number; ga: number; points: number;
};

function buildStandings(matches: EnrichedMatch[]): TeamStat[] {
  const stats: Record<string,TeamStat> = {};
  for (const m of matches) {
    for (const [name,crest] of [[m.team_home,m.team_home_crest],[m.team_away,m.team_away_crest]] as [string,string][]) {
      if (!stats[name]) stats[name]={name,crest,played:0,won:0,drawn:0,lost:0,gf:0,ga:0,points:0};
    }
    if (m.status!=="FINISHED") continue;
    const gh=m.goals_home!, ga=m.goals_away!;
    stats[m.team_home].played++; stats[m.team_away].played++;
    stats[m.team_home].gf+=gh; stats[m.team_home].ga+=ga;
    stats[m.team_away].gf+=ga; stats[m.team_away].ga+=gh;
    if (gh>ga){stats[m.team_home].won++;stats[m.team_home].points+=3;stats[m.team_away].lost++;}
    else if (gh<ga){stats[m.team_away].won++;stats[m.team_away].points+=3;stats[m.team_home].lost++;}
    else{stats[m.team_home].drawn++;stats[m.team_home].points++;stats[m.team_away].drawn++;stats[m.team_away].points++;}
  }
  return Object.values(stats).sort((a,b)=>b.points-a.points||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf);
}

export function GroupTable({ group, matches }: { group: string; matches: EnrichedMatch[] }) {
  const standings = buildStandings(matches);
  return (
    <div style={{ border:"1px solid #404040",borderRadius:8,overflow:"hidden",background:"#262626" }}>
      <div style={{ background:"#1a1a1a",borderBottom:"1px solid #404040",padding:"10px 14px" }}>
        <span style={{ fontFamily:F,fontSize:12,fontWeight:700,letterSpacing:2,color:"#f5f5f5" }}>Group {group}</span>
      </div>
      <table style={{ width:"100%",borderCollapse:"collapse" as const }}>
        <thead>
          <tr>
            {["Team","P","W","D","L","GF","GA","Pts"].map((h,i)=>(
              <th key={h} style={{ padding:"6px 8px",fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:"#a3a3a3",textAlign:i===0?"left" as const:"center" as const,fontFamily:F,paddingLeft:i===0?14:undefined,paddingRight:i===7?14:undefined }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((s,i)=>(
            <tr key={s.name} style={{ borderTop:"1px solid #333" }}>
              <td style={{ padding:"8px 8px 8px 14px",fontSize:11,fontWeight:500,color:i<2?"#f5f5f5":"#a3a3a3",fontFamily:F }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <img src={s.crest} alt={s.name} width={14} height={14} style={{ objectFit:"contain" }} onError={e=>(e.currentTarget.style.visibility="hidden")} />
                  {s.name}
                  {i<2&&<span style={{ fontSize:9,color:"#a3a3a3" }}>✓</span>}
                </div>
              </td>
              {[s.played,s.won,s.drawn,s.lost,s.gf,s.ga].map((v,j)=>(
                <td key={j} style={{ padding:"8px",fontSize:11,textAlign:"center" as const,color:i<2?"#d4d4d4":"#a3a3a3",fontFamily:F }}>{v}</td>
              ))}
              <td style={{ padding:"8px 14px 8px 8px",fontSize:11,textAlign:"center" as const,fontWeight:700,color:i<2?"#f5f5f5":"#a3a3a3",fontFamily:F }}>{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
