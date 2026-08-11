import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/terminal/app-shell";
import {
  Chip,
  EmptyState,
  ErrorState,
  LoadingPanel,
  Panel,
  StatTile,
} from "@/components/terminal/primitives";
import { strategyService } from "@/services";
import type { Strategy } from "@/lib/types";

export const Route = createFileRoute("/strategies")({
  head: () => ({
    meta: [
      { title: "Strategy Lab — Aurum AI Trading Intelligence" },
      {
        name: "description",
        content:
          "Review every rules-based and AI-assisted strategy: win rate, profit factor, Sharpe, drawdown and covered assets.",
      },
      { property: "og:title", content: "Strategy Lab — Aurum AI Trading Intelligence" },
      {
        property: "og:description",
        content: "Performance and status for every strategy in the platform's library.",
      },
    ],
  }),
  component: StrategyLab,
});

function statusTone(status: Strategy["status"]) {
  if (status === "ACTIVE") return "bull" as const;
  if (status === "PAUSED") return "warn" as const;
  return "neutral" as const;
}

function StrategyLab() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["strategies"],
    queryFn: strategyService.getStrategies,
  });

  const active = (data ?? []).filter((s) => s.status === "ACTIVE").length;
  const avgWinRate = data?.length
    ? data.reduce((sum, s) => sum + s.winRate, 0) / data.length
    : undefined;

  return (
    <div className="mx-auto max-w-[130rem] space-y-4 p-3 sm:p-4 xl:p-6">
      <PageHeader
        eyebrow={`${data?.length ?? 0} strategies in library`}
        title="Strategy Lab"
        description="Every strategy the signal engine can draw on, with realised backtest performance. Pausing a strategy removes it from live scoring without deleting its history."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Active strategies" value={active} tone="bull" />
        <StatTile
          label="Average win rate"
          value={avgWinRate !== undefined ? `${avgWinRate.toFixed(1)}%` : "—"}
          tone="ai"
        />
        <StatTile label="Total in library" value={data?.length ?? "—"} />
      </div>

      <Panel title="Strategies" subtitle="Simulated backtest performance" dense>
        {isLoading ? (
          <LoadingPanel rows={5} className="p-4" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No strategies defined" hint="Create a strategy to see it here." />
        ) : (
          <div className="divide-y divide-border">
            {data.map((s) => (
              <div key={s.id} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                    <Chip tone={statusTone(s.status)}>{s.status}</Chip>
                    {s.assets.map((a) => (
                      <span key={a} className="num text-[0.6875rem] text-muted-foreground">
                        {a}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                  <p className="mt-2 text-[0.6875rem] text-muted-foreground">
                    Updated {s.updated} · {s.trades} trades
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[28rem]">
                  <StatTile
                    label="Win rate"
                    value={`${s.winRate.toFixed(1)}%`}
                    tone={s.winRate >= 55 ? "bull" : s.winRate >= 45 ? "ai" : "warn"}
                  />
                  <StatTile
                    label="Profit factor"
                    value={s.profitFactor.toFixed(2)}
                    tone={s.profitFactor >= 1.5 ? "bull" : "ai"}
                  />
                  <StatTile label="Sharpe" value={s.sharpe.toFixed(2)} tone="ai" />
                  <StatTile
                    label="Max drawdown"
                    value={`${s.maxDrawdown.toFixed(1)}%`}
                    tone={s.maxDrawdown <= 15 ? "ai" : "warn"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Data disclosure" dense>
        <p className="px-4 py-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
          Strategy statistics shown are from a simulated backtest dataset. See{" "}
          <Button asChild variant="link" className="h-auto p-0 text-[0.6875rem]">
            <a href="/backtesting">Backtesting</a>
          </Button>{" "}
          to run a strategy against a chosen period and instrument.
        </p>
      </Panel>
    </div>
  );
}
