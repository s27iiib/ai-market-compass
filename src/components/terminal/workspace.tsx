import { useState } from "react";
import { toast } from "sonner";
import { Bell, BrainCircuit, Star, TriangleAlert } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AIConfluenceScore,
  BiasBadge,
  CheckRow,
  Chip,
  DirectionBadge,
  Panel,
  ProbabilityBar,
  RegimeBadge,
  RiskBadge,
  ScoreBar,
  StatTile,
} from "@/components/terminal/primitives";
import type { MacroMetric, MarketAnalysis, TechnicalAnalysis } from "@/lib/types";
import { fmtPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ------------------------------------------------ AI Intelligence panel */

export function AIIntelligencePanel({ analysis }: { analysis: MarketAnalysis }) {
  const [open, setOpen] = useState<number | null>(null);
  const s = analysis.signal;

  return (
    <div className="space-y-3">
      <Panel title="AI Market Intelligence" subtitle="Model estimates · not guarantees" ai>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="label-xs">Market bias</div>
            <div className="mt-1">
              <BiasBadge bias={analysis.bias} />
            </div>
            <div className="mt-3">
              <RegimeBadge regime={analysis.regime} />
            </div>
            <p className="num mt-2 text-[0.6875rem] text-muted-foreground">
              Regime confidence {analysis.regimeConfidence}%
            </p>
          </div>
          <AIConfluenceScore score={analysis.aiScore} size={86} label={false} />
        </div>

        <div className="mt-4 space-y-2.5 border-t border-border pt-3">
          <div className="label-xs">Directional scenarios</div>
          {analysis.forecast.scenarios.map((sc) => (
            <ProbabilityBar
              key={sc.scenario}
              label={sc.scenario === "BASE" ? "RANGE" : sc.scenario === "BULLISH" ? "UP" : "DOWN"}
              value={sc.probability}
              tone={
                sc.scenario === "BULLISH" ? "bull" : sc.scenario === "BEARISH" ? "bear" : "warn"
              }
            />
          ))}
        </div>
      </Panel>

      <Panel title="Why?" subtitle="Contributing evidence · click to expand" dense>
        <ul className="px-2.5 py-2">
          {s.reasoning.map((r, i) => (
            <CheckRow
              key={r.label}
              ok={r.ok}
              detail={r.detail}
              expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span>{r.label}</span>
                <span className="num shrink-0 text-[0.625rem] text-muted-foreground">
                  {r.weight}%
                </span>
              </span>
            </CheckRow>
          ))}
        </ul>
      </Panel>

      <Panel title="Risks" dense className="border-warn/25">
        <ul className="space-y-1.5 px-4 py-3">
          {s.risks.map((r) => (
            <li key={r} className="flex items-start gap-2 text-xs text-warn">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              <span className="leading-snug">{r}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <SignalCard analysis={analysis} />
      <DecisionTimeline analysis={analysis} />
    </div>
  );
}

/* --------------------------------------------------------- Signal card */

export function SignalCard({ analysis }: { analysis: MarketAnalysis }) {
  const s = analysis.signal;
  const noTrade = s.direction === "WAIT";

  if (noTrade || !s.metrics) {
    return (
      <Panel title="Trade Decision" subtitle="Conflicting evidence" className="border-warn/30">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Chip tone="warn" className="text-sm">
              NO TRADE
            </Chip>
            <p className="mt-2 text-xs text-muted-foreground">
              A well-reasoned decision not to trade is a valid outcome.
            </p>
          </div>
          <AIConfluenceScore score={s.aiScore} size={76} label={false} />
        </div>
        <ul className="mt-3 border-t border-border pt-2">
          {s.reasoning.slice(0, 3).map((r) => (
            <CheckRow key={r.label} ok>
              {r.label}
            </CheckRow>
          ))}
          {s.risks.map((r) => (
            <CheckRow key={r} ok={false}>
              {r}
            </CheckRow>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <StatTile label="Recommendation" value="WAIT" tone="warn" />
          <StatTile label="Next re-evaluation" value={s.reevaluation} />
        </div>
      </Panel>
    );
  }

  const m = s.metrics;
  return (
    <Panel
      title={`${s.direction} Setup`}
      subtitle={`${s.strategy} · ${s.session} session`}
      ai
      actions={<DirectionBadge direction={s.direction} />}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="num text-sm font-semibold">{s.symbol}</div>
          <p className="mt-1 text-[0.6875rem] text-muted-foreground">
            Estimated scenario probability {s.probability}%
          </p>
        </div>
        <AIConfluenceScore score={s.aiScore} size={76} label={false} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatTile label="Entry zone" value={`${fmtPrice(m.entry, s.symbol)}`} tone="ai" />
        <StatTile label="Stop loss" value={fmtPrice(m.stop, s.symbol)} tone="bear" />
        <StatTile label="Take profit 1" value={fmtPrice(m.tp1, s.symbol)} tone="bull" />
        <StatTile label="Take profit 2" value={fmtPrice(m.tp2, s.symbol)} tone="bull" />
        <StatTile label="Risk / reward" value={`1:${m.rr.toFixed(1)}`} />
        <StatTile label="Event risk" value={m.eventRisk} tone="warn" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() =>
            toast.info("Trade analysis opened", { description: "Full breakdown in the Risk tab." })
          }
        >
          <BrainCircuit className="size-3.5" /> Analyse trade
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            toast.success("Alert created", { description: `${s.symbol} · AI score > ${s.aiScore}` })
          }
        >
          <Bell className="size-3.5" /> Set alert
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => toast.success(`${s.symbol} added to watchlist`)}
        >
          <Star className="size-3.5" /> Watchlist
        </Button>
      </div>
      <p className="mt-3 text-[0.625rem] leading-relaxed text-muted-foreground">
        Decision-support output only. No broker execution is connected. Figures are derived from
        simulated demo data.
      </p>
    </Panel>
  );
}

/* ----------------------------------------------------------- Timeline */

export function DecisionTimeline({ analysis }: { analysis: MarketAnalysis }) {
  return (
    <Panel title="AI Decision Timeline" subtitle="How the signal formed" dense>
      <ol className="relative px-4 py-3">
        <span className="absolute top-4 bottom-4 left-[1.35rem] w-px bg-border" />
        {analysis.signal.timeline.map((t) => (
          <li key={t.time + t.text} className="relative flex gap-3 py-1.5 pl-0">
            <span
              className={cn(
                "z-10 mt-1 size-2 shrink-0 rounded-full ring-4 ring-card",
                t.kind === "signal"
                  ? "bg-ai"
                  : t.kind === "result"
                    ? "bg-bull"
                    : t.kind === "score"
                      ? "bg-warn"
                      : "bg-muted-foreground",
              )}
            />
            <div className="min-w-0">
              <span className="num text-[0.6875rem] text-muted-foreground">{t.time}</span>
              <p
                className={cn(
                  "text-xs leading-snug",
                  t.kind === "signal" && "font-semibold text-ai",
                )}
              >
                {t.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/* ------------------------------------------------- Multi-timeframe/MS */

export function MultiTimeframePanel({ analysis }: { analysis: MarketAnalysis }) {
  return (
    <Panel title="Multi-Timeframe Analysis">
      <div className="space-y-2">
        {analysis.multiTimeframe.map((r) => (
          <div
            key={r.timeframe}
            className="grid grid-cols-[3rem_5.5rem_minmax(0,1fr)] items-center gap-3"
          >
            <span className="num text-xs font-semibold">{r.timeframe}</span>
            <BiasBadge bias={r.bias} />
            <ScoreBar score={r.score} />
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <div className="label-xs mb-1">AI interpretation</div>
        <p className="text-xs leading-relaxed text-muted-foreground">{analysis.mtfNote}</p>
      </div>
    </Panel>
  );
}

export function StructurePanel({ analysis }: { analysis: MarketAnalysis }) {
  return (
    <Panel title="Market Structure">
      <div className="space-y-3">
        {analysis.structure.map((s) => (
          <div key={s.timeframe} className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-3">
            <span className="num text-xs font-semibold">{s.timeframe}</span>
            <div>
              <div className="flex flex-wrap gap-1.5">
                {s.items.map((i) => (
                  <Chip key={i.label} tone={i.ok ? "bull" : "neutral"}>
                    {i.label} {i.ok ? "✓" : "—"}
                  </Chip>
                ))}
              </div>
              <p className="mt-1 text-[0.6875rem] text-muted-foreground">{s.note}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <div className="label-xs">Market structure state</div>
        <div className="mt-1 text-sm font-semibold text-bull">{analysis.structureState}</div>
      </div>
    </Panel>
  );
}

export function LiquidityMap({ analysis }: { analysis: MarketAnalysis }) {
  const price = analysis.forecast.expectedRange[0] * 0.5 + analysis.forecast.expectedRange[1] * 0.5;
  const prices = analysis.liquidity.map((l) => l.price).concat(price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const pos = (p: number) => ((max - p) / (max - min || 1)) * 100;

  return (
    <Panel title="Liquidity Map" subtitle="Resting liquidity and swept levels">
      <div className="relative h-[15rem] rounded-md border border-border bg-panel/60">
        {analysis.liquidity.map((l) => (
          <div
            key={l.label}
            className="absolute inset-x-0"
            style={{ top: `${pos(l.price) * 0.9 + 4}%` }}
          >
            <div className="flex items-center gap-2 px-3">
              <div
                className={cn(
                  "h-px flex-1",
                  l.kind === "swept"
                    ? "bg-muted-foreground/40"
                    : l.price > price
                      ? "bg-bear/50"
                      : "bg-bull/50",
                )}
                style={{ opacity: 0.4 + l.strength / 200 }}
              />
              <span className="num shrink-0 text-[0.625rem] text-muted-foreground">
                {l.label} · {fmtPrice(l.price, analysis.symbol)}
              </span>
            </div>
          </div>
        ))}
        <div className="absolute inset-x-0" style={{ top: `${pos(price) * 0.9 + 4}%` }}>
          <div className="flex items-center gap-2 px-3">
            <div className="h-px flex-1 bg-ai" />
            <span className="num shrink-0 rounded bg-ai px-1 text-[0.625rem] font-semibold text-ai-foreground">
              PRICE {fmtPrice(price, analysis.symbol)}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{analysis.liquidityNote}</p>
    </Panel>
  );
}

/* --------------------------------------------------------- Tab bodies */

export function TechnicalTab({
  analysis,
  technical,
}: {
  analysis: MarketAnalysis;
  technical?: TechnicalAnalysis | undefined;
}) {
  // Real computed indicators when the backend has them; the simulated set
  // otherwise, so the tab still renders for timeframes not yet backfilled.
  const t = technical ?? analysis.technical;
  const isLive = !!technical;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel
        title="Technical Metrics"
        subtitle={isLive ? `Computed · ${technical.timeframe}` : "Simulated"}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatTile
            label="Trend"
            value={t.trend}
            tone={t.trend === "BULLISH" ? "bull" : t.trend === "BEARISH" ? "bear" : "neutral"}
          />
          <StatTile label="RSI (14)" value={t.rsi} tone={t.rsi > 55 ? "bull" : "neutral"} />
          <StatTile label="ADX" value={t.adx} hint="Trend strength" />
          <StatTile label="ATR" value={t.atr} hint="Volatility unit" />
          <StatTile label="VWAP" value={t.vwap} tone={t.vwap === "ABOVE" ? "bull" : "bear"} />
          <StatTile
            label="Momentum"
            value={t.momentum}
            tone={t.momentum === "POSITIVE" ? "bull" : "bear"}
          />
          <StatTile label="Volatility" value={t.volatility} tone="warn" />
          <StatTile label="Volume" value={t.volume} tone="bull" />
          <StatTile label="MACD" value={t.macd} tone={t.macd > 0 ? "bull" : "bear"} />
        </div>
      </Panel>
      <Panel title="Moving Averages & Bands">
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="EMA 20" value={fmtPrice(t.ema20, analysis.symbol)} />
          <StatTile label="EMA 50" value={fmtPrice(t.ema50, analysis.symbol)} />
          <StatTile label="EMA 200" value={fmtPrice(t.ema200, analysis.symbol)} />
          <StatTile label="BB width" value={`${t.bbWidth}%`} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {isLive
            ? "Moving averages and band width computed from stored candles. Alignment is trend-confirming evidence, not a prediction on its own."
            : "Price trades above all three exponential averages with positive slope alignment, which the model treats as trend-confirming rather than predictive on its own."}
        </p>
      </Panel>

      {technical && <StructureFindings technical={technical} symbol={analysis.symbol} />}
    </div>
  );
}

function StructureFindings({
  technical,
  symbol,
}: {
  technical: TechnicalAnalysis;
  symbol: string;
}) {
  const recentBreaks = technical.breaks.slice(-4).reverse();
  const pools = technical.liquidity.slice(0, 6);

  return (
    <>
      <Panel title="Market Structure" subtitle={`Structure trend · ${technical.structureTrend}`}>
        {recentBreaks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No structure breaks detected in range.</p>
        ) : (
          <div className="space-y-2">
            {recentBreaks.map((b) => (
              <div key={b.timestamp} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Chip tone={b.direction === "BULLISH" ? "bull" : "bear"}>{b.kind}</Chip>
                  <span className="text-xs text-muted-foreground">
                    broke {fmtPrice(b.brokenLevel, symbol)}
                  </span>
                </div>
                <span className="num text-xs">{fmtPrice(b.price, symbol)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 border-t border-border pt-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
          BOS continues the prevailing trend; CHOCH is the first break against it. Swings are
          confirmed only after later candles print, so structure lags price by design.
        </p>
      </Panel>

      <Panel title="Liquidity & Levels" subtitle="Equal highs/lows and repeated rejections">
        <div className="space-y-1.5">
          {pools.map((p) => (
            <div key={`${p.kind}-${p.price}`} className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{p.kind}</span>
              <div className="flex items-center gap-2">
                <span className="num text-xs">{fmtPrice(p.price, symbol)}</span>
                {p.swept && <Chip tone="warn">SWEPT</Chip>}
              </div>
            </div>
          ))}
        </div>
        {technical.levels.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-border pt-3">
            {technical.levels.slice(0, 4).map((level) => (
              <div key={level.price} className="flex items-center justify-between gap-2">
                <Chip tone={level.kind === "resistance" ? "bear" : "bull"}>{level.kind}</Chip>
                <span className="num text-xs">
                  {fmtPrice(level.price, symbol)} · {level.touches} touches
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

export function MacroTab({
  analysis,
  macro,
}: {
  analysis: MarketAnalysis;
  macro?: { metrics: MacroMetric[]; macroScore: number } | undefined;
}) {
  // Real macro series when the backend has them, simulated otherwise.
  const metrics = macro?.metrics ?? analysis.macro;
  const score = macro?.macroScore ?? analysis.macroScore;
  const isLive = !!macro;
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Panel
        title="Gold Macro Intelligence"
        subtitle={isLive ? "Live series · 24h change" : "Simulated"}
        dense
      >
        <div className="divide-y divide-border">
          {metrics.map((m) => (
            <div
              key={m.name}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 px-4 py-2.5"
            >
              <span className="truncate text-xs font-medium">{m.name}</span>
              <span className="num text-xs">{m.value}</span>
              <span className={cn("num text-xs", m.changePct >= 0 ? "text-bull" : "text-bear")}>
                {m.changePct > 0 ? "+" : ""}
                {m.changePct}%
              </span>
              <Chip
                tone={
                  m.goldImpact === "BULLISH"
                    ? "bull"
                    : m.goldImpact === "BEARISH"
                      ? "bear"
                      : "neutral"
                }
              >
                {m.goldImpact}
              </Chip>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Gold Macro Score" ai>
        <AIConfluenceScore score={score} caption="Weighted macro factor composite." />
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          <div className="label-xs">Largest contributors</div>
          {metrics
            .slice()
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 4)
            .map((m) => (
              <ProbabilityBar
                key={m.name}
                label={m.name}
                value={m.weight * 4}
                tone={
                  m.goldImpact === "BULLISH" ? "bull" : m.goldImpact === "BEARISH" ? "bear" : "warn"
                }
                sublabel={`${m.weight}% model weight · ${m.value}`}
              />
            ))}
        </div>
      </Panel>
    </div>
  );
}

export function OrderFlowTab({ analysis }: { analysis: MarketAnalysis }) {
  const of = analysis.orderFlow;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Cumulative Delta">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={of.cvd}>
              <defs>
                <linearGradient id="cvdFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-ai)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-ai)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="t"
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
                width={30}
              />
              <RTooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border-strong)",
                  borderRadius: 6,
                  fontSize: 11,
                }}
              />
              <Area dataKey="v" stroke="var(--color-ai)" fill="url(#cvdFill)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Flow Composition">
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Buy volume" value={`${of.buyVolume}%`} tone="bull" />
          <StatTile label="Sell volume" value={`${of.sellVolume}%`} tone="bear" />
          <StatTile label="Delta" value={`+${of.delta}%`} tone="bull" />
          <StatTile label="Bid/ask imbalance" value={`${of.imbalance}x`} tone="ai" />
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-bear/40">
          <div className="h-full bg-bull" style={{ width: `${of.buyVolume}%` }} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{of.note}</p>
      </Panel>
    </div>
  );
}

export function SentimentTab({ analysis }: { analysis: MarketAnalysis }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {analysis.sentiment.map((s) => (
        <Panel key={s.label} title={s.label}>
          <div className="flex items-center gap-4">
            <AIConfluenceScore score={s.value} size={72} label={false} />
            <p className="text-xs leading-relaxed text-muted-foreground">{s.note}</p>
          </div>
        </Panel>
      ))}
    </div>
  );
}

export function ForecastTab({ analysis }: { analysis: MarketAnalysis }) {
  const f = analysis.forecast;
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Panel title={`Scenario Analysis · ${f.horizon}`} ai>
        <div className="space-y-3">
          {f.scenarios.map((s) => (
            <ProbabilityBar
              key={s.scenario}
              label={s.scenario === "BASE" ? "BASE / RANGE" : s.scenario}
              value={s.probability}
              tone={s.scenario === "BULLISH" ? "bull" : s.scenario === "BEARISH" ? "bear" : "warn"}
              sublabel={`${s.condition} · ${s.target}`}
            />
          ))}
        </div>
        <p className="mt-4 border-t border-border pt-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
          These are model estimates over a probability distribution. They are not guarantees, and
          the model does not claim to know a specific future price.
        </p>
      </Panel>
      <Panel title="Key Levels">
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label="Expected range"
            value={`${fmtPrice(f.expectedRange[0], analysis.symbol)} – ${fmtPrice(f.expectedRange[1], analysis.symbol)}`}
            tone="ai"
          />
          <StatTile label="Key upside" value={fmtPrice(f.keyUpside, analysis.symbol)} tone="bull" />
          <StatTile
            label="Key downside"
            value={fmtPrice(f.keyDownside, analysis.symbol)}
            tone="bear"
          />
          <StatTile
            label="Invalidation"
            value={fmtPrice(f.invalidation, analysis.symbol)}
            tone="warn"
          />
        </div>
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={f.scenarios.map((s) => ({ name: s.scenario, v: s.probability }))}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
                width={28}
              />
              <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                {f.scenarios.map((s) => (
                  <Cell
                    key={s.scenario}
                    fill={
                      s.scenario === "BULLISH"
                        ? "var(--color-bull)"
                        : s.scenario === "BEARISH"
                          ? "var(--color-bear)"
                          : "var(--color-warn)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

export function RiskTab({ analysis }: { analysis: MarketAnalysis }) {
  const m = analysis.signal.metrics;
  const [account, setAccount] = useState(50000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(m ? Number(m.entry.toFixed(2)) : 0);
  const [stop, setStop] = useState(m ? Number(m.stop.toFixed(2)) : 0);

  const riskAmount = (account * riskPct) / 100;
  const perUnit = Math.abs(entry - stop) || 1;
  const size = riskAmount / perUnit;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Trade Risk Profile">
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Entry" value={m ? fmtPrice(m.entry, analysis.symbol) : "—"} tone="ai" />
          <StatTile label="Stop" value={m ? fmtPrice(m.stop, analysis.symbol) : "—"} tone="bear" />
          <StatTile
            label="Take profit 1"
            value={m ? fmtPrice(m.tp1, analysis.symbol) : "—"}
            tone="bull"
          />
          <StatTile
            label="Take profit 2"
            value={m ? fmtPrice(m.tp2, analysis.symbol) : "—"}
            tone="bull"
          />
          <StatTile label="Risk / reward" value={m ? `1:${m.rr.toFixed(1)}` : "—"} />
          <StatTile label="ATR risk" value={m?.atrRisk ?? "—"} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {m && <RiskBadge risk={m.eventRisk} />}
          {m && <Chip tone="warn">Correlation {m.correlationRisk}</Chip>}
          {m && <Chip tone="ai">Volatility {m.volatility}</Chip>}
        </div>
      </Panel>
      <Panel
        title="Position Size Calculator"
        subtitle="Suggested size from structural stop distance"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="label-xs" htmlFor="acct">
              Account size (USD)
            </Label>
            <Input
              id="acct"
              type="number"
              className="num mt-1.5"
              value={account}
              onChange={(e) => setAccount(Number(e.target.value))}
            />
          </div>
          <div>
            <Label className="label-xs" htmlFor="riskpct">
              Risk per trade (%)
            </Label>
            <Input
              id="riskpct"
              type="number"
              step="0.1"
              className="num mt-1.5"
              value={riskPct}
              onChange={(e) => setRiskPct(Number(e.target.value))}
            />
          </div>
          <div>
            <Label className="label-xs" htmlFor="entry">
              Entry
            </Label>
            <Input
              id="entry"
              type="number"
              className="num mt-1.5"
              value={entry}
              onChange={(e) => setEntry(Number(e.target.value))}
            />
          </div>
          <div>
            <Label className="label-xs" htmlFor="stop">
              Stop
            </Label>
            <Input
              id="stop"
              type="number"
              className="num mt-1.5"
              value={stop}
              onChange={(e) => setStop(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
          <StatTile label="Risk amount" value={`$${riskAmount.toFixed(0)}`} tone="warn" />
          <StatTile label="Stop distance" value={perUnit.toFixed(2)} />
          <StatTile label="Suggested size" value={`${size.toFixed(2)} units`} tone="ai" />
        </div>
      </Panel>
    </div>
  );
}

export function RegimePanel({ analysis }: { analysis: MarketAnalysis }) {
  return (
    <Panel title="Market Regime Engine">
      <div className="flex flex-wrap items-center gap-2">
        <RegimeBadge regime={analysis.regime} className="text-sm" />
        <span className="num text-xs text-muted-foreground">
          Confidence {analysis.regimeConfidence}%
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatTile label="Best strategy in regime" value={analysis.bestStrategy} tone="ai" />
        <StatTile label="Historical expectancy" value={analysis.regimeExpectancy} tone="bull" />
      </div>
    </Panel>
  );
}
