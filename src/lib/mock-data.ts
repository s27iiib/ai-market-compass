import type {
  Alert,
  Asset,
  BacktestResult,
  Candle,
  CurrencyStrength,
  EconomicEvent,
  JournalEntry,
  MarketAnalysis,
  MarketQuote,
  ModelMetrics,
  NewsArticle,
  NotificationItem,
  Regime,
  Strategy,
  Timeframe,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random generator so SSR and client agree.      */
/* ------------------------------------------------------------------ */
export function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export const ASSETS: Asset[] = [
  { symbol: "XAU/USD", name: "Gold / US Dollar", kind: "metal", pipDecimals: 2 },
  { symbol: "EUR/USD", name: "Euro / US Dollar", kind: "forex", pipDecimals: 5 },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", kind: "forex", pipDecimals: 5 },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", kind: "forex", pipDecimals: 3 },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", kind: "forex", pipDecimals: 5 },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", kind: "forex", pipDecimals: 5 },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", kind: "forex", pipDecimals: 5 },
  { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", kind: "forex", pipDecimals: 5 },
];

export function assetBySymbol(symbol: string) {
  return ASSETS.find((a) => a.symbol.toLowerCase() === symbol.toLowerCase());
}

export function symbolToSlug(symbol: string) {
  return symbol.replace("/", "-").toLowerCase();
}
export function slugToSymbol(slug: string) {
  const s = slug.replace("-", "/").toUpperCase();
  return assetBySymbol(s)?.symbol ?? s;
}

const BASE_PRICE: Record<string, number> = {
  "XAU/USD": 3418.62,
  "EUR/USD": 1.0874,
  "GBP/USD": 1.2731,
  "USD/JPY": 151.428,
  "USD/CHF": 0.8942,
  "AUD/USD": 0.6621,
  "USD/CAD": 1.3584,
  "NZD/USD": 0.6013,
};

const VOL: Record<string, number> = {
  "XAU/USD": 0.0042,
  "EUR/USD": 0.0016,
  "GBP/USD": 0.0018,
  "USD/JPY": 0.0019,
  "USD/CHF": 0.0015,
  "AUD/USD": 0.0021,
  "USD/CAD": 0.0016,
  "NZD/USD": 0.0022,
};

const TF_MINUTES: Record<Timeframe, number> = {
  "1m": 1,
  "5m": 5,
  "15m": 15,
  "30m": 30,
  "1H": 60,
  "4H": 240,
  "1D": 1440,
  "1W": 10080,
};

/** Deterministic candle history for a symbol/timeframe. */
export function generateCandles(symbol: string, tf: Timeframe, count = 160): Candle[] {
  const rnd = seeded(hash(symbol + tf) % 100000);
  const base = BASE_PRICE[symbol] ?? 100;
  const vol = (VOL[symbol] ?? 0.002) * Math.sqrt(TF_MINUTES[tf] / 60);
  const step = TF_MINUTES[tf] * 60_000;
  const end = Date.UTC(2026, 7, 9, 15, 0, 0);
  const drift = symbol === "XAU/USD" ? 0.00035 : (hash(symbol) % 7) / 30000 - 0.0001;

  let price = base * (1 - drift * count * 0.9);
  const out: Candle[] = [];
  for (let i = 0; i < count; i++) {
    const shock = (rnd() - 0.5) * 2 * vol;
    const wave = Math.sin(i / 11) * vol * 0.6 + Math.sin(i / 3.7) * vol * 0.25;
    const o = price;
    const c = o * (1 + shock + wave + drift);
    const hi = Math.max(o, c) * (1 + rnd() * vol * 0.6);
    const lo = Math.min(o, c) * (1 - rnd() * vol * 0.6);
    out.push({
      t: end - (count - 1 - i) * step,
      o,
      h: hi,
      l: lo,
      c,
      v: Math.round(600 + rnd() * 1400 + Math.abs(shock) * 40000),
    });
    price = c;
  }
  const last = out[out.length - 1]!;
  const adj = base / last.c;
  return out.map((k) => ({ ...k, o: k.o * adj, h: k.h * adj, l: k.l * adj, c: k.c * adj }));
}

