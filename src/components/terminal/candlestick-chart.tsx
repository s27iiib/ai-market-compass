import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Candle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fmtPrice } from "@/lib/format";

export interface ChartOverlays {
  ema: boolean;
  sma: boolean;
  vwap: boolean;
  bollinger: boolean;
  volume: boolean;
  structure: boolean;
  liquidity: boolean;
  supplyDemand: boolean;
  aiZone: boolean;
  targets: boolean;
  forecast: boolean;
}

export const DEFAULT_OVERLAYS: ChartOverlays = {
  ema: true,
  sma: false,
  vwap: true,
  bollinger: false,
  volume: true,
  structure: true,
  liquidity: true,
  supplyDemand: true,
  aiZone: true,
  targets: true,
  forecast: true,
};

export interface ChartLevels {
  entryLow: number;
  entryHigh: number;
  stop: number;
  tp1: number;
  tp2: number;
  forecastLow: number;
  forecastHigh: number;
}

function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => {
    out.push(i === 0 ? v : v * k + out[i - 1]! * (1 - k));
  });
  return out;
}

function sma(values: number[], period: number) {
  return values.map((_, i) => {
    if (i < period - 1) return NaN;
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += values[j]!;
    return s / period;
  });
}

function stddev(values: number[], period: number) {
  const m = sma(values, period);
  return values.map((_, i) => {
    if (i < period - 1) return NaN;
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += (values[j]! - m[i]!) ** 2;
    return Math.sqrt(s / period);
  });
}

const PAD = { top: 14, right: 68, bottom: 26, left: 8 };

