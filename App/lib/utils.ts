import type { ModelColor } from "./types";

export function modelTextColor(c: ModelColor): string {
  if (c === "blue") return "#60a5fa";
  if (c === "red") return "#f87171";
  if (c === "green") return "#4ade80";
  return "#e5e5e5";
}

export function formatDate(date: string, time: string): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [y, m, d] = date.split("-").map(Number);
  return `${months[m-1]} ${d} · ${time} NST`;
}
