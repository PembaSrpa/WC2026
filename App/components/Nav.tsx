"use client";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { label: "Matches", letter: "M", href: "/" },
  { label: "Groups", letter: "G", href: "/groups" },
  { label: "Bracket", letter: "B", href: "/bracket" },
  { label: "Leaderboard", letter: "L", href: "/leaderboard" },
];
const F = "'JetBrains Mono',monospace";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav style={{ position:"sticky",top:0,zIndex:50,borderBottom:"1px solid #262626",background:"#171717",padding:"0 calc(5vw + 12px)" }}>
      <div style={{ maxWidth:960,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:52 }}>
        <div style={{ fontFamily:F,fontSize:"clamp(11px,3vw,16px)",fontWeight:700,letterSpacing:3,color:"#f5f5f5" }}>
          WC<span style={{ color:"#525252" }}>2026</span>
        </div>
        <div style={{ display:"flex",gap:2,background:"#262626",borderRadius:6,padding:3,border:"1px solid #404040" }}>
          {TABS.map(t => {
            const active = pathname === t.href;
            return (
              <button key={t.href} onClick={() => router.push(t.href)} style={{ padding:"5px 10px",borderRadius:4,fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase" as const,cursor:"pointer",border:"none",background:active?"#404040":"transparent",color:active?"#f5f5f5":"#a3a3a3",transition:"all 0.15s",fontFamily:F }}>
                <span className="tab-full">{t.label}</span>
                <span className="tab-short">{active ? t.label : t.letter}</span>
              </button>
            );
          })}
        </div>
        <div className="nav-tagline" style={{ fontSize:10,color:"#a3a3a3",fontFamily:F,letterSpacing:1 }}>MODEL BATTLE</div>
      </div>
    </nav>
  );
}