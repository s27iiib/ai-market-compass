import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bell,
  BookOpen,
  BrainCircuit,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  LineChart,
  Radar,
  Settings,
  ShieldAlert,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { JOURNAL, NEWS, STRATEGIES, symbolToSlug } from "@/lib/mock-data";
import { marketService } from "@/services";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: marketService.getAssets,
  });
  const go = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search markets, signals, strategies, journal, news…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Markets">
          {assets.map((a) => (
            <CommandItem
              key={a.symbol}
              value={`${a.symbol} ${a.name}`}
              onSelect={() =>
                go(() =>
                  navigate({ to: "/markets/$symbol", params: { symbol: symbolToSlug(a.symbol) } }),
                )
              }
            >
              <LineChart className="size-3.5 text-ai" />
              <span className="num">{a.symbol}</span>
              <span className="text-muted-foreground">{a.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go(() => navigate({ to: "/" }))}>
            <LayoutDashboard className="size-3.5" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/scanner" }))}>
            <Radar className="size-3.5" /> Open scanner
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/ai-analyst" }))}>
            <BrainCircuit className="size-3.5" /> Ask AI analyst
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/alerts" }))}>
            <Bell className="size-3.5" /> Create alert
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/backtesting" }))}>
            <Activity className="size-3.5" /> Open backtest
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/journal" }))}>
            <BookOpen className="size-3.5" /> Open journal
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/strategies" }))}>
            <FlaskConical className="size-3.5" /> Strategy lab
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/model-lab" }))}>
            <Gauge className="size-3.5" /> AI model lab
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/risk" }))}>
            <ShieldAlert className="size-3.5" /> Risk center
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/settings" }))}>
            <Settings className="size-3.5" /> Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Strategies">
          {STRATEGIES.map((s) => (
            <CommandItem
              key={s.id}
              value={`strategy ${s.name}`}
              onSelect={() => go(() => navigate({ to: "/strategies" }))}
            >
              <FlaskConical className="size-3.5 text-muted-foreground" /> {s.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Journal">
          {JOURNAL.slice(0, 4).map((j) => (
            <CommandItem
              key={j.id}
              value={`journal ${j.symbol} ${j.strategy}`}
              onSelect={() => go(() => navigate({ to: "/journal" }))}
            >
              <BookOpen className="size-3.5 text-muted-foreground" />
              <span className="num">{j.symbol}</span>
              <span className="text-muted-foreground">
                {j.date} · {j.r > 0 ? "+" : ""}
                {j.r}R
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="News">
          {NEWS.slice(0, 3).map((n) => (
            <CommandItem
              key={n.id}
              value={`news ${n.headline}`}
              onSelect={() => go(() => navigate({ to: "/" }))}
            >
              <span className="truncate">{n.headline}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
