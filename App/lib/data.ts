import type { Fixture, Prediction, EnrichedMatch } from "./types";

export async function fetchFixtures(): Promise<Fixture[]> {
  try {
    const res = await fetch("/api/fixtures");
    if (!res.ok) throw new Error("API failed");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.fixtures as Fixture[];
  } catch {
    try {
      const res = await fetch("/fixtures/wc2026_fixtures.json");
      if (!res.ok) return [];
      const data = await res.json();
      return data.matches as Fixture[];
    } catch {
      return [];
    }
  }
}

export async function fetchPredictions(model: string, stage: string): Promise<Prediction[]> {
  try {
    const res = await fetch(`/predictions/${model}_predictions_${stage}.json`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function enrichFixtures(fixtures: Fixture[], stage: string): Promise<EnrichedMatch[]> {
  const [sunless, frank] = await Promise.all([
    fetchPredictions("sunless", stage),
    fetchPredictions("frank", stage),
  ]);
  const sm = Object.fromEntries(sunless.map(p=>[p.match_id,p]));
  const fm = Object.fromEntries(frank.map(p=>[p.match_id,p]));
  return fixtures.map(f=>({
    ...f,
    sunless: sm[f.match_id] ?? null,
    frank: fm[f.match_id] ?? null,
  }));
}

export function computeRPS(pPred: [number,number,number], outcome: "win"|"draw"|"loss"): number {
  const actual: [number,number,number] =
    outcome==="win"?[1,0,0]:outcome==="draw"?[0,1,0]:[0,0,1];
  let score = 0;
  for (let i=0;i<2;i++) {
    const cp = pPred.slice(0,i+1).reduce((a,b)=>a+b,0);
    const ca = actual.slice(0,i+1).reduce((a,b)=>a+b,0);
    score += Math.pow(cp-ca,2);
  }
  return score/2;
}
