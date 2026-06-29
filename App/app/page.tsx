"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { MatchCard } from "@/components/MatchCard";
import { fetchFixtures, enrichFixtures } from "@/lib/data";
import type { EnrichedMatch, MatchStage } from "@/lib/types";
import { STAGE_MAP, STAGE_LABEL, KNOCKOUT_STAGES } from "@/lib/types";

const F = "'JetBrains Mono',monospace";
const POLL_MS = 60 * 60 * 1000;

const ALL_STAGES: MatchStage[] = [
  "GROUP_STAGE",
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "FINAL",
];

export default function MatchesPage() {
  const [allFixtures, setAllFixtures] = useState<EnrichedMatch[]>([]);
  const [stageMatches, setStageMatches] = useState<EnrichedMatch[]>([]);
  const [activeStage, setActiveStage] = useState<MatchStage>("GROUP_STAGE");
  const [loading, setLoading] = useState(true);
  const [stageLoading, setStageLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  // Load all fixtures once (raw, no predictions yet)
  const loadFixtures = useCallback(async () => {
    const fixtures = await fetchFixtures();
    // store raw fixtures so switching stages is instant
    setAllFixtures(fixtures as any);
    setLastUpdated(new Date());
    setLoading(false);
    return fixtures;
  }, []);

  // Enrich a stage's fixtures with predictions
  const loadStage = useCallback(
    async (stage: MatchStage, fixtures: any[]) => {
      setStageLoading(true);
      const stageFix = fixtures.filter((f) => f.stage === stage);
      const stageKey = STAGE_MAP[stage];
      const enriched = await enrichFixtures(stageFix, stageKey);
      enriched.sort(
        (a, b) =>
          new Date(a.date + " " + a.time_nst).getTime() -
          new Date(b.date + " " + b.time_nst).getTime()
      );
      setStageMatches(enriched);
      setStageLoading(false);
    },
    []
  );

  // Initial load
  useEffect(() => {
    loadFixtures().then((fx) => loadStage("GROUP_STAGE", fx as any));
    const id = setInterval(() => {
      loadFixtures().then((fx) => loadStage(activeStage, fx as any));
    }, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to next upcoming match when stage loads
  useEffect(() => {
    if (!stageLoading && nextRef.current) {
      nextRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [stageLoading]);

  // Switch stage tab
  const switchStage = useCallback(
    (stage: MatchStage) => {
      setActiveStage(stage);
      loadStage(stage, allFixtures as any);
    },
    [allFixtures, loadStage]
  );

  const finished = stageMatches.filter((m) => m.status === "FINISHED").length;
  const next = stageMatches.find(
    (m) => m.status === "TIMED" || m.status === "SCHEDULED"
  );

  // Count fixtures per stage from raw allFixtures for badge display
  const stageCounts = ALL_STAGES.reduce((acc, s) => {
    acc[s] = (allFixtures as any[]).filter((f: any) => f.stage === s).length;
    return acc;
  }, {} as Record<MatchStage, number>);

  const stageFinished = ALL_STAGES.reduce((acc, s) => {
    acc[s] = (allFixtures as any[]).filter(
      (f: any) => f.stage === s && f.status === "FINISHED"
    ).length;
    return acc;
  }, {} as Record<MatchStage, number>);

  const isKnockout = KNOCKOUT_STAGES.includes(activeStage);

  return (
    <div>
      {/* Stats bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "Completed",
            value: `${finished} / ${stageMatches.length}`,
            sub: STAGE_LABEL[activeStage].toLowerCase() + " matches",
          },
          {
            label: "Next Match",
            value: next ? next.time_nst + " NST" : "—",
            sub: next ? `${next.date}` : "no upcoming",
          },
          {
            label: "Updated",
            value: lastUpdated
              ? lastUpdated.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—",
            sub: "refreshes hourly",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#262626",
              border: "1px solid #404040",
              borderRadius: 7,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: 1.5,
                color: "#a3a3a3",
                marginBottom: 6,
                fontFamily: F,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#f5f5f5",
                lineHeight: 1,
                fontFamily: F,
              }}
            >
              {s.value}
            </div>
            <div
              style={{ fontSize: 10, color: "#a3a3a3", marginTop: 4, fontFamily: F }}
            >
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Stage tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          flexWrap: "wrap" as const,
        }}
      >
        {ALL_STAGES.map((stage) => {
          const isActive = stage === activeStage;
          const count = stageCounts[stage];
          const done = stageFinished[stage];
          const hasMatches = count > 0;
          return (
            <button
              key={stage}
              onClick={() => switchStage(stage)}
              disabled={loading}
              style={{
                fontFamily: F,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase" as const,
                padding: "7px 14px",
                borderRadius: 5,
                cursor: loading ? "default" : "pointer",
                border: isActive ? "1px solid #737373" : "1px solid #404040",
                background: isActive ? "#404040" : "#1a1a1a",
                color: isActive ? "#f5f5f5" : hasMatches ? "#a3a3a3" : "#525252",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#666";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#404040";
              }}
            >
              {STAGE_LABEL[stage]}
              {hasMatches && (
                <span
                  style={{
                    fontSize: 9,
                    color: done === count ? "#4ade80" : "#a3a3a3",
                    fontWeight: 400,
                    letterSpacing: 0,
                  }}
                >
                  {done}/{count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section heading */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 1,
            color: "#f5f5f5",
            fontFamily: F,
          }}
        >
          {STAGE_LABEL[activeStage]}
        </h1>
        <span style={{ fontSize: 10, color: "#a3a3a3", fontFamily: F }}>
          sorted by date · times in NST
          {isKnockout && stageMatches.some((m) => !m.team_home) && (
            <span style={{ color: "#737373" }}>
              {" "}· some slots TBD (bracket not set yet)
            </span>
          )}
        </span>
      </div>

      {/* Match list */}
      {loading || stageLoading ? (
        <div
          style={{
            textAlign: "center" as const,
            padding: "60px 0",
            fontSize: 11,
            color: "#a3a3a3",
            fontFamily: F,
          }}
        >
          {loading ? "loading fixtures..." : "loading predictions..."}
        </div>
      ) : stageMatches.length === 0 ? (
        <div
          style={{
            textAlign: "center" as const,
            padding: "60px 0",
            fontSize: 11,
            color: "#525252",
            fontFamily: F,
          }}
        >
          no fixtures scheduled for this stage yet
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column" as const,
            gap: 8,
          }}
        >
          {stageMatches.map((m) => {
            const isNext =
              (m.status === "TIMED" || m.status === "SCHEDULED") &&
              m.match_id === next?.match_id;
            return (
              <div key={m.match_id} ref={isNext ? nextRef : null}>
                <MatchCard match={m} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
