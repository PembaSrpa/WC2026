import type { ModelColor } from "./utils";

export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "final";

export type PredictionWithUser = {
  user_id: string;
  username: string;
  is_model: boolean;
  model_color: ModelColor;
  p_win: number;
  p_draw: number;
  p_loss: number;
};

export type MatchWithDetails = {
  id: string;
  stage: Stage;
  group_id: string | null;
  kickoff_utc: string;
  predictions_locked: boolean;
  team_a: { id: string; name: string; flag: string; elo_rank: number };
  team_b: { id: string; name: string; flag: string; elo_rank: number };
  result: { goals_a: number; goals_b: number; outcome: "win" | "draw" | "loss" } | null;
  predictions: PredictionWithUser[];
  my_pick: "win" | "draw" | "loss" | null;
};

export type GroupStanding = {
  team: { id: string; name: string; flag: string };
  played: number; won: number; drawn: number; lost: number;
  gf: number; ga: number; points: number; qualified: boolean;
};

export type BracketMatch = {
  id: string;
  stage: Stage;
  team_a: { id: string; name: string; flag: string } | null;
  team_b: { id: string; name: string; flag: string } | null;
  winner_id: string | null;
  model_p_win: number | null;
};

export type LeaderboardRow = {
  rank: number;
  user_id: string;
  username: string;
  is_model: boolean;
  model_color: ModelColor;
  cumulative_rps: number;
  matches_predicted: number;
  accuracy: number;
};