const QUOTE_META: Record<
  string,
  { score: number; bias: MarketQuote["bias"]; regime: Regime; setup: MarketQuote["setup"] }
> = {
  "XAU/USD": { score: 89, bias: "BULLISH", regime: "TRENDING BULL", setup: "LONG" },
  "EUR/USD": { score: 84, bias: "BEARISH", regime: "REVERSAL", setup: "SHORT" },
  "GBP/USD": { score: 79, bias: "BULLISH", regime: "BREAKOUT", setup: "LONG" },
  "USD/JPY": { score: 71, bias: "BULLISH", regime: "TRENDING BULL", setup: null },
  "USD/CHF": { score: 67, bias: "NEUTRAL", regime: "RANGE", setup: "WAIT" },
  "AUD/USD": { score: 62, bias: "BEARISH", regime: "TRENDING BEAR", setup: null },
  "USD/CAD": { score: 58, bias: "NEUTRAL", regime: "LOW VOLATILITY", setup: null },
  "NZD/USD": { score: 74, bias: "BEARISH", regime: "TRENDING BEAR", setup: "SHORT" },
};

export function buildQuote(symbol: string): MarketQuote {
  const candles = generateCandles(symbol, "1H", 60);
  const last = candles[candles.length - 1]!;
  const first = candles[candles.length - 24] ?? candles[0]!;
  const meta = QUOTE_META[symbol] ?? {
    score: 60,
    bias: "NEUTRAL" as const,
    regime: "RANGE" as Regime,
    setup: null,
  };
  const asset = assetBySymbol(symbol)!;
  const spread = asset.kind === "metal" ? 0.28 : 0.00012 * (symbol === "USD/JPY" ? 800 : 1);
  const changeAbs = last.c - first.c;
  return {
    symbol,
    price: last.c,
    changeAbs,
    changePct: (changeAbs / first.c) * 100,
    bid: last.c - spread / 2,
    ask: last.c + spread / 2,
    spread,
    dayHigh: Math.max(...candles.slice(-24).map((c) => c.h)),
    dayLow: Math.min(...candles.slice(-24).map((c) => c.l)),
    bias: meta.bias,
    aiScore: meta.score,
    regime: meta.regime,
    setup: meta.setup,
    sparkline: candles.slice(-40).map((c) => c.c),
  };
}

export const CURRENCY_STRENGTH: CurrencyStrength[] = [
  { code: "USD", score: 89 },
  { code: "GBP", score: 72 },
  { code: "EUR", score: 63 },
  { code: "JPY", score: 51 },
  { code: "CHF", score: 48 },
  { code: "AUD", score: 41 },
  { code: "CAD", score: 38 },
  { code: "NZD", score: 31 },
];

export const ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: "e1",
    time: "13:30",
    minutesAway: 42,
    country: "USA",
    event: "CPI y/y",
    importance: "CRITICAL",
    previous: "3.2%",
    forecast: "3.1%",
    actual: null,
    affected: ["XAU/USD", "EUR/USD", "GBP/USD", "USD/JPY"],
  },
  {
    id: "e2",
    time: "14:15",
    minutesAway: 87,
    country: "USA",
    event: "Core CPI m/m",
    importance: "HIGH",
    previous: "0.3%",
    forecast: "0.2%",
    actual: null,
    affected: ["XAU/USD", "USD/CHF"],
  },
  {
    id: "e3",
    time: "15:00",
    minutesAway: 132,
    country: "UK",
    event: "BoE Gov Speech",
    importance: "MEDIUM",
    previous: "—",
    forecast: "—",
    actual: null,
    affected: ["GBP/USD"],
  },
  {
    id: "e4",
    time: "09:00",
    minutesAway: -125,
    country: "EU",
    event: "Industrial Production",
    importance: "LOW",
    previous: "-0.4%",
    forecast: "0.1%",
    actual: "0.3%",
    affected: ["EUR/USD"],
  },
  {
    id: "e5",
    time: "01:30",
    minutesAway: -580,
    country: "AUS",
    event: "Employment Change",
    importance: "MEDIUM",
    previous: "22.1K",
    forecast: "18.0K",
    actual: "11.4K",
    affected: ["AUD/USD", "NZD/USD"],
  },
];

