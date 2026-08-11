import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/terminal/app-shell";
import {
  Chip,
  EmptyState,
  ErrorState,
  LoadingPanel,
  Panel,
} from "@/components/terminal/primitives";
import { alertService } from "@/services";
import { ASSETS } from "@/lib/mock-data";
import type { Alert } from "@/lib/types";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — Aurum AI Trading Intelligence" },
      {
        name: "description",
        content:
          "Configure price, AI score, signal, structure, macro and risk alerts for tracked instruments.",
      },
      { property: "og:title", content: "Alerts — Aurum AI Trading Intelligence" },
      { property: "og:description", content: "Background monitoring for price and model events." },
    ],
  }),
  component: Alerts,
});

const ALERT_TYPES: Alert["type"][] = ["PRICE", "AI SCORE", "SIGNAL", "STRUCTURE", "MACRO", "RISK"];

function typeTone(type: Alert["type"]) {
  if (type === "RISK") return "bear" as const;
  if (type === "MACRO") return "warn" as const;
  if (type === "AI SCORE" || type === "SIGNAL") return "ai" as const;
  return "neutral" as const;
}

function Alerts() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["alerts"],
    queryFn: alertService.getAlerts,
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("XAU/USD");
  const [type, setType] = useState<Alert["type"]>("PRICE");
  const [condition, setCondition] = useState("");

  useEffect(() => {
    if (data) setAlerts(data);
  }, [data]);

  const active = alerts.filter((a) => a.active).length;

  const toggle = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  };

  const remove = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Alert removed");
  };

  const create = () => {
    if (!condition.trim()) return;
    const newAlert: Alert = {
      id: crypto.randomUUID(),
      type,
      symbol,
      condition: condition.trim(),
      active: true,
      created: "Just now",
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setCondition("");
    setOpen(false);
    toast.success("Alert created", { description: `${symbol} · ${newAlert.condition}` });
  };

  return (
    <div className="mx-auto max-w-[130rem] space-y-4 p-3 sm:p-4 xl:p-6">
      <PageHeader
        eyebrow={`${active} of ${alerts.length} active`}
        title="Alerts"
        description="Background workers watch the signal engine and notify you when a threshold is crossed, so you don't have to watch the screen."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-3.5" /> New alert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="label-xs mb-1.5 block">Instrument</Label>
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
                  <Label className="label-xs mb-1.5 block">Alert type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as Alert["type"])}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALERT_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="label-xs mb-1.5 block">Condition</Label>
                  <Input
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="e.g. Price > 3,450.00"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={create} disabled={!condition.trim()}>
                  Create alert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Panel title="Configured Alerts" dense>
        {isLoading ? (
          <LoadingPanel rows={5} className="p-4" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No alerts configured"
            hint="Create an alert to be notified when price, score or structure conditions are met."
          />
        ) : (
          <div className="divide-y divide-border">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <Bell
                  className={`size-4 shrink-0 ${a.active ? "text-ai" : "text-muted-foreground"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="num text-sm font-semibold">{a.symbol}</span>
                    <Chip tone={typeTone(a.type)}>{a.type}</Chip>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.condition}</p>
                </div>
                <span className="hidden text-[0.6875rem] text-muted-foreground sm:block">
                  {a.created}
                </span>
                <Switch checked={a.active} onCheckedChange={() => toggle(a.id)} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-bear"
                  onClick={() => remove(a.id)}
                  aria-label="Delete alert"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Data disclosure" dense>
        <p className="px-4 py-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
          Alerts are simulated for interface demonstration and are not persisted or evaluated
          against live data yet. Creating, toggling or removing an alert only updates local state.
        </p>
      </Panel>
    </div>
  );
}
