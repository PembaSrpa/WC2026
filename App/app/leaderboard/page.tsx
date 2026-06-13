"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchFixtures, fetchPredictions, computeRPS } from "@/lib/data";
import { modelTextColor } from "@/lib/utils";
import type { ModelColor } from "@/lib/types";

const F = "'JetBrains Mono',monospace";
const GOLD = "#C9A84C";
const POLL_MS = 60 * 60 * 1000;

const TEAM_CODE: Record<string, string> = {
  "Algeria":"ALG",
  "Argentina":"ARG",
  "Australia":"AUS",
  "Austria":"AUT",
  "Belgium":"BEL",
  "Bosnia-Herzegovina":"BIH",
  "Brazil":"BRA",
  "Canada":"CAN",
  "Cape Verde Islands":"CPV",
  "Colombia":"COL",
  "Congo DR":"COD",
  "Croatia":"CRO",
  "Curaçao":"CUW",
  "Czechia":"CZE",
  "Ecuador":"ECU",
  "Egypt":"EGY",
  "England":"ENG",
  "France":"FRA",
  "Germany":"GER",
  "Ghana":"GHA",
  "Haiti":"HAI",
  "Iran":"IRN",
  "Iraq":"IRQ",
  "Ivory Coast":"CIV",
  "Japan":"JPN",
  "Jordan":"JOR",
  "Mexico":"MEX",
  "Morocco":"MAR",
  "Netherlands":"NED",
  "New Zealand":"NZL",
  "Norway":"NOR",
  "Panama":"PAN",
  "Paraguay":"PAR",
  "Portugal":"POR",
  "Qatar":"QAT",
  "Saudi Arabia":"KSA",
  "Scotland":"SCO",
  "Senegal":"SEN",
  "South Africa":"RSA",
  "South Korea":"KOR",
  "Spain":"ESP",
  "Sweden":"SWE",
  "Switzerland":"SUI",
  "Tunisia":"TUN",
  "Turkey":"TUR",
  "United States":"USA",
  "Uruguay":"URU",
  "Uzbekistan":"UZB",
};

function toCode(name: string): string {
  return TEAM_CODE[name] ?? name.slice(0, 3).toUpperCase();
}

type ModelStat = {
  name: string;
  color: ModelColor;
  cumulative_rps: number;
  scored: number;
  per_match: number;
};

type MatchRPS = {
  match_id: string;
  date: string;
  team_home: string;
  team_away: string;
  outcome: string;
  sunless_rps: number | null;
  frank_rps: number | null;
};