export const NEWS: NewsArticle[] = [
  {
    id: "n1",
    headline: "Fed signals higher-for-longer rate environment",
    source: "Global Macro Wire",
    timestamp: "24m ago",
    sentiment: "Bearish Gold",
    impact: "HIGH",
    affected: ["XAU/USD", "EUR/USD", "GBP/USD"],
    body: "Committee commentary leaned hawkish, with several members flagging persistent services inflation. Rate-path pricing shifted modestly, lifting front-end yields. Model treats this as a near-term headwind for non-yielding assets, though real yields remain the dominant gold driver.",
  },
  {
    id: "n2",
    headline: "US 10Y real yields slip to three-week low",
    source: "Rates Desk",
    timestamp: "1h ago",
    sentiment: "Bullish Gold",
    impact: "HIGH",
    affected: ["XAU/USD"],
    body: "Real yields declined as breakevens firmed into the CPI print. Historically this configuration has been supportive for gold, with the caveat that event risk can dominate over intraday horizons.",
  },
  {
    id: "n3",
    headline: "Dollar index drifts lower ahead of inflation data",
    source: "FX Monitor",
    timestamp: "2h ago",
    sentiment: "Bearish USD",
    impact: "MEDIUM",
    affected: ["EUR/USD", "GBP/USD", "XAU/USD"],
    body: "DXY eased 0.24% with positioning data suggesting light pre-event de-risking rather than a structural change in dollar demand.",
  },
  {
    id: "n4",
    headline: "Central bank gold purchases continue at elevated pace",
    source: "Commodity Insight",
    timestamp: "4h ago",
    sentiment: "Bullish Gold",
    impact: "MEDIUM",
    affected: ["XAU/USD"],
    body: "Official-sector demand remains a structural bid. This is a slow-moving factor and is weighted accordingly in the macro model rather than treated as an intraday catalyst.",
  },
  {
    id: "n5",
    headline: "Eurozone growth revisions land marginally below consensus",
    source: "EU Macro Brief",
    timestamp: "6h ago",
    sentiment: "Bearish EUR",
    impact: "LOW",
    affected: ["EUR/USD"],
    body: "Modest downward revisions keep the relative-growth differential tilted toward the US, consistent with the model's bearish EUR/USD lean.",
  },
];

const REASONING_LIB = [
  {
    label: "Higher timeframe bullish structure",
    weight: 15,
    detail:
      "1D and 4H both print higher highs and higher lows; last 4H break of structure confirmed at 3,392.40 with follow-through.",
    ok: true,
  },
  {
    label: "Liquidity sweep detected",
    weight: 10,
    detail:
      "Equal lows at 3,381.10 were swept before the impulse, consistent with stop-run then reversal behaviour.",
    ok: true,
  },
  {
    label: "VWAP reclaimed",
    weight: 10,
    detail:
      "Session VWAP reclaimed and retested as support; price has held above for 6 consecutive candles.",
    ok: true,
  },
  {
    label: "Volume expansion",
    weight: 10,
    detail:
      "Volume on the impulse leg is 1.7x the 20-period average, indicating participation rather than drift.",
    ok: true,
  },
  {
    label: "DXY weakness",
    weight: 10,
    detail: "Dollar index down 0.24% on the session with broad-based softness across majors.",
    ok: true,
  },
  {
    label: "US yields declining",
    weight: 10,
    detail: "US 10Y real yields at a three-week low, historically supportive for gold.",
    ok: true,
  },
  {
    label: "Momentum positive",
    weight: 10,
    detail: "RSI 62 with rising MACD histogram; no bearish divergence detected on 1H or 4H.",
    ok: true,
  },
  {
    label: "Market regime alignment",
    weight: 15,
    detail: "Regime model classifies the environment as TRENDING BULL with 91% confidence.",
    ok: true,
  },
  {
    label: "Risk/reward acceptable",
    weight: 10,
    detail: "Structural stop placement yields 1:3.2 to the second target.",
    ok: true,
  },
];

function scenarioSet(bull: number, base: number, bear: number, up: string, down: string) {
  return [
    {
      scenario: "BULLISH" as const,
      probability: bull,
      condition: "Continuation above resistance with sustained volume",
      target: up,
    },
    {
      scenario: "BASE" as const,
      probability: base,
      condition: "Range between support and resistance into the event",
      target: "Rotation",
    },
    {
      scenario: "BEARISH" as const,
      probability: bear,
      condition: "Break below demand and loss of VWAP",
      target: down,
    },
  ];
}

