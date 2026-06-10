import { MatchCard } from "@/components/MatchCard";
import { MOCK_MATCHES } from "@/lib/mock";

const F = "'JetBrains Mono',monospace";

export default function MatchesPage() {
  const grouped: Record<string, typeof MOCK_MATCHES> = {};
  for (const m of MOCK_MATCHES) {
    const key = m.group_id ?? m.stage;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }
  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24 }}>
        {[
          { label:"Your Rank", value:"#3", sub:"of 12 players" },
          { label:"Your RPS", value:"0.181", sub:"lower is better" },
          { label:"Predicted", value:"14 / 48", sub:"group stage matches" },
        ].map(s => (
          <div key={s.label} style={{ background:"#262626",border:"1px solid #404040",borderRadius:7,padding:"14px 18px" }}>
            <div style={{ fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:"#525252",marginBottom:6,fontFamily:F }}>{s.label}</div>
            <div style={{ fontSize:26,fontWeight:700,color:"#f5f5f5",lineHeight:1,fontFamily:F }}>{s.value}</div>
            <div style={{ fontSize:10,color:"#525252",marginTop:4,fontFamily:F }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:16 }}>
        <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Group Stage</h1>
        <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>Predictions lock at kickoff · Times in NST</span>
      </div>
      <div style={{ display:"flex",flexDirection:"column" as const,gap:10 }}>
        {Object.entries(grouped).map(([group, matches]) => (
          <div key={group}>
            <div style={{ fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:"#525252",marginBottom:8,fontFamily:F }}>Group {group}</div>
            <div style={{ display:"flex",flexDirection:"column" as const,gap:8 }}>
              {matches.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
