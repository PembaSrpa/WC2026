export function formatNST(utcIso: string): string {
  const date = new Date(utcIso);
  const nstMs = date.getTime() + (5 * 60 + 45) * 60 * 1000;
  const d = new Date(nstMs);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()} · ${h12}:${mm} ${ampm} NST`;
}

export type ModelColor = "blue" | "red" | "green" | null;

export function modelTextColor(c: ModelColor): string {
  if (c === "blue") return "#60a5fa";
  if (c === "red") return "#f87171";
  if (c === "green") return "#4ade80";
  return "#d4d4d4";
}

export function modelBorderColor(c: ModelColor): string {
  if (c === "blue") return "#3b82f6";
  if (c === "red") return "#ef4444";
  if (c === "green") return "#22c55e";
  return "#404040";
}

export function modelBgColor(c: ModelColor): string {
  if (c === "blue") return "rgba(59,130,246,0.08)";
  if (c === "red") return "rgba(239,68,68,0.08)";
  if (c === "green") return "rgba(34,197,94,0.08)";
  return "transparent";
}
