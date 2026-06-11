import type { Fixture, Prediction, MatchStage, STAGE_MAP } from "./types";

export async function fetchFixtures(): Promise<Fixture[]> {
  const res = await fetch("/fixtures/wc2026_fixtures.json");
  const data = await res.json();
  return data.matches as Fixture[];
}

export async function fetchPredictions(model: "sunless" | "frank", stage: string): Promise<Prediction[]> {
  const res = await fetch(`/predictions/${model}_predictions_${stage}.json`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAllForStage(stage: string): Promise<{ sunless: Prediction[]; frank: Prediction[] }> {
  const [sunless, frank] = await Promise.all([
    fetchPredictions("sunless", stage),
    fetchPredictions("frank", stage),
  ]);
  return { sunless, frank };
}
