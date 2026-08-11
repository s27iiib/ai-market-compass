import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  MessageSquareText,
  Newspaper,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AIConfluenceScore,
  BiasBadge,
  ChangeValue,
  Chip,
  DirectionBadge,
  EmptyState,
  ErrorState,
  ImportanceBadge,
  LoadingPanel,
  Panel,
  RegimeBadge,
  RiskBadge,
  ScoreBar,
  Sparkline,
} from "@/components/terminal/primitives";
import { economicService, marketService, newsService } from "@/services";
import { symbolToSlug } from "@/lib/mock-data";
import { directionTone, fmtPrice } from "@/lib/format";
import type { NewsArticle } from "@/lib/types";

/* ------------------------------------------------------- Market cards */

export function MarketOverviewCards() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["markets"],
    queryFn: marketService.getMarkets,
  });

  if (isLoading)
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="panel h-[8.5rem] animate-pulse" />
        ))}
      </div>
    );
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {data.map((q) => {
        const tone = directionTone(q.bias);
        return (
          <Link
            key={q.symbol}
            to="/markets/$symbol"
            params={{ symbol: symbolToSlug(q.symbol) }}
            className="panel group px-3.5 py-3 transition-colors hover:border-ai/40"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <div className="min-w-0">
                <div className="num truncate text-sm font-semibold">{q.symbol}</div>
                <div className="num mt-0.5 text-lg font-semibold">
                  {fmtPrice(q.price, q.symbol)}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <ChangeValue pct={q.changePct} />
                <div className="mt-1 flex justify-end">
                  <Sparkline data={q.sparkline} tone={tone === "neutral" ? "neutral" : tone} />
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <BiasBadge bias={q.bias} />
              <RegimeBadge regime={q.regime} />
              {q.setup && <DirectionBadge direction={q.setup} />}
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="label-xs shrink-0">AI</span>
              <ScoreBar score={q.aiScore} />
              <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-ai" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------- Best opportunities */

export function BestOpportunities() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["scanner"],
    queryFn: marketService.getScanner,
  });

  const rows = (data ?? [])
    .filter((r) => r.signal.direction !== "WAIT")
    .sort((a, b) => b.signal.aiScore - a.signal.aiScore)
    .slice(0, 5);

  return (
    <Panel
      title="Best Opportunities"
      subtitle="Ranked by composite confluence score · simulated data"
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link to="/scanner">Open scanner</Link>
        </Button>
      }
      dense
    >
      {isLoading ? (
        <LoadingPanel rows={5} className="p-4" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No qualifying setups"
          hint="Nothing currently clears the platform threshold."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                {["Asset", "Direction", "AI", "Strategy", "Prob.", "R", "Regime", "Risk", ""].map(
                  (h) => (
                    <th key={h} className="label-xs px-4 py-2 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ quote, signal }) => (
                <tr
                  key={signal.id}
                  className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                >
                  <td className="num px-4 py-2.5 font-semibold whitespace-nowrap">
                    {quote.symbol}
                  </td>
                  <td className="px-4 py-2.5">
                    <DirectionBadge direction={signal.direction} />
                  </td>
                  <td className="num px-4 py-2.5 w-28">
                    <ScoreBar score={signal.aiScore} />
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                    {signal.strategy}
                  </td>
                  <td className="num px-4 py-2.5">{signal.probability}%</td>
                  <td className="num px-4 py-2.5">1:{signal.metrics?.rr.toFixed(1) ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <RegimeBadge regime={signal.regime} />
                  </td>
                  <td className="px-4 py-2.5">
                    <RiskBadge risk={signal.risk} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/markets/$symbol" params={{ symbol: symbolToSlug(quote.symbol) }}>
                        Open
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/* ---------------------------------------------------- Currency strength */

export function CurrencyStrengthPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["currency-strength"],
    queryFn: marketService.getCurrencyStrength,
  });

  const strongest = data?.[0];
  const weakest = data?.[data.length - 1];

  return (
    <Panel title="Currency Strength" subtitle="Relative factor strength, 0–100">
      {isLoading || !data ? (
        <LoadingPanel rows={6} />
      ) : (
        <>
          <div className="space-y-2">
            {data.map((c) => (
              <div key={c.code} className="flex items-center gap-3">
                <span className="num w-9 shrink-0 text-xs font-semibold">{c.code}</span>
                <ScoreBar score={c.score} />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3">
            <div>
              <div className="label-xs">Strongest</div>
              <div className="num text-sm font-semibold text-bull">{strongest?.code}</div>
            </div>
            <div>
              <div className="label-xs">Weakest</div>
              <div className="num text-sm font-semibold text-bear">{weakest?.code}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="label-xs mb-1.5">Relative-strength candidates</div>
            <div className="flex flex-wrap gap-1.5">
              {["USD/NZD", "USD/AUD", "USD/CAD", "GBP/NZD"].map((p) => (
                <Chip key={p} tone="ai">
                  {p}
                </Chip>
              ))}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}

/* --------------------------------------------------- Economic calendar */

export function EconomicCalendarPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["calendar"],
    queryFn: economicService.getCalendar,
  });
  const next = data?.find((e) => e.minutesAway > 0);

  return (
    <Panel
      title="Economic Calendar"
      subtitle="Today · all times UTC"
      actions={<CalendarClock className="size-3.5 text-muted-foreground" />}
      dense
    >
      {next && (
        <div className="flex items-center gap-2 border-b border-warn/25 bg-warn/10 px-4 py-2.5 text-xs text-warn">
          <CalendarClock className="size-3.5 shrink-0" />
          <span className="font-medium">
            {next.country} {next.event} in {next.minutesAway} minutes
          </span>
        </div>
      )}
      {isLoading || !data ? (
        <LoadingPanel rows={4} className="p-4" />
      ) : (
        <div className="divide-y divide-border">
          {data.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-start gap-3 px-4 py-2.5"
            >
              <span className="num text-xs text-muted-foreground">{e.time}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-xs font-medium">{e.event}</span>
                  <span className="num text-[0.625rem] text-muted-foreground">{e.country}</span>
                </div>
                <div className="num mt-1 flex flex-wrap gap-3 text-[0.6875rem] text-muted-foreground">
                  <span>Prev {e.previous}</span>
                  <span>Fcst {e.forecast}</span>
                  <span className={e.actual ? "text-foreground" : ""}>Act {e.actual ?? "—"}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {e.affected.map((a) => (
                    <span key={a} className="num text-[0.625rem] text-muted-foreground">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <ImportanceBadge importance={e.importance} />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* -------------------------------------------------------- Market news */

export function MarketNewsPanel() {
  const { data, isLoading } = useQuery({ queryKey: ["news"], queryFn: newsService.getNews });
  const [selected, setSelected] = useState<NewsArticle | null>(null);

  return (
    <>
      <Panel
        title="Market News"
        subtitle="Sentiment-tagged flow"
        actions={<Newspaper className="size-3.5 text-muted-foreground" />}
        dense
      >
        {isLoading || !data ? (
          <LoadingPanel rows={4} className="p-4" />
        ) : (
          <div className="divide-y divide-border">
            {data.map((n) => {
              const bearish = n.sentiment.toLowerCase().includes("bearish");
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelected(n)}
                  className="block w-full px-4 py-3 text-left transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start gap-2">
                    {bearish ? (
                      <TrendingDown className="mt-0.5 size-3.5 shrink-0 text-bear" />
                    ) : (
                      <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-bull" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs leading-snug font-medium">{n.headline}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.625rem] text-muted-foreground">
                        <span>{n.source}</span>
                        <span>·</span>
                        <span>{n.timestamp}</span>
                        <Chip tone={bearish ? "bear" : "bull"}>{n.sentiment}</Chip>
                        <ImportanceBadge importance={n.impact} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Panel>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base leading-snug">{selected?.headline}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2 text-[0.6875rem] text-muted-foreground">
            <span>{selected?.source}</span>
            <span>·</span>
            <span>{selected?.timestamp}</span>
            {selected && <ImportanceBadge importance={selected.impact} />}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{selected?.body}</p>
          <div>
            <div className="label-xs mb-1.5">Affected instruments</div>
            <div className="flex flex-wrap gap-1.5">
              {selected?.affected.map((a) => (
                <Chip key={a} tone="ai">
                  {a}
                </Chip>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------------------------------- AI market summary */

export function AIMarketSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ["analysis", "XAU/USD"],
    queryFn: () => marketService.getAnalysis("XAU/USD"),
  });

  return (
    <Panel title="AI Market Summary" subtitle="Flagship instrument · XAU/USD" ai>
      {isLoading || !data ? (
        <LoadingPanel rows={4} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-sm leading-relaxed text-foreground/90">{data.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/ai-analyst">
                  <MessageSquareText className="size-3.5" /> Ask AI
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/markets/$symbol" params={{ symbol: "xau-usd" }}>
                  View full analysis
                </Link>
              </Button>
            </div>
          </div>
          <div className="shrink-0">
            <AIConfluenceScore
              score={84}
              size={104}
              caption="AI confidence in the current interpretation."
            />
          </div>
        </div>
      )}
    </Panel>
  );
}
