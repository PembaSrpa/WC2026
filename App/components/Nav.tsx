"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TABS = [
  { label:"Matches", href:"/" },
  { label:"Groups", href:"/groups" },
  { label:"Bracket", href:"/bracket" },
  { label:"Leaderboard", href:"/leaderboard" },
];
const F = "'JetBrains Mono',monospace";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string|null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async (res: any) => {
      const user = res.data.user;
      if (!user) { setUsername(null); return; }
      const { data } = await supabase.from("users").select("username").eq("id", user.id).single();
      setUsername(data?.username ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (!session) { setUsername(null); return; }
      const { data } = await supabase.from("users").select("username").eq("id", session.user.id).single();
      setUsername(data?.username ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase?.signOut?.();
    router.push("/login");
  }

  return (
    <nav style={{ position:"sticky",top:0,zIndex:50,borderBottom:"1px solid #262626",background:"#171717",padding:"0 60px" }}>
      <div style={{ maxWidth:960,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:52 }}>
        <div style={{ fontFamily:F,fontSize:18,fontWeight:700,letterSpacing:3,color:"#f5f5f5" }}>
          WC<span style={{ color:"#525252" }}>2026</span> PREDICT
        </div>
        <div style={{ display:"flex",gap:2,background:"#262626",borderRadius:6,padding:3,border:"1px solid #404040" }}>
          {TABS.map(t => {
            const active = pathname===t.href;
            return (
              <button key={t.href} onClick={()=>router.push(t.href)} style={{ padding:"5px 12px",borderRadius:4,fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase" as const,cursor:"pointer",border:"none",background:active?"#404040":"transparent",color:active?"#f5f5f5":"#525252",transition:"all 0.15s",fontFamily:F }}>
                {t.label}
              </button>
            );
          })}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:12,fontFamily:F }}>
          {username ? (
            <>
              <div style={{ width:28,height:28,borderRadius:"50%",background:"#262626",border:"1px solid #404040",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#d4d4d4" }}>{username[0].toUpperCase()}</div>
              <span style={{ color:"#a3a3a3" }}>{username}</span>
              <button onClick={handleSignOut} style={{ marginLeft:4,fontSize:10,color:"#525252",background:"none",border:"none",cursor:"pointer",fontFamily:F,textDecoration:"underline" }}>sign out</button>
            </>
          ) : (
            <button onClick={()=>router.push("/login")} style={{ fontSize:11,fontWeight:600,color:"#a3a3a3",background:"#262626",border:"1px solid #404040",borderRadius:5,padding:"5px 12px",cursor:"pointer",fontFamily:F }}>Sign in</button>
          )}
        </div>
      </div>
    </nav>
  );
}