export function buildAnalysis(symbol: string): MarketAnalysis {
  const q = buildQuote(symbol);
  const rnd = seeded(hash(symbol) % 99991);
  const p = q.price;
  const isGold = symbol === "XAU/USD";
  const unit = p * 0.004;
  const bullish = q.bias === "BULLISH";
  const noTrade = q.setup === "WAIT" || q.setup === null;

  const entry = p - unit * 0.25;
  const stop = bullish ? p - unit * 1.4 : p + unit * 1.4;
  const tp1 = bullish ? p + unit * 1.8 : p - unit * 1.8;
  const tp2 = bullish ? p + unit * 3.6 : p - unit * 3.6;

  const reasoning = REASONING_LIB.map((r, i) => ({
    ...r,
    ok: noTrade ? i < 3 : true,
  }));

  const scenarios = bullish
    ? scenarioSet(64, 23, 13, fmt(p + unit * 3.2), fmt(p - unit * 2.1))
    : scenarioSet(18, 24, 58, fmt(p + unit * 1.8), fmt(p - unit * 3.0));

  return {
    symbol,
    bias: q.bias,
    aiScore: noTrade ? 67 : q.aiScore,
    regime: q.regime,
    regimeConfidence: 91 - Math.round(rnd() * 18),
    bestStrategy: bullish ? "Trend Following" : "Reversal",
    regimeExpectancy: bullish ? "+0.42R" : "+0.31R",
    summary: isGold
      ? "Gold remains structurally bullish on the 4H timeframe. The dollar has weakened while US real yields have declined, and technical momentum remains positive. Price is, however, approaching a significant resistance zone and CPI is due shortly, which raises short-term event risk. Current evidence supports continuation scenarios, with invalidation below the most recent higher low."
      : `${symbol} is currently classified as ${q.regime.toLowerCase()} with a ${q.bias.toLowerCase()} directional lean. Model estimates are moderate rather than high conviction; positioning and event risk should be weighted before acting.`,
    technical: {
      trend: q.bias,
      rsi: bullish ? 62 : 41,
      adx: 28,
      atr: Number((unit * 0.9).toFixed(isGold ? 2 : 5)),
      vwap: bullish ? "ABOVE" : "BELOW",
      momentum: bullish ? "POSITIVE" : "NEGATIVE",
      volatility: "ELEVATED",
      volume: "EXPANDING",
      ema20: p * 0.998,
      ema50: p * 0.9945,
      ema200: p * 0.986,
      bbWidth: 2.4,
      macd: bullish ? 1.42 : -0.86,
    },
    structure: [
      {
        timeframe: "4H",
        items: [
          { label: "HH", ok: true },
          { label: "HL", ok: true },
          { label: "BOS", ok: true },
        ],
        note: "Impulsive continuation",
      },
      {
        timeframe: "1H",
        items: [
          { label: "HH", ok: true },
          { label: "HL", ok: true },
          { label: "BOS", ok: true },
        ],
        note: "Trend intact",
      },
      {
        timeframe: "15m",
        items: [
          { label: "LH", ok: true },
          { label: "LL", ok: true },
          { label: "CHOCH", ok: false },
        ],
        note: "Retracement",
      },
    ],
    structureState: bullish ? "BULLISH CONTINUATION" : "BEARISH CONTINUATION",
    liquidity: [
      { label: "Previous day high", price: p + unit * 2.4, kind: "high", strength: 82 },
      { label: "Equal highs", price: p + unit * 1.5, kind: "equal-high", strength: 68 },
      { label: "Liquidity pool", price: p + unit * 0.7, kind: "pool", strength: 44 },
      { label: "Swept lows", price: p - unit * 0.9, kind: "swept", strength: 71 },
      { label: "Equal lows", price: p - unit * 1.9, kind: "equal-low", strength: 63 },
      { label: "Previous day low", price: p - unit * 2.8, kind: "low", strength: 77 },
    ],
    liquidityNote:
      "Price is currently positioned between two significant liquidity pools. Model estimates a higher likelihood of the upside pool being tested first, but this is a distribution of outcomes, not a forecast of a specific path.",
    multiTimeframe: [
      { timeframe: "1D", bias: "BULLISH", score: 86 },
      { timeframe: "4H", bias: "BULLISH", score: 89 },
      { timeframe: "1H", bias: "BULLISH", score: 87 },
      { timeframe: "15m", bias: "NEUTRAL", score: 61 },
      { timeframe: "5m", bias: "BEARISH", score: 42 },
    ],
    mtfNote:
      "The lower timeframe bearish movement appears to be a short-term retracement within a bullish higher-timeframe structure. Alignment deteriorates below 15m, which argues for patience on entry timing rather than a change in directional bias.",
    macro: [
      { name: "DXY", value: "103.42", changePct: -0.24, goldImpact: "BULLISH", weight: 20 },
      { name: "US 2Y", value: "4.38%", changePct: -0.9, goldImpact: "BULLISH", weight: 12 },
      { name: "US 10Y", value: "4.11%", changePct: -1.2, goldImpact: "BULLISH", weight: 15 },
      { name: "Real Yields", value: "1.72%", changePct: -2.1, goldImpact: "BULLISH", weight: 18 },
      {
        name: "Fed Expectations",
        value: "2 cuts 2026",
        changePct: 0.4,
        goldImpact: "NEUTRAL",
        weight: 10,
      },
      { name: "Inflation", value: "3.2% y/y", changePct: -0.1, goldImpact: "NEUTRAL", weight: 10 },
      {
        name: "Risk Sentiment",
        value: "Risk-On",
        changePct: 0.8,
        goldImpact: "BEARISH",
        weight: 8,
      },
      {
        name: "Geopolitical Risk",
        value: "Elevated",
        changePct: 1.6,
        goldImpact: "BULLISH",
        weight: 7,
      },
    ],
    macroScore: 81,
    orderFlow: {
      buyVolume: 58,
      sellVolume: 42,
      delta: 16,
      cvd: Array.from({ length: 24 }, (_, i) => ({
        t: `${String(i).padStart(2, "0")}:00`,
        v: Math.round(Math.sin(i / 4) * 40 + i * 3 + rnd() * 20),
      })),
      imbalance: 1.38,
      note: "Cumulative delta is trending higher with buy-side absorption at the retest. Order flow supports the directional bias but is not by itself sufficient evidence for entry.",
    },
    sentiment: [
      { label: "Gold sentiment", value: 72, note: "Retail positioning moderately long" },
      { label: "USD sentiment", value: 44, note: "Softening into CPI" },
      { label: "Risk appetite", value: 61, note: "Equities firm, credit stable" },
      { label: "News sentiment", value: 58, note: "Mixed, skewed constructive" },
      { label: "Social sentiment", value: 67, note: "Elevated attention on gold" },
    ],
    signal: {
      id: `sig-${symbolToSlug(symbol)}`,
      symbol,
      direction: noTrade ? "WAIT" : bullish ? "LONG" : "SHORT",
      aiScore: noTrade ? 67 : q.aiScore,
      strategy: bullish ? "Trend Following" : "Reversal",
      probability: noTrade ? 54 : bullish ? 76 : 73,
      regime: q.regime,
      risk: noTrade ? "HIGH" : "MEDIUM",
      session: "London",
      metrics: noTrade
        ? null
        : {
            entry,
            stop,
            tp1,
            tp2,
            rr: 3.2,
            atrRisk: "1.4x ATR",
            eventRisk: "HIGH",
            correlationRisk: "MEDIUM",
            volatility: "MEDIUM",
          },
      reasoning,
      risks: noTrade
        ? [
            "CPI in 12 minutes",
            "Resistance nearby",
            "Order flow conflicting",
            "Risk/reward only 1.3",
          ]
        : [
            "CPI in 42 minutes",
            "Resistance nearby",
            "Volatility elevated",
            "Order flow mixed on 5m",
          ],
      scenarios,
      timeline: [
        { time: "14:21", text: "Bullish structure detected" },
        { time: "14:24", text: "Liquidity sweep confirmed" },
        { time: "14:27", text: "DXY weakness detected", kind: "event" },
        { time: "14:30", text: "US yields declining", kind: "event" },
        { time: "14:34", text: "AI score → 71", kind: "score" },
        { time: "14:38", text: "Volume confirmation" },
        { time: "14:41", text: "AI score → 84", kind: "score" },
        { time: "14:42", text: `${bullish ? "LONG" : "SHORT"} signal issued`, kind: "signal" },
        { time: "14:55", text: "+0.8R unrealised", kind: "result" },
      ],
      recommendation: noTrade ? "WAIT" : bullish ? "LONG" : "SHORT",
      reevaluation: "After CPI release",
    },
    forecast: {
      horizon: "Next 4 hours",
      scenarios,
      expectedRange: [p - unit * 1.6, p + unit * 2.2],
      keyUpside: p + unit * 2.4,
      keyDownside: p - unit * 1.9,
      invalidation: bullish ? p - unit * 1.4 : p + unit * 1.4,
    },
  };
}

