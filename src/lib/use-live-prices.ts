import { useEffect, useRef, useState } from "react";
import type { Candle } from "@/lib/types";

const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8000";
const RECONNECT_DELAY_MS = 3000;

export type LiveTick = {
  type: "tick";
  symbol: string;
  timestamp: number;
  bid: number;
  ask: number;
  mid: number;
  candles: Record<string, Candle>;
};

/** Subscribes to the backend price stream. Reconnects automatically if the
 *  socket drops — the backend restarts its OANDA connection periodically, so
 *  a dropped socket is routine rather than exceptional. */
export function useLivePrices(symbol?: string) {
  const [tick, setTick] = useState<LiveTick | null>(null);
  const [connected, setConnected] = useState(false);
  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let closedByCleanup = false;

    const connect = () => {
      socket = new WebSocket(`${API_URL.replace(/^http/, "ws")}/ws/prices`);

      socket.onopen = () => setConnected(true);
      socket.onclose = () => {
        setConnected(false);
        if (!closedByCleanup) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
      socket.onmessage = (event) => {
        const update = JSON.parse(event.data as string);
        if (update.type !== "tick") return;
        if (symbolRef.current && update.symbol !== symbolRef.current) return;
        setTick(update as LiveTick);
      };
    };

    connect();

    return () => {
      closedByCleanup = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  return { tick, connected };
}
