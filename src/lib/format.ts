import type { Bias, Direction, RiskLevel } from "@/lib/types";

export function fmtPrice(value: number, symbol?: string) {
  if (symbol === "USD/JPY") return value.toFixed(3);
  if (value >= 100) return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value.toFixed(4);
}

export function fmtPct(value: number, digits = 2) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function fmtMoney(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function directionTone(d: Direction | Bias | null) {
  if (d === "LONG" || d === "BULLISH") return "bull" as const;
  if (d === "SHORT" || d === "BEARISH") return "bear" as const;
  return "neutral" as const;
}

export function scoreLabel(score: number) {
  if (score >= 90) return "EXCEPTIONAL";
  if (score >= 80) return "STRONG";
  if (score >= 70) return "GOOD";
  if (score >= 60) return "WEAK";
  return "AVOID";
}

export function scoreTone(score: number) {
  if (score >= 80) return "bull" as const;
  if (score >= 70) return "ai" as const;
  if (score >= 60) return "warn" as const;
  return "bear" as const;
}

export function riskTone(r: RiskLevel) {
  return r === "LOW" ? ("bull" as const) : r === "MEDIUM" ? ("warn" as const) : ("bear" as const);
}

export function currentSession() {
  return "London Session";
}
