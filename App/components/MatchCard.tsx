"use client";
import { ProbBar } from "./ProbBar";
import { formatDate } from "@/lib/utils";
import type { EnrichedMatch } from "@/lib/types";

const F = "'JetBrains Mono',monospace";

export function MatchCard({ match }: { match: EnrichedMatch }) {
  const {
    team_home,
    team_away,
    team_home_crest,
    team_away_crest,
    goals_home,
    goals_away,
    status,
    group,
    stage,
    time_nst,
    date,
    sunless,
    frank,
  } = match;

  const isDone = status === "FINISHED";
  const isLive = status === "IN_PLAY";
  const isTBD = !team_home || !team_away;
  const statusLabel = isDone ? "FT" : isLive ? "LIVE" : isTBD ? "TBD" : "UPCOMING";
  const statusColor = isLive ? "#facc15" : isDone ? "#a3a3a3" : isTBD ? "#525252" : "#a3a3a3";

  const homeLabel = team_home || "TBD";
  const awayLabel = team_away || "TBD";

  const stageLabel =
    group
      ? `Group ${group.replace("GROUP_", "")}`
      : stage === "LAST_32"
      ? "Round of 32"
      : stage === "LAST_16"
      ? "Round of 16"
      : stage === "QUARTER_FINALS"
      ? "Quarter Final"
      : stage === "SEMI_FINALS"
      ? "Semi Final"
      : stage === "FINAL"
      ? "Final"
      : "";

  return (
    <div
      style={{
        background: "#262626",
        border: `1px solid ${isTBD ? "#2a2a2a" : "#404040"}`,
        borderRadius: 8,
        padding: "16px 18px",
        transition: "border-color 0.15s",
        opacity: isTBD ? 0.6 : 1,
      }}
      onMouseEnter={(e) =>
        !isTBD && (e.currentTarget.style.borderColor = "#666")
      }
      onMouseLeave={(e) =>
        !isTBD && (e.currentTarget.style.borderColor = "#404040")
      }
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: 1.5,
            color: "#e5e5e5",
            fontFamily: F,
          }}
        >
          {stageLabel}
        </span>
        <span style={{ fontSize: 10, color: "#a3a3a3", fontFamily: F }}>
          {formatDate(date, time_nst)}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: 1,
            color: statusColor,
            background: "#171717",
            padding: "3px 8px",
            borderRadius: 4,
            fontFamily: F,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Teams row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* Home */}
        <div
          style={{
            display: "flex",
            flexDirection: "column" as const,
            gap: 4,
          }}
        >
          {team_home_crest ? (
            <img
              src={team_home_crest}
              alt={homeLabel}
              width={28}
              height={28}
              style={{ objectFit: "contain" }}
              onError={(e) =>
                (e.currentTarget.style.visibility = "hidden")
              }
            />
          ) : (
            <div style={{ width: 28, height: 28 }} />
          )}
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: isTBD ? "#525252" : "#f5f5f5",
              fontFamily: F,
              lineHeight: 1.2,
            }}
          >
            {homeLabel}
          </div>
        </div>

        {/* Score / VS */}
        <div
          style={{
            textAlign: "center" as const,
            fontFamily: F,
            minWidth: 60,
          }}
        >
          {isDone ? (
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#f5f5f5",
                letterSpacing: 3,
              }}
            >
              {goals_home} · {goals_away}
            </span>
          ) : (
            <span
              style={{
                fontSize: 11,
                color: isTBD ? "#3a3a3a" : "#a3a3a3",
                letterSpacing: 2,
              }}
            >
              VS
            </span>
          )}
        </div>

        {/* Away */}
        <div
          style={{
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          {team_away_crest ? (
            <img
              src={team_away_crest}
              alt={awayLabel}
              width={28}
              height={28}
              style={{ objectFit: "contain" }}
              onError={(e) =>
                (e.currentTarget.style.visibility = "hidden")
              }
            />
          ) : (
            <div style={{ width: 28, height: 28 }} />
          )}
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: isTBD ? "#525252" : "#f5f5f5",
              fontFamily: F,
              textAlign: "right" as const,
              lineHeight: 1.2,
            }}
          >
            {awayLabel}
          </div>
        </div>
      </div>

      {/* Prediction bars — hide for TBD matches */}
      {!isTBD && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {sunless ? (
            <ProbBar
              label="Sunless"
              color="blue"
              p_win={sunless.p_win}
              p_draw={sunless.p_draw}
              p_loss={sunless.p_loss}
            />
          ) : (
            <div
              style={{
                border: "1px solid #333",
                background: "#1a1a1a",
                borderRadius: 6,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 10, color: "#666", fontFamily: F }}>
                no prediction
              </span>
            </div>
          )}
          {frank ? (
            <ProbBar
              label="Frank"
              color="red"
              p_win={frank.p_win}
              p_draw={frank.p_draw}
              p_loss={frank.p_loss}
            />
          ) : (
            <div
              style={{
                border: "1px solid #333",
                background: "#1a1a1a",
                borderRadius: 6,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 10, color: "#666", fontFamily: F }}>
                no prediction
              </span>
            </div>
          )}
        </div>
      )}

      {/* TBD placeholder */}
      {isTBD && (
        <div
          style={{
            border: "1px solid #2a2a2a",
            background: "#1a1a1a",
            borderRadius: 6,
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 10, color: "#3a3a3a", fontFamily: F }}>
            predictions available once bracket is set
          </span>
        </div>
      )}
    </div>
  );
}
