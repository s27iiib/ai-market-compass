import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import {
  BiasBadge,
  ChangeValue,
  Chip,
  DemoTag,
  ErrorState,
  LoadingPanel,
  Panel,
  RegimeBadge,
  ScoreBar,
  StatTile,
} from "@/components/terminal/primitives";
import {
  CandlestickChart,
  DEFAULT_OVERLAYS,
  type ChartOverlays,
} from "@/components/terminal/candlestick-chart";
import {
  AIIntelligencePanel,
  ForecastTab,
  LiquidityMap,
  MacroTab,
  MultiTimeframePanel,
  OrderFlowTab,
  RegimePanel,
  RiskTab,
  SentimentTab,
  StructurePanel,
  TechnicalTab,
} from "@/components/terminal/workspace";
import { assetBySymbol, slugToSymbol } from "@/lib/mock-data";
import { macroService, marketService } from "@/services";
import { fmtPrice } from "@/lib/format";
import { useLivePrices } from "@/lib/use-live-prices";
import type { Timeframe } from "@/lib/types";

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W"];

const OVERLAY_LABELS: { key: keyof ChartOverlays; label: string }[] = [
  { key: "ema", label: "EMA" },
  { key: "sma", label: "SMA" },
  { key: "vwap", label: "VWAP" },
  { key: "bollinger", label: "Bollinger" },
  { key: "volume", label: "Volume" },
  { key: "structure", label: "Structure" },
  { key: "liquidity", label: "Liquidity" },
  { key: "supplyDemand", label: "Supply/Demand" },
  { key: "aiZone", label: "AI entry zone" },
  { key: "targets", label: "SL / TP" },
  { key: "forecast", label: "AI range" },
];

