"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const F = "'JetBrains Mono',monospace";
const GOLD = "#C9A84C";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setLoading(true);
    setError("");
    if (!username.trim()) { setError("Username required"); setLoading(false); return; }
    const { data, error: signupError } = await supabase.auth.signUp({ email, password });
    if (signupError) { setError(signupError.message); setLoading(false); return; }
    if (data.user) {
      const { error: profileError } = await supabase.from("users").insert({ id: data.user.id, username: username.trim() });
      if (profileError) { setError(profileError.message); setLoading(false); return; }
    }
    router.push("/");
  }

  return (
    <div style={{ minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:360,background:"#262626",border:"1px solid #404040",borderRadius:10,padding:32 }}>
        <div style={{ fontFamily:F,fontSize:18,fontWeight:700,color:"#f5f5f5",marginBottom:6 }}>Create account</div>
        <div style={{ fontFamily:F,fontSize:11,color:"#525252",marginBottom:24 }}>WC2026 Predict</div>
        {error && <div style={{ fontFamily:F,fontSize:11,color:"#f87171",marginBottom:16,padding:"8px 12px",background:"rgba(239,68,68,0.08)",borderRadius:5,border:"1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
        {[["Username","text",username,setUsername],["Email","email",email,setEmail],["Password","password",password,setPassword]].map(([label,type,val,setter]) => (
          <div key={label as string} style={{ marginBottom:14 }}>
            <div style={{ fontFamily:F,fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:"#525252",marginBottom:6 }}>{label as string}</div>
            <input
              type={type as string}
              value={val as string}
              onChange={e => (setter as (v:string)=>void)(e.target.value)}
              onKeyDown={e => e.key==="Enter" && handleSignup()}
              style={{ width:"100%",background:"#171717",border:"1px solid #404040",borderRadius:5,padding:"8px 12px",fontFamily:F,fontSize:12,color:"#e5e5e5",outline:"none" }}
            />
          </div>
        ))}
        <button onClick={handleSignup} disabled={loading} style={{ width:"100%",padding:"9px",borderRadius:5,border:`1px solid ${GOLD}`,background:`rgba(201,168,76,0.1)`,color:GOLD,fontFamily:F,fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,cursor:"pointer",marginTop:8 }}>
          {loading ? "Creating..." : "Create account"}
        </button>
        <div style={{ textAlign:"center" as const,marginTop:16,fontFamily:F,fontSize:11,color:"#525252" }}>
          Have an account?{" "}
          <span onClick={() => router.push("/login")} style={{ color:"#a3a3a3",cursor:"pointer",textDecoration:"underline" }}>Sign in</span>
        </div>
      </div>
    </div>
  );
}
