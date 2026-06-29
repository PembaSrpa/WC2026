"use client";
import type { EnrichedMatch } from "@/lib/types";
import { STAGE_LABEL, KNOCKOUT_STAGES } from "@/lib/types";

const F = "'JetBrains Mono',monospace";

function BracketMatch({ match }: { match: EnrichedMatch }) {
  const isDone = match.status === "FINISHED";
  const homeWon = isDone && match.goals_home! > match.goals_away!;
  const awayWon = isDone && match.goals_away! > match.goals_home!;

  function Row({ name, crest, won }: { name: string; crest: string; won: boolean }) {
    return (
      <div style={{ display:"flex",alignItems:"center",padding:"7px 10px",borderBottom:"1px solid #333",fontSize:11,fontFamily:F,background:won?"#333":"transparent",color:won?"#f5f5f5":"#d4d4d4",fontWeight:won?600:400 }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,minWidth:0 }}>
          <img src={crest} alt={name} width={13} height={13} style={{ objectFit:"contain",flexShrink:0 }} onError={e=>(e.currentTarget.style.visibility="hidden")} />
          <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const }}>{name}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border:"1px solid #404040",borderRadius:6,overflow:"hidden",background:"#262626" }}>
      <Row name={match.team_home} crest={match.team_home_crest} won={homeWon} />
      <Row name={match.team_away} crest={match.team_away_crest} won={awayWon} />
    </div>
  );
}

function TBDMatch() {
  return (
    <div style={{ border:"1px solid #333",borderRadius:6,overflow:"hidden",background:"#1e1e1e" }}>
      {["",""].map((_,i)=>(
        <div key={i} style={{ padding:"7px 10px",borderBottom:i===0?"1px solid #333":"none",fontSize:11,fontFamily:F,color:"#666",fontStyle:"italic" }}>TBD</div>
      ))}
    </div>
  );
}

export function BracketView({ matches }: { matches: EnrichedMatch[] }) {
  return (
    <div style={{ overflowX:"auto",paddingBottom:16 }}>
      <div style={{ display:"flex",gap:16,minWidth:"max-content",alignItems:"flex-start" }}>
        {KNOCKOUT_STAGES.map(stage=>{
          const sm = matches.filter(m=>m.stage===stage);
          if (!sm.length) return null;
          return (
            <div key={stage} style={{ minWidth:155,display:"flex",flexDirection:"column" as const,gap:8 }}>
              <div style={{ textAlign:"center" as const,fontFamily:F,fontSize:9,fontWeight:700,letterSpacing:2,textTransform:"uppercase" as const,color:"#a3a3a3",marginBottom:4 }}>
                {STAGE_LABEL[stage]}
              </div>
              {sm.map(m=>
                m.team_home==="TBD"||!m.team_home
                  ? <TBDMatch key={m.match_id} />
                  : <BracketMatch key={m.match_id} match={m} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
