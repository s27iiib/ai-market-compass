import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import type { ModelMetrics } from "@/lib/types";

export const Route = createFileRoute("/model-lab")({
  head: () => ({
    meta: [
      { title: "AI Model Lab — Aurum AI Trading Intelligence" },
      {
        name: "description",
        content:
          "Monitor every model in the signal fusion pipeline: accuracy, calibration, out-of-sample performance and drift.",
      },
      { property: "og:title", content: "AI Model Lab — Aurum AI Trading Intelligence" },
      {
        property: "og:description",
        content: "Model health, calibration and drift monitoring for the AI signal pipeline.",
      },
    ],
  }),
  component: ModelLab,
});

function statusTone(status: ModelMetrics["status"]) {
  if (status === "HEALTHY") return "bull" as const;
  if (status === "MONITORING") return "ai" as const;
  return "warn" as const;
}

function driftTone(drift: ModelMetrics["drift"]) {
  if (drift === "NONE") return "neutral" as const;
  if (drift === "LOW") return "ai" as const;
  return "warn" as const;
}

function metricTone(value: number) {
  if (value >= 0.8) return "bull" as const;
  if (value >= 0.65) return "ai" as const;
  return "warn" as const;
}

function ModelLab() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["models"],
    queryFn: strategyService.getModels,
  });

  const healthy = (data ?? []).filter((m) => m.status === "HEALTHY").length;
  const drifting = (data ?? []).filter((m) => m.drift !== "NONE").length;

  return (
    <div className="mx-auto max-w-[130rem] space-y-4 p-3 sm:p-4 xl:p-6">
      <PageHeader
        eyebrow={`${data?.length ?? 0} models in pipeline`}
        title="AI Model Lab"
        description="Every model feeding the signal fusion engine, monitored for accuracy, calibration and drift. Drift is a reason to investigate, not to retrain automatically."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Healthy models" value={`${healthy} of ${data?.length ?? 0}`} tone="bull" />
        <StatTile
          label="Models with drift"
          value={drifting}
          tone={drifting > 0 ? "warn" : "bull"}
        />
        <StatTile
          label="Retraining now"
          value={(data ?? []).filter((m) => m.status === "RETRAINING").length}
          tone="ai"
        />
      </div>

      <Panel title="Models" subtitle="Regime → Direction → Probability → Risk → Fusion" dense>
        {isLoading ? (
          <LoadingPanel rows={5} className="p-4" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No models registered" />
        ) : (
          <div className="divide-y divide-border">
            {data.map((m) => (
              <div key={m.name} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                    <span className="num text-[0.6875rem] text-muted-foreground">{m.version}</span>
                    <Chip tone={statusTone(m.status)}>{m.status}</Chip>
                    <Chip tone={driftTone(m.drift)}>DRIFT: {m.drift}</Chip>
                  </div>
                  <p className="mt-2 text-[0.6875rem] text-muted-foreground">
                    Last trained {m.lastTrained}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:w-[36rem]">
                  <StatTile
                    label="Accuracy"
                    value={m.accuracy.toFixed(2)}
                    tone={metricTone(m.accuracy)}
                  />
                  <StatTile
                    label="Precision"
                    value={m.precision.toFixed(2)}
                    tone={metricTone(m.precision)}
                  />
                  <StatTile
                    label="Recall"
                    value={m.recall.toFixed(2)}
                    tone={metricTone(m.recall)}
                  />
                  <StatTile label="AUC" value={m.auc.toFixed(2)} tone={metricTone(m.auc)} />
                  <StatTile
                    label="Calibration"
                    value={m.calibration.toFixed(2)}
                    tone={metricTone(m.calibration)}
                  />
                  <StatTile label="OOS" value={m.oos.toFixed(2)} tone={metricTone(m.oos)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Data disclosure" dense>
        <p className="px-4 py-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
          Model metrics shown are simulated for interface demonstration. Once trained on real data,
          this view will track precision, recall, ROC-AUC, calibration, Brier score and
          out-of-sample expectancy per Phase 10 of the platform roadmap.
        </p>
      </Panel>
    </div>
  );
}
