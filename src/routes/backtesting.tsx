import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Play } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/terminal/app-shell";
import { EmptyState, LoadingPanel, Panel, StatTile } from "@/components/terminal/primitives";
import { backtestService } from "@/services";
import { ASSETS } from "@/lib/mock-data";
import { fmtPct } from "@/lib/format";

export const Route = createFileRoute("/backtesting")({
  head: () => ({
    meta: [
      { title: "Backtesting — Aurum AI Trading Intelligence" },
      {
        name: "description",
        content:
          "Simulate a strategy against historical data: equity curve, drawdown, win rate, profit factor, and performance by regime and session.",
      },
      { property: "og:title", content: "Backtesting — Aurum AI Trading Intelligence" },
      {
        property: "og:description",
        content: "Historical trade simulation with equity curve and regime/session breakdowns.",
      },
    ],
  }),
  component: Backtesting,
});

const TIMEFRAMES = ["5m", "15m", "1H", "4H", "1D"];

function Backtesting() {
  const [symbol, setSymbol] = useState("XAU/USD");
  const [timeframe, setTimeframe] = useState("15m");
  const [seed, setSeed] = useState(7);

  const run = useMutation({
    mutationFn: () => backtestService.run({ seed }),
  });

  const result = run.data;

  return (
    <div className="mx-auto max-w-[130rem] space-y-4 p-3 sm:p-4 xl:p-6">
      <PageHeader
        eyebrow="Historical simulation"
        title="Backtesting"
        description="Simulate entries, stops and targets against historical candles with spread, commission and slippage applied. Results are a distribution of outcomes, not a guarantee of future performance."
      />

      <Panel title="Inputs" dense>
        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="label-xs mb-2">Instrument</div>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSETS.map((a) => (
                  <SelectItem key={a.symbol} value={a.symbol} className="text-xs">
                    {a.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="label-xs mb-2">Timeframe</div>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf} value={tf} className="text-xs">
                    {tf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="label-xs mb-2">Period</div>
            <Select defaultValue="2021-2026">
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2021-2026" className="text-xs">
                  2021 – 2026
                </SelectItem>
                <SelectItem value="2025-2026" className="text-xs">
                  2025 – 2026
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              onClick={() => {
                setSeed((s) => s + 1);
                run.mutate();
              }}
              disabled={run.isPending}
            >
              <Play className="size-3.5" /> {run.isPending ? "Running…" : "Run backtest"}
            </Button>
          </div>
        </div>
      </Panel>

      {run.isPending ? (
        <Panel title="Results" dense>
          <LoadingPanel rows={6} className="p-4" />
        </Panel>
      ) : !result ? (
        <Panel dense>
          <EmptyState
            title="No backtest run yet"
            hint={`Run ${symbol} on ${timeframe} to see the equity curve, drawdown and trade statistics.`}
          />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            <StatTile
              label="Net return"
              value={fmtPct(result.netReturn, 1)}
              tone={result.netReturn >= 0 ? "bull" : "bear"}
            />
            <StatTile label="Win rate" value={`${result.winRate.toFixed(1)}%`} tone="ai" />
            <StatTile label="Profit factor" value={result.profitFactor.toFixed(2)} tone="ai" />
            <StatTile label="Sharpe" value={result.sharpe.toFixed(2)} tone="ai" />
            <StatTile label="Sortino" value={result.sortino.toFixed(2)} tone="ai" />
            <StatTile
              label="Max drawdown"
              value={`${result.maxDrawdown.toFixed(1)}%`}
              tone="warn"
            />
            <StatTile label="Avg R" value={result.avgR.toFixed(2)} tone="ai" />
            <StatTile label="Trades" value={result.trades} />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Panel title="Equity Curve" subtitle={`${symbol} · ${timeframe} · simulated`}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.equity}>
                    <defs>
                      <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-ai)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-ai)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="i"
                      stroke="var(--color-muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      width={48}
                      domain={["auto", "auto"]}
                    />
                    <RTooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border-strong)",
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    />
                    <Area
                      dataKey="equity"
                      stroke="var(--color-ai)"
                      fill="url(#equityFill)"
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Monthly Returns">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.monthly}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="month"
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
                    <RTooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border-strong)",
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="ret" radius={[2, 2, 0, 0]}>
                      {result.monthly.map((m, i) => (
                        <Cell
                          key={i}
                          fill={m.ret >= 0 ? "var(--color-bull)" : "var(--color-bear)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <Panel title="Trade Distribution" subtitle="Outcome in R-multiples">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.distribution}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="bucket"
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
                    <RTooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border-strong)",
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {result.distribution.map((d, i) => (
                        <Cell
                          key={i}
                          fill={
                            d.bucket.startsWith("-") ? "var(--color-bear)" : "var(--color-bull)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Expectancy by Regime">
              <div className="space-y-2.5">
                {result.byRegime.map((r) => (
                  <div key={r.regime} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{r.regime}</span>
                    <span
                      className={`num text-xs font-semibold ${r.expectancy >= 0 ? "text-bull" : "text-bear"}`}
                    >
                      {r.expectancy >= 0 ? "+" : ""}
                      {r.expectancy.toFixed(2)}R
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Expectancy by Session">
              <div className="space-y-2.5">
                {result.bySession.map((s) => (
                  <div key={s.session} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{s.session}</span>
                    <span
                      className={`num text-xs font-semibold ${s.expectancy >= 0 ? "text-bull" : "text-bear"}`}
                    >
                      {s.expectancy >= 0 ? "+" : ""}
                      {s.expectancy.toFixed(2)}R
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title="Data disclosure" dense>
            <p className="px-4 py-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
              This backtest runs against a simulated dataset for interface demonstration. Real
              historical performance depends on market-data quality, execution assumptions and
              survivorship bias, none of which are modelled here yet.
            </p>
          </Panel>
        </>
      )}
    </div>
  );
}