export const Route = createFileRoute("/markets/$symbol")({
  loader: ({ params }) => {
    const symbol = slugToSymbol(params.symbol);
    if (!assetBySymbol(symbol)) throw notFound();
    return { symbol };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Instrument unavailable — Aurum" }, { name: "robots", content: "noindex" }],
      };
    }
    const t = `${loaderData.symbol} Workspace — Aurum AI Trading Intelligence`;
    const d = `AI market intelligence for ${loaderData.symbol}: confluence score, structure, liquidity, macro context, scenario probabilities and risk.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
      ],
    };
  },
  component: Workspace,
});

function Workspace() {
  const { symbol } = Route.useLoaderData();
  const asset = assetBySymbol(symbol)!;
  const [tf, setTf] = useState<Timeframe>("1H");
  const [overlays, setOverlays] = useState<ChartOverlays>(DEFAULT_OVERLAYS);

  const quote = useQuery({
    queryKey: ["market", symbol],
    queryFn: () => marketService.getMarket(symbol),
  });
  const candles = useQuery({
    queryKey: ["candles", symbol, tf],
    queryFn: () => marketService.getCandles(symbol, tf),
  });
  const analysis = useQuery({
    queryKey: ["analysis", symbol],
    queryFn: () => marketService.getAnalysis(symbol),
  });

  const technical = useQuery({
    queryKey: ["technical", symbol, tf],
    queryFn: () => marketService.getTechnical(symbol, tf),
    // 404 until a timeframe is backfilled, 409 when there's under 200 candles
    // for the 200-period MA — neither is worth retrying.
    retry: false,
  });

  const macro = useQuery({
    queryKey: ["macro"],
    queryFn: macroService.getMacro,
    retry: false,
  });

  const { tick, connected } = useLivePrices(symbol);

  // Splice the live forming candle onto the historical series: replace the
  // last bar if it's the same interval, append if the interval just rolled.
  const liveCandles = useMemo(() => {
    const history = candles.data;
    const forming = tick?.candles[tf];
    if (!history || !forming) return history;
    const last = history[history.length - 1];
    if (last && last.t === forming.t) return [...history.slice(0, -1), forming];
    if (last && forming.t > last.t) return [...history, forming];
    return history;
  }, [candles.data, tick, tf]);

  const a = analysis.data;
  const levels = a
    ? {
        entryLow: (a.signal.metrics?.entry ?? a.forecast.expectedRange[0]) * 0.999,
        entryHigh: (a.signal.metrics?.entry ?? a.forecast.expectedRange[0]) * 1.001,
        stop: a.signal.metrics?.stop ?? a.forecast.invalidation,
        tp1: a.signal.metrics?.tp1 ?? a.forecast.keyUpside,
        tp2: a.signal.metrics?.tp2 ?? a.forecast.keyUpside,
        forecastLow: a.forecast.expectedRange[0],
        forecastHigh: a.forecast.expectedRange[1],
      }
    : null;

  return (
    <div className="mx-auto max-w-[130rem] space-y-3 p-3 sm:p-4 xl:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link to="/markets">
          <ChevronLeft className="size-3.5" /> All markets
        </Link>
      </Button>

      {/* Market header */}
      <Panel dense>
        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="num text-xl font-semibold tracking-tight">{symbol}</h2>
              <span className="truncate text-xs text-muted-foreground">{asset.name}</span>
              <DemoTag />
            </div>
            {quote.data ? (
              <div className="mt-2 flex flex-wrap items-end gap-x-5 gap-y-2">
                <span className="num text-2xl font-semibold">
                  {fmtPrice(quote.data.price, symbol)}
                </span>
                <ChangeValue pct={quote.data.changePct} className="text-base" />
                <div className="num flex flex-wrap gap-x-4 text-[0.6875rem] text-muted-foreground">
                  <span>Bid {fmtPrice(quote.data.bid, symbol)}</span>
                  <span>Ask {fmtPrice(quote.data.ask, symbol)}</span>
                  <span>Spread {quote.data.spread.toFixed(2)}</span>
                  <span>H {fmtPrice(quote.data.dayHigh, symbol)}</span>
                  <span>L {fmtPrice(quote.data.dayLow, symbol)}</span>
                  <span>London session</span>
                </div>
              </div>
            ) : (
              <LoadingPanel rows={1} className="mt-2 max-w-sm" />
            )}
          </div>
          {a && (
            <div className="flex flex-wrap items-center gap-3">
              <BiasBadge bias={a.bias} className="text-sm" />
              <RegimeBadge regime={a.regime} />
              <div className="w-36">
                <div className="label-xs mb-1">AI confluence</div>
                <ScoreBar score={a.aiScore} />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.success(`Alert created for ${symbol}`)}
              >
                <Bell className="size-3.5" /> Alert
              </Button>
            </div>
          )}
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          {/* Chart */}
          <Panel
            dense
            title={`${symbol} · ${tf}`}
            subtitle={
              connected ? "Live · scroll to zoom, drag to pan" : "Scroll to zoom, drag to pan"
            }
            actions={
              <div className="flex flex-wrap items-center gap-1">
                {connected && <span className="live-dot mr-1.5" />}
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTf(t)}
                    className={`num rounded px-1.5 py-1 text-[0.6875rem] transition-colors ${
                      tf === t
                        ? "bg-ai text-ai-foreground font-semibold"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            }
          >
            <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2">
              {OVERLAY_LABELS.map((o) => (
                <Toggle
                  key={o.key}
                  size="sm"
                  pressed={overlays[o.key]}
                  onPressedChange={(v) => setOverlays((prev) => ({ ...prev, [o.key]: v }))}
                  className="h-6 rounded border border-border px-2 text-[0.6875rem] data-[state=on]:border-ai/40 data-[state=on]:bg-ai/15 data-[state=on]:text-ai"
                >
                  {o.label}
                </Toggle>
              ))}
            </div>
            {candles.isError ? (
              <ErrorState onRetry={() => candles.refetch()} />
            ) : candles.isLoading || !liveCandles || !levels ? (
              <div className="p-4">
                <LoadingPanel rows={8} />
              </div>
            ) : (
              <CandlestickChart
                candles={liveCandles}
                symbol={symbol}
                levels={levels}
                overlays={overlays}
                height={470}
              />
            )}
            {a && (
              <div className="grid grid-cols-3 gap-2 border-t border-border p-3">
                {a.forecast.scenarios.map((s) => (
                  <StatTile
                    key={s.scenario}
                    label={s.scenario === "BASE" ? "Neutral (next 4h)" : `${s.scenario} (next 4h)`}
                    value={`${s.probability}%`}
                    tone={
                      s.scenario === "BULLISH" ? "bull" : s.scenario === "BEARISH" ? "bear" : "warn"
                    }
                  />
                ))}
              </div>
            )}
          </Panel>

          {/* Analysis tabs */}
          {analysis.isLoading || !a ? (
            <Panel>
              <LoadingPanel rows={6} />
            </Panel>
          ) : (
            <Tabs defaultValue="overview">
              <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
                {[
                  "overview",
                  "technical",
                  "structure",
                  "macro",
                  "orderflow",
                  "sentiment",
                  "news",
                  "forecast",
                  "risk",
                ].map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="rounded-md border border-border bg-card px-3 py-1.5 text-xs capitalize data-[state=active]:border-ai/40 data-[state=active]:bg-ai/12 data-[state=active]:text-ai"
                  >
                    {t === "orderflow" ? "Order Flow" : t === "forecast" ? "AI Forecast" : t}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-3 space-y-3">
                <div className="grid gap-3 lg:grid-cols-2">
                  <MultiTimeframePanel analysis={a} />
                  <RegimePanel analysis={a} />
                </div>
                <Panel title="AI Summary" ai>
                  <p className="text-sm leading-relaxed text-foreground/90">{a.summary}</p>
                </Panel>
              </TabsContent>
              <TabsContent value="technical" className="mt-3">
                <TechnicalTab analysis={a} technical={technical.data} />
              </TabsContent>
              <TabsContent value="structure" className="mt-3 grid gap-3 lg:grid-cols-2">
                <StructurePanel analysis={a} />
                <LiquidityMap analysis={a} />
              </TabsContent>
              <TabsContent value="macro" className="mt-3">
                <MacroTab analysis={a} macro={macro.data} />
              </TabsContent>
              <TabsContent value="orderflow" className="mt-3">
                <OrderFlowTab analysis={a} />
              </TabsContent>
              <TabsContent value="sentiment" className="mt-3">
                <SentimentTab analysis={a} />
              </TabsContent>
              <TabsContent value="news" className="mt-3">
                <Panel title="Instrument News" dense>
                  <ul className="divide-y divide-border">
                    {[
                      "Fed signals higher-for-longer rate environment",
                      "US 10Y real yields slip to three-week low",
                      "Dollar index drifts lower ahead of inflation data",
                    ].map((h) => (
                      <li key={h} className="px-4 py-3 text-xs">
                        <p className="font-medium">{h}</p>
                        <div className="mt-1 flex gap-2">
                          <Chip tone="ai">{symbol}</Chip>
                          <Chip tone="warn">High impact</Chip>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </TabsContent>
              <TabsContent value="forecast" className="mt-3">
                <ForecastTab analysis={a} />
              </TabsContent>
              <TabsContent value="risk" className="mt-3">
                <RiskTab analysis={a} />
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* AI intelligence panel */}
        <div className="min-w-0">
          {analysis.isLoading || !a ? (
            <Panel title="AI Market Intelligence" ai>
              <LoadingPanel rows={8} />
            </Panel>
          ) : analysis.isError ? (
            <ErrorState onRetry={() => analysis.refetch()} />
          ) : (
            <AIIntelligencePanel analysis={a} />
          )}
        </div>
      </div>
    </div>
  );
}