function fmt(n: number) {
  return n >= 100 ? n.toFixed(2) : n.toFixed(4);
}

export const STRATEGIES: Strategy[] = [
  {
    id: "s1",
    name: "Gold Trend AI",
    status: "ACTIVE",
    winRate: 58.4,
    profitFactor: 1.94,
    sharpe: 1.62,
    maxDrawdown: 11.2,
    trades: 412,
    updated: "2h ago",
    assets: ["XAU/USD"],
    description:
      "Higher-timeframe trend continuation with macro confirmation and liquidity-sweep entries.",
  },
  {
    id: "s2",
    name: "London Breakout",
    status: "ACTIVE",
    winRate: 47.1,
    profitFactor: 1.61,
    sharpe: 1.18,
    maxDrawdown: 14.8,
    trades: 688,
    updated: "1d ago",
    assets: ["GBP/USD", "EUR/USD"],
    description: "Asia-range breakout at the London open filtered by volatility regime.",
  },
  {
    id: "s3",
    name: "NY Reversal",
    status: "PAUSED",
    winRate: 52.6,
    profitFactor: 1.43,
    sharpe: 0.94,
    maxDrawdown: 17.5,
    trades: 301,
    updated: "3d ago",
    assets: ["EUR/USD", "USD/JPY"],
    description: "Mean-reversion against exhausted New York session extensions.",
  },
  {
    id: "s4",
    name: "Liquidity Sweep",
    status: "ACTIVE",
    winRate: 61.2,
    profitFactor: 2.11,
    sharpe: 1.77,
    maxDrawdown: 9.4,
    trades: 254,
    updated: "5h ago",
    assets: ["XAU/USD", "GBP/USD"],
    description: "Stop-run detection at equal highs/lows with structure confirmation.",
  },
  {
    id: "s5",
    name: "Macro Momentum",
    status: "DRAFT",
    winRate: 44.8,
    profitFactor: 1.22,
    sharpe: 0.71,
    maxDrawdown: 21.3,
    trades: 96,
    updated: "1w ago",
    assets: ["XAU/USD"],
    description: "Real-yield and DXY factor momentum applied to gold swing horizons.",
  },
];

