"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const F = "'JetBrains Mono',monospace";
const GOLD = "#C9A84C";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/");
  }

  return (
    <div style={{ minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:360,background:"#262626",border:"1px solid #404040",borderRadius:10,padding:32 }}>
        <div style={{ fontFamily:F,fontSize:18,fontWeight:700,color:"#f5f5f5",marginBottom:6 }}>Sign in</div>
        <div style={{ fontFamily:F,fontSize:11,color:"#525252",marginBottom:24 }}>WC2026 Predict</div>
        {error && <div style={{ fontFamily:F,fontSize:11,color:"#f87171",marginBottom:16,padding:"8px 12px",background:"rgba(239,68,68,0.08)",borderRadius:5,border:"1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
        {["Email","Password"].map((label, i) => (
          <div key={label} style={{ marginBottom:14 }}>
            <div style={{ fontFamily:F,fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:"#525252",marginBottom:6 }}>{label}</div>
            <input
              type={i===1?"password":"email"}
              value={i===0?email:password}
              onChange={e => i===0?setEmail(e.target.value):setPassword(e.target.value)}
              onKeyDown={e => e.key==="Enter" && handleLogin()}
              style={{ width:"100%",background:"#171717",border:"1px solid #404040",borderRadius:5,padding:"8px 12px",fontFamily:F,fontSize:12,color:"#e5e5e5",outline:"none" }}
            />
          </div>
        ))}
        <button onClick={handleLogin} disabled={loading} style={{ width:"100%",padding:"9px",borderRadius:5,border:`1px solid ${GOLD}`,background:`rgba(201,168,76,0.1)`,color:GOLD,fontFamily:F,fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,cursor:"pointer",marginTop:8 }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <div style={{ textAlign:"center" as const,marginTop:16,fontFamily:F,fontSize:11,color:"#525252" }}>
          No account?{" "}
          <span onClick={() => router.push("/signup")} style={{ color:"#a3a3a3",cursor:"pointer",textDecoration:"underline" }}>Sign up</span>
        </div>
      </div>
    </div>
  );
}
