import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export type Database = {
  teams: Team;
  matches: Match;
  results: MatchResult;
  predictions: Prediction;
  standings: Standing;
  users: AppUser;
  leaderboard: LeaderboardEntry;
};

export type Team = {
  id: string;
  name: string;
  flag: string;
  group_id: string;
  elo_rank: number;
};

export type Match = {
  id: string;
  stage: "group" | "r32" | "r16" | "qf" | "sf" | "final";
  group_id: string | null;
  team_a_id: string;
  team_b_id: string;
  kickoff_utc: string;
  predictions_locked: boolean;
};

export type MatchResult = {
  id: string;
  match_id: string;
  goals_a: number;
  goals_b: number;
  outcome: "win" | "draw" | "loss";
  confirmed_at: string;
  confirmed_by: string;
};

export type Prediction = {
  id: string;
  match_id: string;
  user_id: string;
  p_win: number;
  p_draw: number;
  p_loss: number;
  is_model: boolean;
  model_name: string | null;
  submitted_at: string;
};

export type Standing = {
  id: string;
  group_id: string;
  team_id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
};

export type AppUser = {
  id: string;
  username: string;
  is_model: boolean;
  model_color: "blue" | "red" | null;
};

export type LeaderboardEntry = {
  id: string;
  user_id: string;
  match_id: string;
  rps_score: number;
  cumulative_rps: number;
};