export function CandlestickChart({
  candles,
  symbol,
  levels,
  overlays,
  height = 460,
  className,
}: {
  candles: Candle[];
  symbol: string;
  levels: ChartLevels;
  overlays: ChartOverlays;
  height?: number | undefined;
  className?: string | undefined;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [view, setView] = useState<{ start: number; count: number }>({
    start: Math.max(0, candles.length - 90),
    count: Math.min(90, candles.length),
  });
  const [hover, setHover] = useState<{ x: number; y: number; i: number } | null>(null);
  const dragRef = useRef<{ x: number; start: number } | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    setView({ start: Math.max(0, candles.length - 90), count: Math.min(90, candles.length) });
  }, [candles]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const volH = overlays.volume ? 62 : 0;
  const priceH = height - PAD.top - PAD.bottom - volH;
  const plotW = Math.max(120, width - PAD.left - PAD.right);

  const visible = useMemo(
    () => candles.slice(view.start, view.start + view.count),
    [candles, view],
  );

  const { min, max } = useMemo(() => {
    if (!visible.length) return { min: 0, max: 1 };
    let lo = Math.min(...visible.map((c) => c.l));
    let hi = Math.max(...visible.map((c) => c.h));
    const extra = [levels.stop, levels.tp1, levels.tp2, levels.entryLow, levels.entryHigh];
    if (overlays.targets) {
      lo = Math.min(lo, ...extra);
      hi = Math.max(hi, ...extra);
    }
    const pad = (hi - lo) * 0.08;
    return { min: lo - pad, max: hi + pad };
  }, [visible, levels, overlays.targets]);

  const y = useCallback(
    (price: number) => PAD.top + ((max - price) / (max - min || 1)) * priceH,
    [max, min, priceH],
  );
  const bw = plotW / Math.max(1, visible.length);
  const x = (i: number) => PAD.left + i * bw + bw / 2;

  const closes = visible.map((c) => c.c);
  const ema20 = useMemo(() => ema(closes, 20), [visible]);
  const ema50 = useMemo(() => ema(closes, 50), [visible]);
  const sma100 = useMemo(() => sma(closes, 50), [visible]);
  const bbMid = useMemo(() => sma(closes, 20), [visible]);
  const bbSd = useMemo(() => stddev(closes, 20), [visible]);
  const vwap = useMemo(() => {
    let pv = 0;
    let vv = 0;
    return visible.map((c) => {
      const tp = (c.h + c.l + c.c) / 3;
      pv += tp * c.v;
      vv += c.v;
      return pv / vv;
    });
  }, [visible]);

  const maxVol = Math.max(...visible.map((c) => c.v), 1);

  const line = (arr: number[]) =>
    arr
      .map((v, i) => (Number.isNaN(v) ? null : `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`))
      .filter(Boolean)
      .join(" ");

  /* ---- wheel zoom (non-passive, delta-scaled, anchored) ---- */
  const handleWheel = useRef((e: WheelEvent) => {});
  handleWheel.current = (e: WheelEvent) => {
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
    const v = viewRef.current;
    const rect = wrapRef.current?.getBoundingClientRect();
    const px = rect ? e.clientX - rect.left - PAD.left : plotW / 2;
    const anchorRatio = Math.min(1, Math.max(0, px / plotW));
    const next = Math.round(
      Math.min(candles.length, Math.max(25, v.count * Math.exp(dy * 0.0018))),
    );
    const anchorIndex = v.start + anchorRatio * v.count;
    const start = Math.round(
      Math.min(candles.length - next, Math.max(0, anchorIndex - anchorRatio * next)),
    );
    setView({ start, count: next });
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleWheel.current(e);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, start: view.start };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.min(visible.length - 1, Math.max(0, Math.floor((px - PAD.left) / bw)));
    setHover({ x: px, y: e.clientY - rect.top, i });
    if (dragRef.current) {
      const shift = Math.round((dragRef.current.x - e.clientX) / bw);
      const start = Math.min(
        candles.length - view.count,
        Math.max(0, dragRef.current.start + shift),
      );
      if (start !== view.start) setView((v) => ({ ...v, start }));
    }
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const hoverCandle = hover ? visible[hover.i] : undefined;
  const lastCandle = visible[visible.length - 1];
  const structureLabels = useMemo(() => {
    const out: { i: number; label: string; up: boolean }[] = [];
    for (let i = 3; i < visible.length - 3; i += 1) {
      const c = visible[i]!;
      const isHigh = visible.slice(i - 3, i + 4).every((k) => k.h <= c.h);
      const isLow = visible.slice(i - 3, i + 4).every((k) => k.l >= c.l);
      if (isHigh) out.push({ i, label: "HH", up: true });
      else if (isLow) out.push({ i, label: "HL", up: false });
    }
    const trimmed = out.filter((_, idx) => idx % 2 === 0).slice(-6);
    if (trimmed.length) trimmed[trimmed.length - 1]!.label = "BOS";
    return trimmed;
  }, [visible]);

  return (
    <div ref={wrapRef} className={cn("relative w-full touch-none select-none", className)}>
      <svg
        width={width}
        height={height}
        className="block cursor-crosshair"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          setHover(null);
          dragRef.current = null;
        }}
      >
        {/* grid */}
        {Array.from({ length: 6 }).map((_, i) => {
          const yy = PAD.top + (priceH / 5) * i;
          const price = max - ((max - min) / 5) * i;
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={PAD.left + plotW}
                y1={yy}
                y2={yy}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PAD.left + plotW + 6}
                y={yy + 3.5}
                className="fill-muted-foreground font-mono text-[10px]"
              >
                {fmtPrice(price, symbol)}
              </text>
            </g>
          );
        })}

        {/* supply / demand zones */}
        {overlays.supplyDemand && (
          <>
            <rect
              x={PAD.left}
              width={plotW}
              y={y(max - (max - min) * 0.12)}
              height={Math.max(4, y(max - (max - min) * 0.2) - y(max - (max - min) * 0.12))}
              className="fill-bear/8"
            />
            <rect
              x={PAD.left}
              width={plotW}
              y={y(min + (max - min) * 0.24)}
              height={Math.max(4, y(min + (max - min) * 0.16) - y(min + (max - min) * 0.24))}
              className="fill-bull/8"
            />
          </>
        )}

        {/* AI forecast range */}
        {overlays.forecast && (
          <g>
            <rect
              x={PAD.left + plotW * 0.82}
              width={plotW * 0.18}
              y={y(levels.forecastHigh)}
              height={Math.max(3, y(levels.forecastLow) - y(levels.forecastHigh))}
              className="fill-ai/10 stroke-ai/40"
              strokeDasharray="3 3"
            />
            <text
              x={PAD.left + plotW * 0.83}
              y={y(levels.forecastHigh) - 5}
              className="fill-ai text-[9px] tracking-widest"
            >
              AI RANGE
            </text>
          </g>
        )}

        {/* AI entry zone */}
        {overlays.aiZone && (
          <rect
            x={PAD.left}
            width={plotW}
            y={y(levels.entryHigh)}
            height={Math.max(3, y(levels.entryLow) - y(levels.entryHigh))}
            className="fill-ai/14 stroke-ai/35"
          />
        )}

        {/* liquidity levels */}
        {overlays.liquidity &&
          [levels.forecastHigh, levels.forecastLow].map((p, i) => (
            <line
              key={i}
              x1={PAD.left}
              x2={PAD.left + plotW}
              y1={y(p)}
              y2={y(p)}
              className="stroke-warn/35"
              strokeDasharray="2 6"
            />
          ))}

        {/* targets */}
        {overlays.targets && (
          <>
            {[
              { p: levels.stop, cls: "stroke-bear", label: "SL" },
              { p: levels.tp1, cls: "stroke-bull", label: "TP1" },
              { p: levels.tp2, cls: "stroke-bull", label: "TP2" },
            ].map((l) => (
              <g key={l.label}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + plotW}
                  y1={y(l.p)}
                  y2={y(l.p)}
                  className={l.cls}
                  strokeWidth={1}
                  strokeDasharray="6 4"
                />
                <text
                  x={PAD.left + 4}
                  y={y(l.p) - 4}
                  className={cn(
                    "text-[9px] tracking-wider",
                    l.label === "SL" ? "fill-bear" : "fill-bull",
                  )}
                >
                  {l.label} {fmtPrice(l.p, symbol)}
                </text>
              </g>
            ))}
          </>
        )}

        {/* bollinger */}
        {overlays.bollinger && (
          <>
            <path
              d={line(bbMid.map((m, i) => m + 2 * bbSd[i]!))}
              className="stroke-muted-foreground/50"
              fill="none"
              strokeWidth={1}
            />
            <path
              d={line(bbMid.map((m, i) => m - 2 * bbSd[i]!))}
              className="stroke-muted-foreground/50"
              fill="none"
              strokeWidth={1}
            />
          </>
        )}

        {/* candles */}
        {visible.map((c, i) => {
          const up = c.c >= c.o;
          const bodyTop = y(Math.max(c.o, c.c));
          const bodyH = Math.max(1, y(Math.min(c.o, c.c)) - bodyTop);
          return (
            <g key={c.t} className={up ? "fill-bull stroke-bull" : "fill-bear stroke-bear"}>
              <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} strokeWidth={1} />
              <rect
                x={x(i) - Math.max(1, bw * 0.32)}
                width={Math.max(1.5, bw * 0.64)}
                y={bodyTop}
                height={bodyH}
              />
            </g>
          );
        })}

        {/* moving averages */}
        {overlays.ema && (
          <>
            <path d={line(ema20)} className="stroke-ai" fill="none" strokeWidth={1.4} />
            <path d={line(ema50)} className="stroke-warn/80" fill="none" strokeWidth={1.2} />
          </>
        )}
        {overlays.sma && (
          <path d={line(sma100)} className="stroke-foreground/60" fill="none" strokeWidth={1.2} />
        )}
        {overlays.vwap && (
          <path
            d={line(vwap)}
            className="stroke-foreground/70"
            fill="none"
            strokeWidth={1.2}
            strokeDasharray="5 3"
          />
        )}

        {/* structure labels */}
        {overlays.structure &&
          structureLabels.map((s) => (
            <text
              key={s.i}
              x={x(s.i)}
              y={s.up ? y(visible[s.i]!.h) - 6 : y(visible[s.i]!.l) + 12}
              textAnchor="middle"
              className={cn(
                "text-[9px] font-semibold",
                s.label === "BOS" ? "fill-ai" : "fill-muted-foreground",
              )}
            >
              {s.label}
            </text>
          ))}

        {/* volume */}
        {overlays.volume &&
          visible.map((c, i) => {
            const h = (c.v / maxVol) * (volH - 10);
            return (
              <rect
                key={c.t}
                x={x(i) - Math.max(1, bw * 0.32)}
                width={Math.max(1.5, bw * 0.64)}
                y={height - PAD.bottom - h}
                height={h}
                className={c.c >= c.o ? "fill-bull/35" : "fill-bear/35"}
              />
            );
          })}

        {/* last price */}
        {lastCandle && (
          <g>
            <line
              x1={PAD.left}
              x2={PAD.left + plotW}
              y1={y(lastCandle.c)}
              y2={y(lastCandle.c)}
              className="stroke-foreground/40"
              strokeDasharray="2 3"
            />
            <rect
              x={PAD.left + plotW + 2}
              y={y(lastCandle.c) - 8}
              width={62}
              height={16}
              rx={3}
              className="fill-foreground"
            />
            <text
              x={PAD.left + plotW + 6}
              y={y(lastCandle.c) + 3.5}
              className="fill-background font-mono text-[10px] font-semibold"
            >
              {fmtPrice(lastCandle.c, symbol)}
            </text>
          </g>
        )}

        {/* time axis */}
        {visible.map((c, i) =>
          i % Math.max(1, Math.floor(visible.length / 8)) === 0 ? (
            <text
              key={c.t}
              x={x(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground font-mono text-[9px]"
            >
              {new Date(c.t).toUTCString().slice(5, 16)}
            </text>
          ) : null,
        )}

        {/* crosshair */}
        {hover && hoverCandle && (
          <g className="pointer-events-none">
            <line
              x1={x(hover.i)}
              x2={x(hover.i)}
              y1={PAD.top}
              y2={height - PAD.bottom}
              className="stroke-foreground/30"
              strokeDasharray="3 3"
            />
            <line
              x1={PAD.left}
              x2={PAD.left + plotW}
              y1={hover.y}
              y2={hover.y}
              className="stroke-foreground/30"
              strokeDasharray="3 3"
            />
          </g>
        )}
      </svg>

      {hover && hoverCandle && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border-strong bg-popover/95 px-2.5 py-2 text-[0.6875rem] shadow-lg backdrop-blur"
          style={{ left: Math.min(hover.x + 12, width - 170), top: 10 }}
        >
          <div className="num grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
            <span className="text-muted-foreground">O</span>
            <span>{fmtPrice(hoverCandle.o, symbol)}</span>
            <span className="text-muted-foreground">H</span>
            <span>{fmtPrice(hoverCandle.h, symbol)}</span>
            <span className="text-muted-foreground">L</span>
            <span>{fmtPrice(hoverCandle.l, symbol)}</span>
            <span className="text-muted-foreground">C</span>
            <span className={hoverCandle.c >= hoverCandle.o ? "text-bull" : "text-bear"}>
              {fmtPrice(hoverCandle.c, symbol)}
            </span>
            <span className="text-muted-foreground">Vol</span>
            <span>{hoverCandle.v.toLocaleString()}</span>
          </div>
          <div className="mt-1 border-t border-border pt-1 text-muted-foreground">
            {new Date(hoverCandle.t).toUTCString().slice(5, 22)} UTC
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute right-20 bottom-1 text-[0.625rem] text-muted-foreground">
        scroll to zoom · drag to pan
      </div>
    </div>
  );
}
