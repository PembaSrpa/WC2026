import type { ModelColor } from "./types";

export function modelTextColor(c: ModelColor): string {
  if (c === "blue") return "#60a5fa";
  if (c === "red") return "#f87171";
  if (c === "green") return "#4ade80";
  return "#d4d4d4";
}

export function rps(pPred: [number,number,number], outcome: "win"|"draw"|"loss"): number {
  const actual: [number,number,number] =
    outcome==="win" ? [1,0,0] : outcome==="draw" ? [0,1,0] : [0,0,1];
  let score = 0;
  for (let i = 0; i < 2; i++) {
    const cp = pPred.slice(0,i+1).reduce((a,b)=>a+b,0);
    const ca = actual.slice(0,i+1).reduce((a,b)=>a+b,0);
    score += Math.pow(cp-ca,2);
  }
  return score/2;
}
