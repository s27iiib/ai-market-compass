import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/terminal/app-shell";
import {
  BiasBadge,
  ChangeValue,
  DirectionBadge,
  EmptyState,
  ErrorState,
  LoadingPanel,
  Panel,
  RegimeBadge,
  RiskBadge,
  ScoreBar,
} from "@/components/terminal/primitives";
import { marketService } from "@/services";
import { symbolToSlug } from "@/lib/mock-data";
import { fmtPrice } from "@/lib/format";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Market Scanner — Aurum AI Trading Intelligence" },
      {
        name: "description",
        content: "Filter every tracked instrument by AI score, direction, strategy, risk, regime and risk/reward.",
      },
      { property: "og:title", content: "Market Scanner — Aurum AI Trading Intelligence" },
      { property: "og:description", content: "Rank and filter gold and FX setups by AI score, probability and risk/reward." },
    ],
  }),
  component: Scanner,
});

type SortKey = "score" | "prob" | "rr" | "change";

function Scanner() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["scanner"], queryFn: marketService.getScanner });
  const [minScore, setMinScore] = useState(0);
  const [minRR, setMinRR] = useState(0);
  const [direction, setDirection] = useState("ALL");
  const [regime, setRegime] = useState("ALL");
  const [sort, setSort] = useState<SortKey>("score");

  const rows = useMemo(() => {
    let out = (data ?? []).filter(
      (r) =>
        r.signal.aiScore >= minScore &&
        (r.signal.metrics?.rr ?? 0) >= minRR &&
        (direction === "ALL" || r.signal.direction === direction) &&
        (regime === "ALL" || r.quote.regime === regime),
    );
    out = out.slice().sort((a, b) => {
      if (sort === "score") return b.signal.aiScore - a.signal.aiScore;
      if (sort === "prob") return b.signal.probability - a.signal.probability;
      if (sort === "rr") return (b.signal.metrics?.rr ?? 0) - (a.signal.metrics?.rr ?? 0);
      return b.quote.changePct - a.quote.changePct;
    });
    return out;
  }, [data, minScore, minRR, direction, regime, sort]);

  return (
    <div className="mx-auto max-w-[130rem] space-y-4 p-3 sm:p-4 xl:p-6">
      <PageHeader
        eyebrow={`${rows.length} of ${data?.length ?? 0} instruments match`}
        title="Market Scanner"
        description="Filter the tracked universe by model output. Waiting is a valid result — instruments below threshold are surfaced as NO TRADE."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMinScore(80);
              setMinRR(2);
              setDirection("LONG");
              setRegime("ALL");
            }}
          >
            Preset: score &gt; 80, R &gt; 2, LONG
          </Button>
        }
      />

      <Panel title="Filters" dense>
        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <div className="label-xs mb-2">Min AI score · {minScore}</div>
            <Slider value={[minScore]} onValueChange={([v]) => setMinScore(v ?? 0)} max={95} step={5} />
          </div>
          <div>
            <div className="label-xs mb-2">Min risk/reward · {minRR.toFixed(1)}</div>
            <Slider value={[minRR]} onValueChange={([v]) => setMinRR(v ?? 0)} max={4} step={0.5} />
          </div>
          <div>
            <div className="label-xs mb-2">Direction</div>
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["ALL", "LONG", "SHORT", "WAIT"].map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d === "WAIT" ? "NO TRADE" : d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="label-xs mb-2">Market regime</div>
            <Select value={regime} onValueChange={setRegime}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["ALL", "TRENDING BULL", "TRENDING BEAR", "RANGE", "BREAKOUT", "REVERSAL", "LOW VOLATILITY"].map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="label-xs mb-2">Sort by</div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score" className="text-xs">AI score</SelectItem>
                <SelectItem value="prob" className="text-xs">Probability</SelectItem>
                <SelectItem value="rr" className="text-xs">Risk/reward</SelectItem>
                <SelectItem value="change" className="text-xs">Daily change</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Panel>

      <Panel title="Results" subtitle="Simulated dataset" dense>
        {isLoading ? (
          <LoadingPanel rows={8} className="p-4" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No instruments match these filters"
            hint="Loosen the score or risk/reward threshold to see more of the universe."
            action={
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setMinScore(0);
                  setMinRR(0);
                  setDirection("ALL");
                  setRegime("ALL");
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Asset", "Price", "Change", "AI", "Bias", "Regime", "Strategy", "Prob.", "R", "Risk", "Session", "Signal", ""].map(
                    (h) => (
                      <th key={h} className="label-xs px-3 py-2 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ quote, signal }) => (
                  <tr key={quote.symbol} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                    <td className="num px-3 py-2.5 font-semibold whitespace-nowrap">{quote.symbol}</td>
                    <td className="num px-3 py-2.5">{fmtPrice(quote.price, quote.symbol)}</td>
                    <td className="px-3 py-2.5">
                      <ChangeValue pct={quote.changePct} />
                    </td>
                    <td className="w-24 px-3 py-2.5">
                      <ScoreBar score={signal.aiScore} />
                    </td>
                    <td className="px-3 py-2.5">
                      <BiasBadge bias={quote.bias} />
                    </td>
                    <td className="px-3 py-2.5">
                      <RegimeBadge regime={quote.regime} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{signal.strategy}</td>
                    <td className="num px-3 py-2.5">{signal.probability}%</td>
                    <td className="num px-3 py-2.5">{signal.metrics ? `1:${signal.metrics.rr.toFixed(1)}` : "—"}</td>
                    <td className="px-3 py-2.5">
                      <RiskBadge risk={signal.risk} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{signal.session}</td>
                    <td className="px-3 py-2.5">
                      <DirectionBadge direction={signal.direction} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
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
    </div>
  );
}