export function buildBacktest(seed = 7): BacktestResult {
  const rnd = seeded(seed * 9973);
  let equity = 100000;
  let peak = equity;
  const curve = [] as BacktestResult["equity"];
  for (let i = 0; i < 240; i++) {
    const r = (rnd() - 0.44) * 0.012;
    equity *= 1 + r;
    peak = Math.max(peak, equity);
    curve.push({
      i,
      equity: Math.round(equity),
      drawdown: Number((((equity - peak) / peak) * 100).toFixed(2)),
    });
  }
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return {
    netReturn: Number((((equity - 100000) / 100000) * 100).toFixed(1)),
    winRate: 57.3,
    profitFactor: 1.88,
    sharpe: 1.54,
    sortino: 2.11,
    maxDrawdown: Math.min(...curve.map((c) => c.drawdown)),
    avgR: 0.38,
    trades: 412,
    expectancy: 0.38,
    equity: curve,
    monthly: (() => {
      // A single sequential draw per month — reseeding per-iteration with a
      // small integer collapses to near-identical values, since this LCG's
      // first draw for small seeds is always close to zero.
      const monthlyRnd = seeded(seed * 7919 + 101);
      return months.map((m) => ({
        month: m,
        ret: Number(((monthlyRnd() - 0.38) * 9).toFixed(2)),
      }));
    })(),
    distribution: [
      { bucket: "-3R", count: 8 },
      { bucket: "-2R", count: 21 },
      { bucket: "-1R", count: 147 },
      { bucket: "0R", count: 32 },
      { bucket: "+1R", count: 88 },
      { bucket: "+2R", count: 62 },
      { bucket: "+3R", count: 39 },
      { bucket: "+4R", count: 15 },
    ],
    byRegime: [
      { regime: "Trending Bull", expectancy: 0.62 },
      { regime: "Trending Bear", expectancy: 0.28 },
      { regime: "Range", expectancy: -0.11 },
      { regime: "Breakout", expectancy: 0.41 },
      { regime: "High Vol", expectancy: 0.09 },
    ],
    bySession: [
      { session: "Asia", expectancy: 0.04 },
      { session: "London", expectancy: 0.51 },
      { session: "New York", expectancy: 0.33 },
      { session: "LDN/NY Overlap", expectancy: 0.68 },
    ],
    byDay: [
      { day: "Mon", expectancy: 0.12 },
      { day: "Tue", expectancy: 0.44 },
      { day: "Wed", expectancy: 0.57 },
      { day: "Thu", expectancy: 0.21 },
      { day: "Fri", expectancy: -0.08 },
    ],
  };
}

