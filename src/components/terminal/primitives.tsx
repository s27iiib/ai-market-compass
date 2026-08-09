import { cn } from "@/lib/utils";
import { fmtPct, scoreLabel, scoreTone } from "@/lib/format";
import type { Bias, Direction, Regime, RiskLevel, Importance } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Inbox, RotateCcw, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "bull" | "bear" | "warn" | "ai" | "neutral";

const toneClasses: Record<Tone, string> = {
  bull: "text-bull border-bull/30 bg-bull/10",
  bear: "text-bear border-bear/30 bg-bear/10",
  warn: "text-warn border-warn/30 bg-warn/10",
  ai: "text-ai border-ai/30 bg-ai/10",
  neutral: "text-muted-foreground border-border-strong bg-muted/40",
};

const toneText: Record<Tone, string> = {
  bull: "text-bull",
  bear: "text-bear",
  warn: "text-warn",
  ai: "text-ai",
  neutral: "text-muted-foreground",
};

const toneBg: Record<Tone, string> = {
  bull: "bg-bull",
  bear: "bg-bear",
  warn: "bg-warn",
  ai: "bg-ai",
  neutral: "bg-muted-foreground",
};

/* ---------------------------------------------------------------- Panel */

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  ai,
  dense,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  ai?: boolean;
  dense?: boolean;
}) {
  return (
    <section className={cn(ai ? "panel-ai" : "panel", "flex flex-col overflow-hidden", className)}>
      {(title || actions) && (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2
              className={cn(
                "truncate text-[0.8125rem] font-semibold tracking-wide",
                ai ? "text-ai" : "text-foreground",
              )}
            >
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("min-w-0 flex-1", dense ? "p-0" : "p-4")}>{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  tone = "neutral",
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-panel/60 px-3 py-2.5", className)}>
      <div className="label-xs truncate">{label}</div>
      <div className={cn("num mt-1 text-sm font-semibold", toneText[tone])}>{value}</div>
      {hint && <div className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">{hint}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- Badges */

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide uppercase",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function BiasBadge({ bias, className }: { bias: Bias; className?: string }) {
  const tone: Tone = bias === "BULLISH" ? "bull" : bias === "BEARISH" ? "bear" : "neutral";
  return (
    <Chip tone={tone} className={className}>
      {bias}
    </Chip>
  );
}

export function DirectionBadge({ direction, className }: { direction: Direction; className?: string }) {
  const tone: Tone = direction === "LONG" ? "bull" : direction === "SHORT" ? "bear" : "warn";
  return (
    <Chip tone={tone} className={className}>
      {direction === "WAIT" ? "NO TRADE" : direction}
    </Chip>
  );
}

export function RegimeBadge({ regime, className }: { regime: Regime; className?: string }) {
  const tone: Tone = regime.includes("BULL")
    ? "bull"
    : regime.includes("BEAR")
      ? "bear"
      : regime.includes("HIGH VOL")
        ? "warn"
        : "neutral";
  return (
    <Chip tone={tone} className={className}>
      {regime}
    </Chip>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const tone: Tone = risk === "LOW" ? "bull" : risk === "MEDIUM" ? "warn" : "bear";
  return <Chip tone={tone}>{risk} RISK</Chip>;
}

export function ImportanceBadge({ importance }: { importance: Importance }) {
  const tone: Tone =
    importance === "CRITICAL" ? "bear" : importance === "HIGH" ? "warn" : importance === "MEDIUM" ? "ai" : "neutral";
  return <Chip tone={tone}>{importance}</Chip>;
}

export function ChangeValue({ pct, className }: { pct: number; className?: string }) {
  return (
    <span className={cn("num text-sm font-semibold", pct >= 0 ? "text-bull" : "text-bear", className)}>
      {fmtPct(pct)}
    </span>
  );
}

/* ------------------------------------------------- AI Confluence Score */

export function AIConfluenceScore({
  score,
  size = 96,
  label = true,
  caption,
}: {
  score: number;
  size?: number;
  label?: boolean;
  caption?: string;
}) {
  const tone = scoreTone(score);
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={6}
            className="stroke-border-strong"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={`${(c * score) / 100} ${c}`}
            className={cn(
              tone === "bull" && "stroke-bull",
              tone === "ai" && "stroke-ai",
              tone === "warn" && "stroke-warn",
              tone === "bear" && "stroke-bear",
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("num font-semibold", toneText[tone])} style={{ fontSize: size * 0.28 }}>
            {score}
          </span>
          <span className="text-[0.5625rem] tracking-widest text-muted-foreground">/100</span>
        </div>
      </div>
      {label && (
        <div className="min-w-0">
          <div className="label-xs">AI Confluence</div>
          <div className={cn("text-sm font-semibold", toneText[tone])}>{scoreLabel(score)}</div>
          <p className="mt-1 max-w-[15rem] text-[0.6875rem] leading-snug text-muted-foreground">
            {caption ?? "Synthetic platform score. Not a probability of profit."}
          </p>
        </div>
      )}
    </div>
  );
}

export function ScoreBar({ score, className }: { score: number; className?: string }) {
  const tone = scoreTone(score);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", toneBg[tone])} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("num w-8 shrink-0 text-right text-xs font-semibold", toneText[tone])}>{score}</span>
    </div>
  );
}

export function ProbabilityBar({
  label,
  value,
  tone = "ai",
  sublabel,
}: {
  label: string;
  value: number;
  tone?: Tone;
  sublabel?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className={cn("num text-xs font-semibold", toneText[tone])}>{value}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", toneBg[tone])} style={{ width: `${value}%` }} />
      </div>
      {sublabel && <p className="mt-1 text-[0.6875rem] leading-snug text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

/* ------------------------------------------------------------ Sparkline */

export function Sparkline({
  data,
  width = 96,
  height = 28,
  tone = "bull",
}: {
  data: number[];
  width?: number;
  height?: number;
  tone?: Tone;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d - min) / span) * (height - 4) - 2}`)
    .join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        strokeWidth={1.5}
        className={cn(
          tone === "bull" && "stroke-bull",
          tone === "bear" && "stroke-bear",
          tone === "neutral" && "stroke-muted-foreground",
          tone === "ai" && "stroke-ai",
          tone === "warn" && "stroke-warn",
        )}
      />
    </svg>
  );
}

/* --------------------------------------------------------- Data states */

export function LoadingPanel({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full bg-muted/60" />
      ))}
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <AlertTriangle className="size-5 text-bear" />
      <p className="max-w-xs text-sm text-muted-foreground">
        {message ?? "Market data connection unavailable. Displayed values may be incomplete."}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RotateCcw className="size-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Inbox className="size-5 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>}
      {action}
    </div>
  );
}

export function OfflineState() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
      <WifiOff className="size-3.5" /> Market data connection unavailable — values are not current.
    </div>
  );
}

export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded border border-warn/30 bg-warn/10 px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-widest text-warn uppercase",
        className,
      )}
    >
      Demo Data
    </span>
  );
}

export function CheckRow({
  ok,
  children,
  onClick,
  expanded,
  detail,
}: {
  ok: boolean;
  children: ReactNode;
  onClick?: () => void;
  expanded?: boolean;
  detail?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-2 rounded px-1.5 py-1.5 text-left transition-colors hover:bg-accent/60"
      >
        <span className={cn("num mt-px shrink-0 text-xs font-bold", ok ? "text-bull" : "text-bear")}>
          {ok ? "✓" : "✗"}
        </span>
        <span className="min-w-0 flex-1 text-xs leading-snug text-foreground">{children}</span>
      </button>
      {expanded && detail && (
        <p className="mb-1 ml-6 border-l border-border pl-2.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
          {detail}
        </p>
      )}
    </li>
  );
}
