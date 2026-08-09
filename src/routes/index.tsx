import { createFileRoute } from "@tanstack/react-router";
import { Chip, DemoTag, Panel, StatTile } from "@/components/terminal/primitives";
import { PageHeader } from "@/components/terminal/app-shell";
import {
  AIMarketSummary,
  BestOpportunities,
  CurrencyStrengthPanel,
  EconomicCalendarPanel,
  MarketNewsPanel,
  MarketOverviewCards,
} from "@/components/terminal/dashboard-widgets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Market Overview — Aurum AI Trading Intelligence" },
      {
        name: "description",
        content:
          "Live-ready market overview for gold and FX majors: AI confluence scores, ranked opportunities, currency strength, macro events and news sentiment.",
      },
      { property: "og:title", content: "Market Overview — Aurum AI Trading Intelligence" },
      {
        property: "og:description",
        content: "AI confluence scores, ranked opportunities, currency strength and macro risk for XAU/USD and FX majors.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="mx-auto max-w-[130rem] space-y-4 p-3 sm:p-4 xl:p-6">
      <PageHeader
        eyebrow="London Session · 15:12 UTC"
        title="Market Overview"
        description="The chart shows what is happening. The AI explains why, estimates what could happen next, and tells you whether the opportunity is worth taking."
        actions={
          <>
            <div className="flex items-center gap-2 rounded-md border border-bull/30 bg-bull/10 px-2.5 py-1.5">
              <span className="live-dot" />
              <span className="text-xs font-semibold tracking-wide text-bull">RISK-ON</span>
            </div>
            <Chip tone="ai">Regime confidence 91%</Chip>
            <DemoTag />
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-4">
        <StatTile label="Market regime" value="RISK-ON" tone="bull" hint="Cross-asset composite" />
        <StatTile label="Session" value="London" hint="New York opens in 2h 18m" />
        <StatTile label="Qualifying setups" value="3 of 8" tone="ai" hint="Above platform threshold" />
        <StatTile label="Event risk" value="US CPI in 42m" tone="warn" hint="Critical impact" />
      </div>

      <MarketOverviewCards />

      <AIMarketSummary />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        <BestOpportunities />
        <CurrencyStrengthPanel />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <EconomicCalendarPanel />
        <MarketNewsPanel />
      </div>

      <Panel title="Data disclosure" dense>
        <p className="px-4 py-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
          All prices, scores, probabilities and analytics shown are generated from a simulated dataset for interface
          demonstration. Nothing here is real-time market data, investment advice, or a guarantee of outcome. AI output
          expresses model estimates and scenario probabilities, with explicit invalidation conditions.
        </p>
      </Panel>
    </div>
  );
}