export default function LeaderboardPage() {
  const [models, setModels] = useState<ModelStat[]>([]);
  const [matchRPS, setMatchRPS] = useState<MatchRPS[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const fixtures = await fetchFixtures();
    const finished = fixtures.filter(f=>f.status==="FINISHED"&&f.stage==="GROUP_STAGE");
    if (!finished.length) { setLoading(false); return; }

    const [sunless, frank] = await Promise.all([
      fetchPredictions("sunless","group"),
      fetchPredictions("frank","group"),
    ]);
    const sm = Object.fromEntries(sunless.map(p=>[p.match_id,p]));
    const fm = Object.fromEntries(frank.map(p=>[p.match_id,p]));

    let sunlessTotal=0, frankTotal=0, sunlessN=0, frankN=0;
    const rows: MatchRPS[] = [];

    for (const f of finished) {
      const gh=f.goals_home!, ga=f.goals_away!;
      const outcome: "win"|"draw"|"loss" = gh>ga?"win":gh<ga?"loss":"draw";
      const sp = sm[f.match_id];
      const fp = fm[f.match_id];
      const srps = sp ? computeRPS([sp.p_win,sp.p_draw,sp.p_loss], outcome) : null;
      const frps = fp ? computeRPS([fp.p_win,fp.p_draw,fp.p_loss], outcome) : null;
      if (srps!==null){sunlessTotal+=srps;sunlessN++;}
      if (frps!==null){frankTotal+=frps;frankN++;}
      rows.push({ match_id:f.match_id, date:f.date, team_home:f.team_home, team_away:f.team_away, outcome, sunless_rps:srps, frank_rps:frps });
    }

    rows.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
    setMatchRPS(rows);

    const ms: ModelStat[] = [];
    if (sunlessN) ms.push({ name:"Sunless", color:"blue", cumulative_rps:sunlessTotal, scored:sunlessN, per_match:sunlessTotal/sunlessN });
    if (frankN) ms.push({ name:"Frank", color:"red", cumulative_rps:frankTotal, scored:frankN, per_match:frankTotal/frankN });
    ms.sort((a,b)=>a.per_match-b.per_match);
    setModels(ms);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div>
      <div style={{ display:"flex",alignItems:"baseline",gap:10,marginBottom:24 }}>
        <h1 style={{ fontSize:20,fontWeight:700,letterSpacing:1,color:"#f5f5f5",fontFamily:F }}>Model Leaderboard</h1>
        <span style={{ fontSize:10,color:"#a3a3a3",fontFamily:F }}>RPS — lower is better</span>
      </div>

      {loading ? (
        <div style={{ textAlign:"center" as const,padding:"60px 0",fontSize:11,color:"#a3a3a3",fontFamily:F }}>loading...</div>
      ) : models.length===0 ? (
        <div style={{ textAlign:"center" as const,padding:"60px 0",fontSize:11,color:"#a3a3a3",fontFamily:F }}>no finished matches yet</div>
      ) : (
        <>
          <div className="model-cards-grid" style={{ marginBottom:32 }}>
            {models.map((m,i)=>{
              const tc = modelTextColor(m.color);
              const isLeading = i===0;
              return (
                <div key={m.name} style={{ background:"#262626",border:`1px solid ${isLeading?GOLD:"#404040"}`,borderRadius:10,padding:"20px 24px",position:"relative" as const }}>
                  {isLeading && <div style={{ position:"absolute" as const,top:12,right:14,fontSize:9,fontWeight:700,letterSpacing:1.5,color:GOLD,fontFamily:F }}>LEADING</div>}
                  <div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:tc,marginBottom:10,fontFamily:F }}>{m.name} Model</div>
                  <div style={{ fontSize:36,fontWeight:700,color:"#f5f5f5",fontFamily:F,lineHeight:1,marginBottom:4 }}>{m.per_match.toFixed(3)}</div>
                  <div style={{ fontSize:10,color:"#a3a3a3",fontFamily:F,marginBottom:16 }}>avg RPS per match</div>
                  <div style={{ display:"flex",gap:16 }}>
                    <div>
                      <div style={{ fontSize:9,color:"#a3a3a3",fontFamily:F,marginBottom:2 }}>CUMULATIVE</div>
                      <div style={{ fontSize:14,fontWeight:700,color:"#d4d4d4",fontFamily:F }}>{m.cumulative_rps.toFixed(3)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:9,color:"#a3a3a3",fontFamily:F,marginBottom:2 }}>SCORED</div>
                      <div style={{ fontSize:14,fontWeight:700,color:"#d4d4d4",fontFamily:F }}>{m.scored} matches</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:"#a3a3a3",marginBottom:12,fontFamily:F }}>Per Match Breakdown</div>
          <div style={{ border:"1px solid #404040",borderRadius:8,overflow:"hidden",background:"#262626" }}>
            <table style={{ width:"100%",borderCollapse:"collapse" as const }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #404040" }}>
                  <th style={{ padding:"10px 14px",fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:"#a3a3a3",textAlign:"left" as const,fontFamily:F }}>Match</th>
                  <th className="lb-hide-mobile" style={{ padding:"10px 14px",fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:"#a3a3a3",textAlign:"left" as const,fontFamily:F }}>Date</th>
                  <th className="lb-hide-mobile" style={{ padding:"10px 14px",fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:"#a3a3a3",textAlign:"left" as const,fontFamily:F }}>Result</th>
                  <th style={{ padding:"10px 14px",fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:"#a3a3a3",textAlign:"center" as const,fontFamily:F }}>Sunless</th>
                  <th style={{ padding:"10px 14px",fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:"#a3a3a3",textAlign:"center" as const,fontFamily:F }}>Frank</th>
                  <th className="lb-hide-mobile" style={{ padding:"10px 14px",fontSize:9,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1,color:"#a3a3a3",textAlign:"center" as const,fontFamily:F }}>Winner</th>
                </tr>
              </thead>
              <tbody>
                {matchRPS.map(r=>{
                  const sunlessWins = r.sunless_rps!==null&&r.frank_rps!==null&&r.sunless_rps<r.frank_rps;
                  const frankWins = r.sunless_rps!==null&&r.frank_rps!==null&&r.frank_rps<r.sunless_rps;
                  return (
                    <tr key={r.match_id} style={{ borderTop:"1px solid #333",transition:"background 0.1s" }}
                      onMouseEnter={e=>(e.currentTarget.style.background="#2a2a2a")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                    >
                      <td style={{ padding:"10px 14px",fontSize:11,color:"#f5f5f5",fontFamily:F }}>{toCode(r.team_home)} vs {toCode(r.team_away)}</td>
                      <td className="lb-hide-mobile" style={{ padding:"10px 14px",fontSize:11,color:"#a3a3a3",fontFamily:F }}>{r.date}</td>
                      <td className="lb-hide-mobile" style={{ padding:"10px 14px",fontSize:11,color:"#d4d4d4",fontFamily:F,textTransform:"uppercase" as const }}>{r.outcome}</td>
                      <td style={{ padding:"10px 14px",fontSize:13,fontWeight:700,textAlign:"center" as const,color:sunlessWins?"#60a5fa":"#d4d4d4",fontFamily:F }}>{r.sunless_rps!==null?r.sunless_rps.toFixed(3):"—"}</td>
                      <td style={{ padding:"10px 14px",fontSize:13,fontWeight:700,textAlign:"center" as const,color:frankWins?"#f87171":"#d4d4d4",fontFamily:F }}>{r.frank_rps!==null?r.frank_rps.toFixed(3):"—"}</td>
                      <td className="lb-hide-mobile" style={{ padding:"10px 14px",textAlign:"center" as const,fontFamily:F }}>
                        {sunlessWins&&<span style={{ fontSize:10,fontWeight:700,color:"#60a5fa" }}>SUNLESS</span>}
                        {frankWins&&<span style={{ fontSize:10,fontWeight:700,color:"#f87171" }}>FRANK</span>}
                        {!sunlessWins&&!frankWins&&<span style={{ fontSize:10,color:"#a3a3a3" }}>TIE</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}