"use client";
import type { EnrichedMatch, MatchStage } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/types";

const F = "'JetBrains Mono',monospace";
const KNOCKOUT_STAGES: MatchStage[] = ["LAST_32","LAST_16","QUARTER_FINALS","SEMI_FINALS","FINAL"];

function BracketMatch({ match }: { match: EnrichedMatch }) {
  const isDone = match.status === "FINISHED";
  const homeWon = isDone && match.goals_home! > match.goals_away!;
  const awayWon = isDone && match.goals_away! > match.goals_home!;

  function TeamRow({ name, crest, won, pWin }: { name:string; crest:string; won:boolean; pWin:number|null }) {
    return (
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderBottom:"1px solid #404040",fontSize:11,fontFamily:F,background:won?"#333":"transparent",color:won?"#f5f5f5":"#a3a3a3",fontWeight:won?600:400 }}>
        <div style={{ display:"flex",alignItems:"center",gap:7 }}>
          <img src={crest} alt={name} style={{ width:14,height:14,objectFit:"contain" }} onError={e=>(e.currentTarget.style.display="none")} />
          <span>{name}</span>
        </div>
        {pWin!==null && <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>{(pWin*100).toFixed(0)}%</span>}
      </div>
    );
  }

  return (
    <div style={{ border:"1px solid #404040",borderRadius:6,overflow:"hidden",background:"#262626" }}>
      <TeamRow name={match.team_home} crest={match.team_home_crest} won={homeWon} pWin={match.sunless?.p_win??null} />
      <TeamRow name={match.team_away} crest={match.team_away_crest} won={awayWon} pWin={match.sunless?.p_loss??null} />
    </div>
  );
}

export function BracketView({ matches }: { matches: EnrichedMatch[] }) {
  return (
    <div style={{ overflowX:"auto" as const,paddingBottom:16 }}>
      <div style={{ display:"flex",gap:20,minWidth:"max-content",alignItems:"flex-start" }}>
        {KNOCKOUT_STAGES.map(stage => {
          const stageMatches = matches.filter(m=>m.stage===stage);
          if (!stageMatches.length) return null;
          return (
            <div key={stage} style={{ minWidth:160,display:"flex",flexDirection:"column" as const,gap:10 }}>
              <div style={{ textAlign:"center" as const,fontFamily:F,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:"uppercase" as const,color:"#525252",marginBottom:4 }}>
                {STAGE_LABEL[stage]}
              </div>
              {stageMatches.map(m => <BracketMatch key={m.match_id} match={m} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
