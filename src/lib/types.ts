// Domain models for the AI Gold & Forex Trading Intelligence Platform.
// These mirror the future backend contract (see src/services/*).

export type Direction = "LONG" | "SHORT" | "WAIT";
export type Bias = "BULLISH" | "BEARISH" | "NEUTRAL";
export type Regime =
  | "TRENDING BULL"
  | "TRENDING BEAR"
  | "RANGE"
  | "BREAKOUT"
  | "REVERSAL"
  | "HIGH VOLATILITY"
  | "LOW VOLATILITY";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D" | "1W";
export type Session = "Asia" | "London" | "New York" | "London/NY Overlap" | "Closed";
export type Importance = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Asset {
  symbol: string;
  name: string;
  kind: "metal" | "forex";
  pipDecimals: number;
}

export interface MarketQuote {
  symbol: string;
  price: number;
  changePct: number;
  changeAbs: number;
  bid: number;
  ask: number;
  spread: number;
  dayHigh: number;
  dayLow: number;
  bias: Bias;
  aiScore: number;
  regime: Regime;
  setup: Direction | null;
  sparkline: number[];
}

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface TechnicalMetrics {
  trend: Bias;
  rsi: number;
  adx: number;
  atr: number;
  vwap: "ABOVE" | "BELOW";
  momentum: "POSITIVE" | "NEGATIVE" | "FLAT";
  volatility: "ELEVATED" | "NORMAL" | "COMPRESSED";
  volume: "EXPANDING" | "AVERAGE" | "CONTRACTING";
  ema20: number;
  ema50: number;
  ema200: number;
  bbWidth: number;
  macd: number;
}

export interface StructureEvent {
  timeframe: Timeframe;
  items: { label: string; ok: boolean }[];
  note: string;
}

export interface LiquidityZone {
  label: string;
  price: number;
  kind: "high" | "low" | "equal-high" | "equal-low" | "pool" | "swept";
  strength: number;
}

export interface MacroMetric {
  name: string;
  value: string;
  changePct: number;
  goldImpact: "BULLISH" | "BEARISH" | "NEUTRAL";
  weight: number;
}

export interface EconomicEvent {
  id: string;
  time: string;
  minutesAway: number;
  country: string;
  event: string;
  importance: Importance;
  previous: string;
  forecast: string;
  actual: string | null;
  affected: string[];
}

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  timestamp: string;
  sentiment: string;
  impact: Importance;
  affected: string[];
  body: string;
}

export interface AIProbability {
  scenario: "BULLISH" | "BASE" | "BEARISH";
  probability: number;
  condition: string;
  target: string;
}

export interface AIFactor {
  label: string;
  weight: number;
  detail: string;
  ok: boolean;
}

export interface RiskMetrics {
  entry: number;
  stop: number;
  tp1: number;
  tp2: number;
  rr: number;
  atrRisk: string;
  eventRisk: RiskLevel;
  correlationRisk: RiskLevel;
  volatility: RiskLevel;
}

export interface AISignal {
  id: string;
  symbol: string;
  direction: Direction;
  aiScore: number;
  strategy: string;
  probability: number;
  regime: Regime;
  risk: RiskLevel;
  session: Session;
  metrics: RiskMetrics | null;
  reasoning: AIFactor[];
  risks: string[];
  scenarios: AIProbability[];
  timeline: { time: string; text: string; kind?: "score" | "signal" | "event" | "result" }[];
  recommendation: string;
  reevaluation: string;
}

export interface MarketAnalysis {
  symbol: string;
  bias: Bias;
  aiScore: number;
  regime: Regime;
  regimeConfidence: number;
  bestStrategy: string;
  regimeExpectancy: string;
  summary: string;
  technical: TechnicalMetrics;
  structure: StructureEvent[];
  structureState: string;
  liquidity: LiquidityZone[];
  liquidityNote: string;
  multiTimeframe: { timeframe: Timeframe; bias: Bias; score: number }[];
  mtfNote: string;
  macro: MacroMetric[];
  macroScore: number;
  orderFlow: {
    buyVolume: number;
    sellVolume: number;
    delta: number;
    cvd: { t: string; v: number }[];
    imbalance: number;
    note: string;
  };
  sentiment: { label: string; value: number; note: string }[];
  signal: AISignal;
  forecast: {
    horizon: string;
    scenarios: AIProbability[];
    expectedRange: [number, number];
    keyUpside: number;
    keyDownside: number;
    invalidation: number;
  };
}

export interface CurrencyStrength {
  code: string;
  score: number;
}

export interface Strategy {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DRAFT";
  winRate: number;
  profitFactor: number;
  sharpe: number;
  maxDrawdown: number;
  trades: number;
  updated: string;
  assets: string[];
  description: string;
}

export interface BacktestResult {
  netReturn: number;
  winRate: number;
  profitFactor: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  avgR: number;
  trades: number;
  expectancy: number;
  equity: { i: number; equity: number; drawdown: number }[];
  monthly: { month: string; ret: number }[];
  distribution: { bucket: string; count: number }[];
  byRegime: { regime: string; expectancy: number }[];
  bySession: { session: string; expectancy: number }[];
  byDay: { day: string; expectancy: number }[];
}

export interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entry: number;
  exit: number;
  result: "WIN" | "LOSS" | "BREAKEVEN";
  r: number;
  aiScore: number;
  strategy: string;
  regime: Regime;
  session: Session;
  reason: string;
  outcome: string;
  tags: string[];
}

export interface Alert {
  id: string;
  type: "PRICE" | "AI SCORE" | "SIGNAL" | "STRUCTURE" | "MACRO" | "RISK";
  symbol: string;
  condition: string;
  active: boolean;
  created: string;
}

export interface ModelMetrics {
  name: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  auc: number;
  calibration: number;
  oos: number;
  lastTrained: string;
  status: "HEALTHY" | "MONITORING" | "RETRAINING";
  drift: "NONE" | "LOW" | "MODERATE";
}

export interface NotificationItem {
  id: string;
  kind: "signal" | "invalidated" | "macro" | "price" | "strategy" | "model" | "risk";
  title: string;
  detail: string;
  time: string;
  unread: boolean;
}
