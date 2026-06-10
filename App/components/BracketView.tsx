import type { BracketMatch } from "@/lib/types";

const F = "'JetBrains Mono',monospace";
const STAGE_LABELS: Record<string,string> = { r32:"R32",r16:"R16",qf:"QF",sf:"SF",final:"Final" };
const STAGE_ORDER = ["r32","r16","qf","sf","final"];

function BracketTeamRow({ team, isWinner, prob }: {
  team: { id:string; name:string; flag:string } | null;
  isWinner: boolean;
  prob: string | null;
}) {
  return (
    <div style={{
      display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"7px 10px",borderBottom:"1px solid #404040",fontSize:11,fontFamily:F,
      background:isWinner?"#333":"transparent",
      color:!team?"#404040":isWinner?"#f5f5f5":"#a3a3a3",
      fontStyle:!team?"italic":"normal",fontWeight:isWinner?600:400,
    }}>
      <span>{team ? <><span style={{ marginRight:6 }}>{team.flag}</span>{team.name}</> : "TBD"}</span>
      {prob && <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>{prob}</span>}
    </div>
  );
}

function BracketRound({ stage, matches }: { stage:string; matches:BracketMatch[] }) {
  return (
    <div style={{ minWidth:150,display:"flex",flexDirection:"column" as const,gap:10 }}>
      <div style={{ textAlign:"center" as const,fontFamily:F,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:"uppercase" as const,color:"#525252",marginBottom:4 }}>
        {STAGE_LABELS[stage] ?? stage.toUpperCase()}
      </div>
      {matches.map(m => (
        <div key={m.id} style={{ border:"1px solid #404040",borderRadius:6,overflow:"hidden",background:"#262626" }}>
          <BracketTeamRow team={m.team_a} isWinner={m.winner_id!==null&&m.winner_id===m.team_a?.id} prob={m.model_p_win!==null?`${(m.model_p_win*100).toFixed(0)}%`:null} />
          <BracketTeamRow team={m.team_b} isWinner={m.winner_id!==null&&m.winner_id===m.team_b?.id} prob={m.model_p_win!==null?`${((1-m.model_p_win)*100).toFixed(0)}%`:null} />
        </div>
      ))}
    </div>
  );
}

export function BracketView({ bracket }: { bracket: Record<string,BracketMatch[]> }) {
  return (
    <div style={{ overflowX:"auto" as const,paddingBottom:16 }}>
      <div style={{ display:"flex",gap:20,minWidth:"max-content",alignItems:"flex-start" }}>
        {STAGE_ORDER.filter(s => bracket[s]?.length).map(stage => (
          <BracketRound key={stage} stage={stage} matches={bracket[stage]} />
        ))}
      </div>
    </div>
  );
}