export const JOURNAL: JournalEntry[] = [
  {
    id: "j1",
    date: "2026-08-07",
    symbol: "XAU/USD",
    direction: "LONG",
    entry: 3382.4,
    exit: 3411.8,
    result: "WIN",
    r: 2.4,
    aiScore: 88,
    strategy: "Gold Trend AI",
    regime: "TRENDING BULL",
    session: "London/NY Overlap",
    reason: "4H BOS with liquidity sweep and DXY weakness.",
    outcome: "Target 2 reached, partial at TP1.",
    tags: ["A+ setup", "trend"],
  },
  {
    id: "j2",
    date: "2026-08-06",
    symbol: "EUR/USD",
    direction: "SHORT",
    entry: 1.0921,
    exit: 1.0938,
    result: "LOSS",
    r: -1,
    aiScore: 71,
    strategy: "NY Reversal",
    regime: "RANGE",
    session: "New York",
    reason: "Reversal at range high.",
    outcome: "Stopped on news spike.",
    tags: ["range", "news"],
  },
  {
    id: "j3",
    date: "2026-08-05",
    symbol: "GBP/USD",
    direction: "LONG",
    entry: 1.2688,
    exit: 1.2731,
    result: "WIN",
    r: 1.8,
    aiScore: 82,
    strategy: "London Breakout",
    regime: "BREAKOUT",
    session: "London",
    reason: "Asia range breakout with volume expansion.",
    outcome: "Trailed to close.",
    tags: ["breakout"],
  },
  {
    id: "j4",
    date: "2026-08-04",
    symbol: "XAU/USD",
    direction: "LONG",
    entry: 3355.1,
    exit: 3352.0,
    result: "LOSS",
    r: -0.6,
    aiScore: 69,
    strategy: "Liquidity Sweep",
    regime: "HIGH VOLATILITY",
    session: "Asia",
    reason: "Sweep entry taken below threshold score.",
    outcome: "Cut early, structure failed.",
    tags: ["low score", "impatient"],
  },
  {
    id: "j5",
    date: "2026-08-03",
    symbol: "USD/JPY",
    direction: "SHORT",
    entry: 152.11,
    exit: 151.42,
    result: "WIN",
    r: 1.4,
    aiScore: 78,
    strategy: "Macro Momentum",
    regime: "REVERSAL",
    session: "New York",
    reason: "Yield differential compression.",
    outcome: "Closed at TP1.",
    tags: ["macro"],
  },
  {
    id: "j6",
    date: "2026-08-02",
    symbol: "XAU/USD",
    direction: "LONG",
    entry: 3320.5,
    exit: 3348.9,
    result: "WIN",
    r: 3.1,
    aiScore: 91,
    strategy: "Gold Trend AI",
    regime: "TRENDING BULL",
    session: "London/NY Overlap",
    reason: "Highest conviction signal of the week.",
    outcome: "Full target.",
    tags: ["A+ setup"],
  },
];

