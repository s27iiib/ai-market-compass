import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  BookOpen,
  BrainCircuit,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  FlaskConical,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  Radar,
  Search,
  Settings,
  ShieldAlert,
  Command as CommandIcon,
  Menu,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Chip, DemoTag } from "@/components/terminal/primitives";
import { NotificationBell } from "@/components/terminal/notification-center";
import { CommandPalette } from "@/components/terminal/command-palette";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/markets", label: "Markets", icon: LineChart },
  { to: "/scanner", label: "Scanner", icon: Radar },
  { to: "/ai-analyst", label: "AI Analyst", icon: BrainCircuit },
  { to: "/strategies", label: "Strategies", icon: FlaskConical },
  { to: "/backtesting", label: "Backtesting", icon: Activity },
  { to: "/model-lab", label: "AI Model Lab", icon: Gauge },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/risk", label: "Risk Center", icon: ShieldAlert },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const MOBILE_NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/markets", label: "Markets", icon: LineChart },
  { to: "/scanner", label: "Scanner", icon: Radar },
  { to: "/ai-analyst", label: "AI", icon: BrainCircuit },
  { to: "/alerts", label: "Alerts", icon: Bell },
] as const;

const TITLES: Record<string, string> = {
  "/": "Market Overview",
  "/markets": "Markets",
  "/scanner": "Market Scanner",
  "/ai-analyst": "AI Market Analyst",
  "/strategies": "Strategy Lab",
  "/strategies/builder": "Strategy Builder",
  "/backtesting": "Backtesting",
  "/model-lab": "AI Model Lab",
  "/journal": "Trading Journal",
  "/alerts": "Alerts",
  "/risk": "Risk Center",
  "/settings": "Settings",
};

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-4">
      <div className="grid size-8 shrink-0 place-items-center rounded-md border border-ai/40 bg-ai/12">
        <span className="num text-sm font-bold text-ai">Au</span>
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight">AURUM</div>
          <div className="truncate text-[0.625rem] tracking-widest text-ai uppercase">AI Trading Intelligence</div>
        </div>
      )}
    </div>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: (() => void) | undefined }) {
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
      {NAV.slice(0, 10).map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          activeOptions={{ exact: item.to === "/" }}
          className={cn(
            "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.8125rem] text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-0",
          )}
          activeProps={{
            className:
              "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-[inset_2px_0_0_0_var(--color-ai)]",
          }}
        >
          <item.icon className="size-4 shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title =
    TITLES[pathname] ??
    (pathname.startsWith("/markets/") ? `${pathname.split("/").pop()?.replace("-", "/").toUpperCase()} Workspace` : "Terminal");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-[4.25rem]" : "w-[15rem]",
        )}
      >
        <Logo collapsed={collapsed} />
        <NavList collapsed={collapsed} />
        <div className="space-y-0.5 border-t border-sidebar-border px-2 py-2">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.8125rem] text-sidebar-foreground/80 hover:bg-sidebar-accent",
              collapsed && "justify-center px-0",
            )}
          >
            <Settings className="size-4 shrink-0" />
            {!collapsed && "Settings"}
          </Link>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.8125rem] text-sidebar-foreground/80 hover:bg-sidebar-accent",
              collapsed && "justify-center px-0",
            )}
          >
            <HelpCircle className="size-4 shrink-0" />
            {!collapsed && "Help"}
          </button>
          <div
            className={cn(
              "mt-1 flex items-center gap-2.5 rounded-md border border-sidebar-border px-2 py-2",
              collapsed && "justify-center border-0 px-0",
            )}
          >
            <div className="grid size-7 shrink-0 place-items-center rounded-full bg-ai/15 text-[0.6875rem] font-semibold text-ai">
              MK
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">M. Kessler</div>
                <div className="truncate text-[0.625rem] text-muted-foreground">Pro · Demo account</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-md py-1.5 text-[0.6875rem] text-muted-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[16rem] bg-sidebar p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <Logo collapsed={false} />
                  <NavList collapsed={false} />
                </SheetContent>
              </Sheet>
              <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">{title}</h1>
              <DemoTag className="hidden sm:inline-block" />
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <div className="hidden items-center gap-3 rounded-md border border-border bg-card px-2.5 py-1.5 xl:flex">
                <span className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
                  <span className="live-dot" /> Markets Open
                </span>
                <span className="h-3 w-px bg-border" />
                <span className="text-[0.6875rem] text-muted-foreground">London Session</span>
                <span className="h-3 w-px bg-border" />
                <span className="text-[0.6875rem] text-ai">AI Engine Online</span>
              </div>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border-strong md:flex"
              >
                <Search className="size-3.5" />
                <span>Search markets, signals, journal…</span>
                <kbd className="num ml-2 rounded border border-border bg-muted px-1 py-0.5 text-[0.625rem]">⌘K</kbd>
              </button>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setPaletteOpen(true)}>
                <Search className="size-4" />
              </Button>
              <NotificationBell />
              <div className="grid size-8 place-items-center rounded-full border border-border bg-ai/12 text-[0.6875rem] font-semibold text-ai">
                MK
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        {MOBILE_NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="flex flex-col items-center gap-1 py-2.5 text-[0.625rem] text-muted-foreground"
            activeProps={{ className: "text-ai" }}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  actions?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="label-xs">{eyebrow}</div>}
        <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function HelpHint({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
      <CircleHelp className="size-3" /> {children}
    </span>
  );
}

export { CommandIcon, Chip };
