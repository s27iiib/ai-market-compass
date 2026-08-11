import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PageHeader } from "@/components/terminal/app-shell";
import {
  Chip,
  EmptyState,
  ErrorState,
  ImportanceBadge,
  LoadingPanel,
  Panel,
  RiskBadge,
  StatTile,
} from "@/components/terminal/primitives";
import { economicService, marketService, strategyService } from "@/services";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk Center — Aurum AI Trading Intelligence" },
      {
        name: "description",
        content:
          "Aggregate exposure, correlation risk, event risk and strategy drawdown across every active AI setup.",
      },
      { property: "og:title", content: "Risk Center — Aurum AI Trading Intelligence" },
      {
        property: "og:description",
        content: "Currency exposure, correlation and drawdown risk across active signals.",
      },
    ],
  }),
  component: RiskCenter,
});

function RiskCenter() {
  const scanner = useQuery({ queryKey: ["scanner"], queryFn: marketService.getScanner });
  const calendar = useQuery({ queryKey: ["calendar"], queryFn: economicService.getCalendar });
  const strategies = useQuery({ queryKey: ["strategies"], queryFn: strategyService.getStrategies });

  const rows = (scanner.data ?? []).filter((r) => r.signal.direction !== "WAIT");

  const exposure = useMemo(() => {
    const net = new Map<string, number>();
    for (const { signal } of rows) {
      const parts = signal.symbol.split("/");
      const base = parts[0]!;
      const quote = parts[1]!;
      const dir = signal.direction === "LONG" ? 1 : -1;
      net.set(base, (net.get(base) ?? 0) + dir);
      net.set(quote, (net.get(quote) ?? 0) - dir);
    }
    return [...net.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  }, [rows]);

  const correlated = (scanner.data ?? []).filter(
    (r) => r.signal.metrics && r.signal.metrics.correlationRisk !== "LOW",
  );

  const upcomingHighImpact = (calendar.data ?? []).filter(
    (e) => e.minutesAway > 0 && (e.importance === "HIGH" || e.importance === "CRITICAL"),
  );

  const highRiskSignals = rows.filter((r) => r.signal.risk === "HIGH").length;
  const avgMaxDrawdown = strategies.data?.length
    ? strategies.data.reduce((sum, s) => sum + s.maxDrawdown, 0) / strategies.data.length
    : undefined;

  const loading = scanner.isLoading || calendar.isLoading || strategies.isLoading;

  return (
    <div className="mx-auto max-w-[130rem] space-y-4 p-3 sm:p-4 xl:p-6">
      <PageHeader
        eyebrow="Signal-level aggregation"
        title="Risk Center"
        description="Exposure, correlation and event risk derived from every currently active AI setup. This reflects the model's live opinions, not an open portfolio — paper trading will add real position tracking."
      />

      {loading ? (
        <LoadingPanel rows={6} />
      ) : scanner.isError ? (
        <ErrorState onRetry={() => scanner.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Active setups" value={rows.length} tone="ai" />
            <StatTile
              label="High-risk setups"
              value={highRiskSignals}
              tone={highRiskSignals > 0 ? "warn" : "bull"}
            />
            <StatTile
              label="Correlated exposure"
              value={correlated.length}
              tone={correlated.length > 0 ? "warn" : "bull"}
            />
            <StatTile
              label="High-impact events today"
              value={upcomingHighImpact.length}
              tone={upcomingHighImpact.length > 0 ? "warn" : "bull"}
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <Panel
              title="Net Currency Exposure"
              subtitle="Sum of currency legs across active LONG/SHORT setups"
            >
              {exposure.length === 0 ? (
                <EmptyState
                  title="No directional exposure"
                  hint="No active LONG or SHORT setups right now."
                />
              ) : (
                <div className="space-y-2.5">
                  {exposure.map(([code, net]) => (
                    <div key={code} className="flex items-center gap-3">
                      <span className="num w-10 shrink-0 text-xs font-semibold">{code}</span>
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "absolute top-0 h-full rounded-full",
                            net >= 0 ? "left-1/2 bg-bull" : "right-1/2 bg-bear",
                          )}
                          style={{ width: `${Math.min(Math.abs(net) * 18, 50)}%` }}
                        />
                        <div className="absolute inset-y-0 left-1/2 w-px bg-border-strong" />
                      </div>
                      <span
                        className={cn(
                          "num w-10 shrink-0 text-right text-xs font-semibold",
                          net > 0 ? "text-bull" : net < 0 ? "text-bear" : "text-muted-foreground",
                        )}
                      >
                        {net > 0 ? "+" : ""}
                        {net}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Correlation Risk" subtitle="Setups sharing a currency factor">
              {correlated.length === 0 ? (
                <EmptyState
                  title="No elevated correlation"
                  hint="Active setups do not currently concentrate exposure to a single currency factor."
                />
              ) : (
                <div className="space-y-3">
                  {correlated.map(({ quote, signal }) => (
                    <div key={signal.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="num text-xs font-semibold">{quote.symbol}</span>
                        <Chip tone={signal.direction === "LONG" ? "bull" : "bear"}>
                          {signal.direction}
                        </Chip>
                      </div>
                      <RiskBadge risk={signal.metrics!.correlationRisk} />
                    </div>
                  ))}
                  <p className="border-t border-border pt-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
                    Correlated positions understate true portfolio risk — treat combined size as a
                    single factor bet, not independent trades.
                  </p>
                </div>
              )}
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <Panel title="Event Risk" subtitle="High and critical impact, remaining today" dense>
              {upcomingHighImpact.length === 0 ? (
                <EmptyState title="No high-impact events remaining today" />
              ) : (
                <div className="divide-y divide-border">
                  {upcomingHighImpact.map((e) => (
                    <div
                      key={e.id}
                      className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5"
                    >
                      <span className="num text-xs text-muted-foreground">{e.time}</span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium">
                          {e.country} · {e.event}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-1">
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

            <Panel
              title="Strategy Drawdown Risk"
              subtitle="Max historical drawdown by strategy"
              dense
            >
              {!strategies.data || strategies.data.length === 0 ? (
                <EmptyState title="No strategies to assess" />
              ) : (
                <div className="divide-y divide-border">
                  {strategies.data.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium">{s.name}</div>
                        <div className="text-[0.6875rem] text-muted-foreground">{s.status}</div>
                      </div>
                      <span
                        className={cn(
                          "num text-xs font-semibold",
                          s.maxDrawdown > (avgMaxDrawdown ?? 0) ? "text-warn" : "text-foreground",
                        )}
                      >
                        {s.maxDrawdown.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Data disclosure" dense>
            <p className="px-4 py-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
              This view aggregates the model's currently active setups and simulated strategy
              statistics. It does not yet reflect real open positions or account-level risk — that
              requires the paper trading layer described in the platform roadmap.
            </p>
          </Panel>
        </>
      )}
    </div>
  );
}
