import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Panel,
  ErrorState,
  LoadingPanel,
  BiasBadge,
  RegimeBadge,
  ScoreBar,
  ChangeValue,
  DirectionBadge,
  Chip,
} from "@/components/terminal/primitives";
import { PageHeader } from "@/components/terminal/app-shell";
import { marketService } from "@/services";
import { symbolToSlug, WATCHLISTS } from "@/lib/mock-data";
import { fmtPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/markets/")({
  head: () => ({
    meta: [
      { title: "Markets — Aurum AI Trading Intelligence" },
      {
        name: "description",
        content:
          "All tracked instruments with AI confluence scores, bias, regime classification and watchlists.",
      },
      { property: "og:title", content: "Markets — Aurum AI Trading Intelligence" },
      {
        property: "og:description",
        content: "Gold and FX majors with AI confluence scoring and regime classification.",
      },
    ],
  }),
  component: Markets,
});

function Markets() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["markets"],
    queryFn: marketService.getMarkets,
  });

  return (
    <div className="mx-auto max-w-[130rem] space-y-4 p-3 sm:p-4 xl:p-6">
      <PageHeader
        eyebrow="8 instruments tracked"
        title="Markets"
        description="XAU/USD is the flagship instrument. The architecture supports additional assets without UI changes."
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
        <Panel title="Instrument Board" dense>
          {isLoading ? (
            <LoadingPanel rows={8} className="p-4" />
          ) : isError || !data ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-xs">
                <thead>
                  <tr className="border-b border-border text-left">
                    {[
                      "Asset",
                      "Price",
                      "Change",
                      "Bid / Ask",
                      "Spread",
                      "AI",
                      "Bias",
                      "Regime",
                      "Setup",
                      "",
                    ].map((h) => (
                      <th key={h} className="label-xs px-4 py-2 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((q) => (
                    <tr
                      key={q.symbol}
                      className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                    >
                      <td className="num px-4 py-2.5 font-semibold whitespace-nowrap">
                        {q.symbol}
                      </td>
                      <td className="num px-4 py-2.5">{fmtPrice(q.price, q.symbol)}</td>
                      <td className="px-4 py-2.5">
                        <ChangeValue pct={q.changePct} />
                      </td>
                      <td className="num px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                        {fmtPrice(q.bid, q.symbol)} / {fmtPrice(q.ask, q.symbol)}
                      </td>
                      <td className="num px-4 py-2.5 text-muted-foreground">
                        {q.spread.toFixed(2)}
                      </td>
                      <td className="w-28 px-4 py-2.5">
                        <ScoreBar score={q.aiScore} />
                      </td>
                      <td className="px-4 py-2.5">
                        <BiasBadge bias={q.bias} />
                      </td>
                      <td className="px-4 py-2.5">
                        <RegimeBadge regime={q.regime} />
                      </td>
                      <td className="px-4 py-2.5">
                        {q.setup ? (
                          <DirectionBadge direction={q.setup} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/markets/$symbol" params={{ symbol: symbolToSlug(q.symbol) }}>
                            Workspace
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

        <div className="space-y-3">
          {WATCHLISTS.map((w) => (
            <Panel key={w.id} title={w.name} subtitle="Drag to reorder (demo)" dense>
              <ul className="divide-y divide-border">
                {w.symbols.map((s) => (
                  <li key={s} className="flex items-center justify-between px-4 py-2.5">
                    <span className="num text-xs font-medium">{s}</span>
                    <Chip tone="neutral">tracked</Chip>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}
