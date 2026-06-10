import { GroupTable } from "@/components/GroupTable";
import { MOCK_STANDINGS } from "@/lib/mock";

const F = "'JetBrains Mono',monospace";

export default function GroupsPage() {
  return (
    <div>
      <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:24 }}>
        <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Group Standings</h1>
        <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>Top 2 + 8 best 3rd place teams qualify</span>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12 }}>
        {Object.entries(MOCK_STANDINGS).map(([group,standings]) => (
          <GroupTable key={group} group={group} standings={standings} />
        ))}
      </div>
    </div>
  );
}
