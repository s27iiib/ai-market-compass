import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/terminal/app-shell";
import { DemoTag, Panel } from "@/components/terminal/primitives";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Aurum AI Trading Intelligence" },
      {
        name: "description",
        content: "Account, risk defaults, notification preferences and appearance settings.",
      },
      { property: "og:title", content: "Settings — Aurum AI Trading Intelligence" },
      { property: "og:description", content: "Configure account, risk defaults and alerts." },
    ],
  }),
  component: SettingsPage,
});

const NOTIFICATION_TYPES = [
  {
    key: "signal",
    label: "New AI signals",
    hint: "A new LONG/SHORT setup clears your score threshold",
  },
  { key: "invalidated", label: "Signal invalidation", hint: "An active setup's structure fails" },
  { key: "macro", label: "Macro & economic events", hint: "High or critical-impact releases" },
  { key: "risk", label: "Risk warnings", hint: "Correlated exposure or elevated event risk" },
  { key: "model", label: "Model status", hint: "Retraining, drift or health changes" },
] as const;

function SettingsPage() {
  const [riskPerTrade, setRiskPerTrade] = useState("1.0");
  const [maxPositions, setMaxPositions] = useState("3");
  const [minScore, setMinScore] = useState("75");
  const [defaultRR, setDefaultRR] = useState("2.0");
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    signal: true,
    invalidated: true,
    macro: true,
    risk: true,
    model: false,
  });
  const [compactMode, setCompactMode] = useState(false);

  const save = () => toast.success("Settings saved", { description: "Local demo state only." });

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-3 sm:p-4 xl:p-6">
      <PageHeader
        eyebrow="Local preferences"
        title="Settings"
        description="Account details, default risk parameters, alert preferences and appearance."
        actions={<DemoTag />}
      />

      <Tabs defaultValue="account">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {["account", "risk", "notifications", "appearance"].map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs capitalize data-[state=active]:border-ai/40 data-[state=active]:bg-ai/12 data-[state=active]:text-ai"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="account" className="mt-3">
          <Panel title="Account">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="label-xs mb-1.5 block">Display name</Label>
                <Input defaultValue="M. Kessler" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="label-xs mb-1.5 block">Email</Label>
                <Input defaultValue="m.kessler@example.com" disabled className="h-9 text-sm" />
              </div>
              <div>
                <Label className="label-xs mb-1.5 block">Account tier</Label>
                <Input defaultValue="Pro · Demo account" disabled className="h-9 text-sm" />
              </div>
              <div>
                <Label className="label-xs mb-1.5 block">Base currency</Label>
                <Select defaultValue="USD">
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="risk" className="mt-3">
          <Panel
            title="Risk Defaults"
            subtitle="Applied as suggested defaults across scanner, journal and paper trading"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="label-xs mb-1.5 block">Default risk per trade (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="label-xs mb-1.5 block">Max concurrent positions</Label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  max="20"
                  value={maxPositions}
                  onChange={(e) => setMaxPositions(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="label-xs mb-1.5 block">Minimum AI score to surface</Label>
                <Input
                  type="number"
                  step="5"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="label-xs mb-1.5 block">Default minimum risk/reward</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={defaultRR}
                  onChange={(e) => setDefaultRR(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="notifications" className="mt-3">
          <Panel title="Notification Preferences">
            <div className="divide-y divide-border">
              {NOTIFICATION_TYPES.map((n) => (
                <div
                  key={n.key}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{n.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{n.hint}</div>
                  </div>
                  <Switch
                    checked={notifications[n.key] ?? false}
                    onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [n.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="appearance" className="mt-3">
          <Panel title="Appearance">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">Theme</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    The terminal is optimised for dark mode. Light mode is not yet available.
                  </div>
                </div>
                <Select defaultValue="dark" disabled>
                  <SelectTrigger className="h-9 w-32 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">Compact density</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Reduce padding across tables and panels.
                  </div>
                </div>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              </div>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={save}>
          <Save className="size-3.5" /> Save changes
        </Button>
      </div>
    </div>
  );
}
