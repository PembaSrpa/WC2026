export type MatchStatus = "TIMED" | "SCHEDULED" | "IN_PLAY" | "FINISHED";
export type MatchStage =
  | "GROUP_STAGE"
  | "LAST_32"
  | "LAST_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "FINAL";

export type ModelColor = "blue" | "red" | "green" | null;

export type Fixture = {
  match_id: string;
  date: string;
  time_nst: string;
  status: MatchStatus;
  stage: MatchStage;
  group: string | null;
  team_home: string;
  team_home_crest: string;
  team_away: string;
  team_away_crest: string;
  goals_home: number | null;
  goals_away: number | null;
};

export type Prediction = {
  match_id: string;
  team_a: string;
  team_b: string;
  stage: string;
  match_date: string;
  p_win: number;
  p_draw: number;
  p_loss: number;
  model: string;
  shap_values: Record<string, number>;
};

export type EnrichedMatch = Fixture & {
  sunless: Prediction | null;
  frank: Prediction | null;
};

export const STAGE_MAP: Record<MatchStage, string> = {
  GROUP_STAGE: "group",
  LAST_32: "r32",
  LAST_16: "r16",
  QUARTER_FINALS: "qf",
  SEMI_FINALS: "sf",
  FINAL: "final",
};

export const STAGE_LABEL: Record<MatchStage, string> = {
  GROUP_STAGE: "Group Stage",
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter Finals",
  SEMI_FINALS: "Semi Finals",
  FINAL: "Final",
};

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  username: string;
  is_model: boolean;
  model_color: ModelColor;
  cumulative_rps: number;
  matches_predicted: number;
  accuracy: number;
}

export const KNOCKOUT_STAGES: MatchStage[] = [
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "FINAL",
];