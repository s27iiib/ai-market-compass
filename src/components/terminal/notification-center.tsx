import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BrainCircuit,
  CalendarClock,
  CircleAlert,
  Gauge,
  ShieldAlert,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { notificationService } from "@/services";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NotificationItem } from "@/lib/types";
import { LoadingPanel } from "@/components/terminal/primitives";

const ICONS: Record<NotificationItem["kind"], typeof Bell> = {
  signal: TrendingUp,
  invalidated: XCircle,
  macro: CalendarClock,
  price: CircleAlert,
  strategy: BrainCircuit,
  model: Gauge,
  risk: ShieldAlert,
};

const TONE: Record<NotificationItem["kind"], string> = {
  signal: "text-bull",
  invalidated: "text-bear",
  macro: "text-warn",
  price: "text-ai",
  strategy: "text-ai",
  model: "text-muted-foreground",
  risk: "text-bear",
};

export function NotificationBell() {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationService.getNotifications,
  });
  const unread = data?.filter((n) => n.unread).length ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="num absolute top-1 right-1 grid size-3.5 place-items-center rounded-full bg-ai text-[0.5625rem] font-bold text-ai-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-xs font-semibold tracking-wide">Notifications</span>
          <span className="label-xs">{unread} unread</span>
        </div>
        <ScrollArea className="max-h-[22rem]">
          <div className="divide-y divide-border">
            {isLoading && <LoadingPanel rows={3} className="p-3" />}
            {data?.map((n) => {
              const Icon = ICONS[n.kind];
              return (
                <div key={n.id} className="flex gap-2.5 px-3 py-2.5 hover:bg-accent/40">
                  <Icon className={`mt-0.5 size-3.5 shrink-0 ${TONE[n.kind]}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-medium">{n.title}</p>
                      {n.unread && <span className="size-1.5 shrink-0 rounded-full bg-ai" />}
                    </div>
                    <p className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground">
                      {n.detail}
                    </p>
                    <p className="mt-1 text-[0.625rem] text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
