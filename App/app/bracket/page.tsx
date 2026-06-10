import { BracketView } from "@/components/BracketView";
import { MOCK_BRACKET } from "@/lib/mock";

const F = "'JetBrains Mono',monospace";

export default function BracketPage() {
  return (
    <div>
      <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:24 }}>
        <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Knockout Bracket</h1>
        <span style={{ fontSize:10,color:"#525252",fontFamily:F }}>Model win probabilities shown per tie</span>
      </div>
      <BracketView bracket={MOCK_BRACKET} />
    </div>
  );
}