export const ALERTS: Alert[] = [
  {
    id: "a1",
    type: "PRICE",
    symbol: "XAU/USD",
    condition: "Price > 3,450.00",
    active: true,
    created: "2h ago",
  },
  {
    id: "a2",
    type: "AI SCORE",
    symbol: "XAU/USD",
    condition: "AI Score > 85",
    active: true,
    created: "1d ago",
  },
  {
    id: "a3",
    type: "SIGNAL",
    symbol: "EUR/USD",
    condition: "New SHORT setup issued",
    active: true,
    created: "3d ago",
  },
  {
    id: "a4",
    type: "STRUCTURE",
    symbol: "GBP/USD",
    condition: "Bullish BOS detected on 1H",
    active: false,
    created: "5d ago",
  },
  {
    id: "a5",
    type: "MACRO",
    symbol: "XAU/USD",
    condition: "High-impact CPI released",
    active: true,
    created: "1w ago",
  },
];

export const MODELS: ModelMetrics[] = [
  {
    name: "Market Regime Model",
    version: "v3.2.1",
    accuracy: 0.83,
    precision: 0.81,
    recall: 0.79,
    auc: 0.89,
    calibration: 0.94,
    oos: 0.78,
    lastTrained: "2026-08-04",
    status: "HEALTHY",
    drift: "NONE",
  },
  {
    name: "Direction Model",
    version: "v5.0.4",
    accuracy: 0.64,
    precision: 0.66,
    recall: 0.61,
    auc: 0.71,
    calibration: 0.88,
    oos: 0.6,
    lastTrained: "2026-08-06",
    status: "MONITORING",
    drift: "LOW",
  },
  {
    name: "Volatility Model",
    version: "v2.7.0",
    accuracy: 0.77,
    precision: 0.75,
    recall: 0.74,
    auc: 0.84,
    calibration: 0.91,
    oos: 0.73,
    lastTrained: "2026-07-29",
    status: "HEALTHY",
    drift: "NONE",
  },
  {
    name: "Trade Probability Model",
    version: "v4.1.2",
    accuracy: 0.69,
    precision: 0.72,
    recall: 0.63,
    auc: 0.76,
    calibration: 0.86,
    oos: 0.65,
    lastTrained: "2026-08-07",
    status: "MONITORING",
    drift: "MODERATE",
  },
  {
    name: "Signal Fusion Model",
    version: "v1.9.8",
    accuracy: 0.71,
    precision: 0.74,
    recall: 0.68,
    auc: 0.8,
    calibration: 0.9,
    oos: 0.69,
    lastTrained: "2026-08-08",
    status: "RETRAINING",
    drift: "LOW",
  },
];

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "nt1",
    kind: "signal",
    title: "New XAU/USD LONG setup",
    detail: "AI score 89 · Trend Following · 1:3.2",
    time: "6m ago",
    unread: true,
  },
  {
    id: "nt2",
    kind: "macro",
    title: "US CPI in 42 minutes",
    detail: "Critical impact · affects 4 tracked assets",
    time: "12m ago",
    unread: true,
  },
  {
    id: "nt3",
    kind: "risk",
    title: "Correlated USD exposure detected",
    detail: "EUR/USD and GBP/USD share a high USD factor loading",
    time: "38m ago",
    unread: true,
  },
  {
    id: "nt4",
    kind: "invalidated",
    title: "AUD/USD setup invalidated",
    detail: "Structure failed below the last higher low",
    time: "1h ago",
    unread: false,
  },
  {
    id: "nt5",
    kind: "model",
    title: "Signal Fusion Model retraining",
    detail: "v1.9.8 → v2.0.0 scheduled",
    time: "3h ago",
    unread: false,
  },
];

export const WATCHLISTS = [
  { id: "w1", name: "My Gold Watchlist", symbols: ["XAU/USD", "XAG/USD", "DXY", "US10Y"] },
  { id: "w2", name: "Forex Watchlist", symbols: ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF"] },
];
