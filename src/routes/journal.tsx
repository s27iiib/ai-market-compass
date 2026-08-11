import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/terminal/app-shell";
import {
  Chip,
  EmptyState,
  ErrorState,
  LoadingPanel,
  Panel,
  RegimeBadge,
  ScoreBar,
  StatTile,
} from "@/components/terminal/primitives";
import { journalService } from "@/services";
import { fmtPrice } from "@/lib/format";
import type { JournalEntry } from "@/lib/types";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Trading Journal — Aurum AI Trading Intelligence" },
      {
        name: "description",
        content:
          "Every trade logged against the AI score and strategy that generated it, with AI-driven pattern analysis across your history.",
      },
      { property: "og:title", content: "Trading Journal — Aurum AI Trading Intelligence" },
      {
        property: "og:description",
        content: "Trade log with results, tags and AI-identified behavioural patterns.",
      },
    ],
  }),
  component: Journal,
});

function resultTone(result: JournalEntry["result"]) {
  if (result === "WIN") return "bull" as const;
  if (result === "LOSS") return "bear" as const;
  return "neutral" as const;
}

function Journal() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["journal"],
    queryFn: journalService.getEntries,
  });

  const analyse = useMutation({
    mutationFn: journalService.analyse,
  });

  const trades = data ?? [];
  const wins = trades.filter((t) => t.result === "WIN").length;
  const winRate = trades.length ? (wins / trades.length) * 100 : undefined;
  const avgR = trades.length ? trades.reduce((sum, t) => sum + t.r, 0) / trades.length : undefined;
  const totalR = trades.reduce((sum, t) => sum + t.r, 0);

  return (
    <div className="mx-auto max-w-[130rem] space-y-4 p-3 sm:p-4 xl:p-6">
      <PageHeader
        eyebrow={`${trades.length} trades logged`}
        title="Trading Journal"
        description="Every trade paired with the AI score and reasoning behind it at entry time, so outcomes can be attributed to signal quality rather than hindsight."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Win rate"
          value={winRate !== undefined ? `${winRate.toFixed(1)}%` : "—"}
          tone="ai"
        />
        <StatTile
          label="Avg R per trade"
          value={avgR !== undefined ? `${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R` : "—"}
          tone={avgR !== undefined && avgR >= 0 ? "bull" : "bear"}
        />
        <StatTile
          label="Total R"
          value={`${totalR >= 0 ? "+" : ""}${totalR.toFixed(1)}R`}
          tone={totalR >= 0 ? "bull" : "bear"}
        />
        <StatTile label="Trades logged" value={trades.length} />
      </div>

      <Panel
        title="AI Journal Analysis"
        subtitle="Pattern recognition across your trade history"
        ai
        actions={
          <Button
            size="sm"
            onClick={() => analyse.mutate()}
            disabled={analyse.isPending || trades.length === 0}
          >
            <Sparkles className="size-3.5" />
            {analyse.isPending ? "Analysing…" : "Analyse my trading"}
          </Button>
        }
      >
        {analyse.isPending ? (
          <LoadingPanel rows={3} />
        ) : analyse.data ? (
          <ul className="space-y-3">
            {analyse.data.map((insight, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
                <span className="mt-0.5 shrink-0 text-ai">→</span>
                {insight}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Run analysis to surface patterns in your best and worst setups, sessions, and
            signal-score thresholds — grounded in the trades logged below.
          </p>
        )}
      </Panel>

      <Panel title="Trade Log" dense>
        {isLoading ? (
          <LoadingPanel rows={6} className="p-4" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : trades.length === 0 ? (
          <EmptyState title="No trades logged yet" hint="Trades will appear here once entered." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  {[
                    "Date",
                    "Asset",
                    "Dir",
                    "Entry",
                    "Exit",
                    "Result",
                    "R",
                    "AI Score",
                    "Strategy",
                    "Regime",
                    "Session",
                    "Tags",
                  ].map((h) => (
                    <th key={h} className="label-xs px-3 py-2 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                  >
                    <td className="num px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {t.date}
                    </td>
                    <td className="num px-3 py-2.5 font-semibold whitespace-nowrap">{t.symbol}</td>
                    <td className="px-3 py-2.5">
                      <Chip tone={t.direction === "LONG" ? "bull" : "bear"}>{t.direction}</Chip>
                    </td>
                    <td className="num px-3 py-2.5">{fmtPrice(t.entry, t.symbol)}</td>
                    <td className="num px-3 py-2.5">{fmtPrice(t.exit, t.symbol)}</td>
                    <td className="px-3 py-2.5">
                      <Chip tone={resultTone(t.result)}>{t.result}</Chip>
                    </td>
                    <td
                      className={`num px-3 py-2.5 font-semibold ${t.r >= 0 ? "text-bull" : "text-bear"}`}
                    >
                      {t.r >= 0 ? "+" : ""}
                      {t.r.toFixed(1)}R
                    </td>
                    <td className="w-24 px-3 py-2.5">
                      <ScoreBar score={t.aiScore} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {t.strategy}
                    </td>
                    <td className="px-3 py-2.5">
                      <RegimeBadge regime={t.regime} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {t.session}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {t.tags.map((tag) => (
                          <Chip key={tag} tone="neutral">
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
