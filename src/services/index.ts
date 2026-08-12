/**
 * Service abstraction layer.
 *
 * Every function here maps 1:1 to a future backend endpoint. Components must
 * never import mock data directly — they call these services (through
 * TanStack Query) so the mock implementations can be swapped for real HTTP
 * calls without touching the UI.
 *
 * Future backend contract:
 *   GET  /markets                        -> marketService.getMarkets
 *   GET  /markets/{symbol}               -> marketService.getMarket
 *   GET  /markets/{symbol}/candles       -> marketService.getCandles
 *   GET  /markets/{symbol}/analysis      -> marketService.getAnalysis
 *   GET  /markets/{symbol}/forecast      -> marketService.getForecast
 *   GET  /signals                        -> marketService.getSignals
 *   GET  /scanner                        -> marketService.getScanner
 *   GET  /macro                          -> marketService.getMacro
 *   GET  /news                           -> newsService.getNews
 *   GET  /economic-calendar              -> economicService.getCalendar
 *   GET  /strategies                     -> strategyService.getStrategies
 *   POST /backtests                      -> backtestService.run
 *   GET  /journal                        -> journalService.getEntries
 *   GET  /alerts, POST /alerts           -> alertService.*
 *   POST /ai/chat                        -> aiService.chat
 */
import { apiGet } from "@/lib/api-client";
import {
  ALERTS,
  ASSETS,
  CURRENCY_STRENGTH,
  JOURNAL,
  MODELS,
  NEWS,
  NOTIFICATIONS,
  STRATEGIES,
  WATCHLISTS,
  buildAnalysis,
  buildBacktest,
  buildQuote,
  symbolToSlug,
} from "@/lib/mock-data";
import type {
  Alert,
  Asset,
  BacktestResult,
  Candle,
  EconomicEvent,
  JournalEntry,
  MacroMetric,
  MarketAnalysis,
  MarketQuote,
  TechnicalAnalysis,
  Timeframe,
} from "@/lib/types";

/** Simulated network latency so loading states are real. */
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const DEMO_MODE = true;

export const marketService = {
  // The first live endpoint — every other function below still reads from
  // mock-data.ts until market data (Phase 4) and the signal engine (Phase 8)
  // exist on the backend.
  async getAssets(): Promise<Asset[]> {
    return apiGet<Asset[]>("/assets");
  },
  async getMarkets(): Promise<MarketQuote[]> {
    await delay(260);
    return ASSETS.map((a) => buildQuote(a.symbol));
  },
  async getMarket(symbol: string): Promise<MarketQuote> {
    await delay(180);
    return buildQuote(symbol);
  },
  async getCandles(symbol: string, tf: Timeframe): Promise<Candle[]> {
    return apiGet<Candle[]>(`/markets/${symbolToSlug(symbol)}/candles?timeframe=${tf}`);
  },
  async getTechnical(symbol: string, tf: Timeframe): Promise<TechnicalAnalysis> {
    return apiGet<TechnicalAnalysis>(`/markets/${symbolToSlug(symbol)}/technical?timeframe=${tf}`);
  },
  async getAnalysis(symbol: string): Promise<MarketAnalysis> {
    await delay(320);
    return buildAnalysis(symbol);
  },
  async getSignals() {
    await delay(280);
    return ASSETS.map((a) => buildAnalysis(a.symbol).signal).sort((x, y) => y.aiScore - x.aiScore);
  },
  async getScanner() {
    await delay(340);
    return ASSETS.map((a) => {
      const q = buildQuote(a.symbol);
      const s = buildAnalysis(a.symbol).signal;
      return { quote: q, signal: s };
    });
  },
  async getCurrencyStrength() {
    await delay(200);
    return CURRENCY_STRENGTH;
  },
  async getWatchlists() {
    await delay(140);
    return WATCHLISTS;
  },
};

export const economicService = {
  async getCalendar(): Promise<EconomicEvent[]> {
    return apiGet<EconomicEvent[]>("/economic-calendar");
  },
};

export const macroService = {
  async getMacro(): Promise<{ metrics: MacroMetric[]; macroScore: number }> {
    return apiGet<{ metrics: MacroMetric[]; macroScore: number }>("/macro");
  },
};

export const newsService = {
  async getNews() {
    await delay(300);
    return NEWS;
  },
};

export const strategyService = {
  async getStrategies() {
    await delay(240);
    return STRATEGIES;
  },
  async getModels() {
    await delay(260);
    return MODELS;
  },
};

export const backtestService = {
  async run(params: { seed?: number }): Promise<BacktestResult> {
    await delay(1400);
    return buildBacktest(params.seed ?? 7);
  },
};

export const journalService = {
  async getEntries(): Promise<JournalEntry[]> {
    await delay(240);
    return JOURNAL;
  },
  async analyse(): Promise<string[]> {
    await delay(1200);
    return [
      "You perform best when trading XAU/USD during the London/New York overlap: expectancy +0.68R versus +0.04R during the Asia session.",
      "Your average losing trade occurs when signal confidence is below 72. Raising your minimum AI score to 75 would have removed 4 of your last 6 losses.",
      "You tend to enter late on breakout setups — median entry is 0.4x ATR above the trigger level, which compresses realised risk/reward.",
      "Trades tagged 'A+ setup' returned +2.75R on average; trades without a tag averaged +0.12R. Setup labelling correlates strongly with outcome quality.",
    ];
  },
};

export const alertService = {
  async getAlerts(): Promise<Alert[]> {
    await delay(180);
    return ALERTS;
  },
};

export const notificationService = {
  async getNotifications() {
    await delay(160);
    return NOTIFICATIONS;
  },
};

/* ------------------------------------------------------------------ */
/* AI service — mock analyst responses grounded in the demo data.      */
/* ------------------------------------------------------------------ */

const AI_RESPONSES: { match: RegExp; answer: string }[] = [
  {
    match: /why.*(gold|xau).*(bullish|long|up)/i,
    answer:
      "Current evidence supports a bullish lean on XAU/USD, with a composite confluence score of **89/100**.\n\n**Structure** — 1D and 4H both print higher highs and higher lows; the most recent 4H break of structure was confirmed with follow-through rather than an immediate reclaim.\n\n**Macro** — US 10Y real yields are at a three-week low and DXY is down 0.24% on the session. Real yields carry the highest weight in the gold macro model (18%), so this configuration is the largest single contributor.\n\n**Flow and momentum** — Volume on the impulse leg is roughly 1.7x the 20-period average, session VWAP has been reclaimed and retested as support, and RSI sits at 62 with no bearish divergence on 1H or 4H.\n\n**What would weaken this view** — Price is approaching a resistance zone that coincides with equal highs, and CPI is released in 42 minutes. The model treats event risk as a reason to size conservatively rather than as a directional signal. Invalidation sits below the most recent higher low.",
  },
  {
    match: /invalidat/i,
    answer:
      "For the active XAU/USD long scenario, invalidation is defined structurally rather than by a fixed distance.\n\n1. A 4H close below the most recent higher low would negate the bullish continuation structure.\n2. Loss of session VWAP with expanding sell-side delta would remove the flow confirmation.\n3. A sharp reversal in real yields — for example a hot CPI print pushing the 10Y real yield back above 1.85% — would remove the dominant macro support.\n\nIf any two of these occur, the model would reclassify the regime and the scenario probabilities would be re-estimated. Note these are conditions for changing the view, not predictions.",
  },
  {
    match: /compare/i,
    answer:
      "**XAU/USD vs EUR/USD**\n\n| | XAU/USD | EUR/USD |\n|---|---|---|\n| Bias | Bullish | Bearish |\n| AI score | 89 | 84 |\n| Regime | Trending bull (91% confidence) | Reversal |\n| Strategy fit | Trend following | Reversal |\n| Estimated scenario probability | 76% | 73% |\n| Risk/reward | 1:3.2 | 1:2.7 |\n\nBoth express a similar underlying view — dollar softness — so taking both simultaneously would concentrate exposure to a single USD factor rather than diversify it. If only one is taken, XAU/USD currently scores higher on structure quality and risk/reward; EUR/USD carries lower event sensitivity.",
  },
  {
    match: /strongest|best setup|best opportunit/i,
    answer:
      "Ranked by composite score, the strongest current candidate is **XAU/USD LONG** at 89/100 (trend following, estimated scenario probability 76%, risk/reward 1:3.2).\n\nSecond is **EUR/USD SHORT** at 84/100, and third **GBP/USD LONG** at 79/100. Be aware that XAU/USD long and EUR/USD short both carry a short-dollar or dollar-sensitive exposure, so they should not be treated as independent positions.",
  },
  {
    match: /(shouldn'?t|should not|why not|no trade|wait)/i,
    answer:
      "There are three reasons the model would currently favour patience on lower-conviction instruments such as USD/CHF (score 67/100):\n\n1. **Event proximity** — a critical-impact CPI release is due shortly. Realised volatility around this release historically exceeds the structural stop distance on 15m setups.\n2. **Conflicting evidence** — technical structure and macro are supportive, but order flow is mixed and price sits close to resistance.\n3. **Insufficient reward** — the structural risk/reward is approximately 1.3, below a sensible threshold for the current volatility regime.\n\nA well-reasoned decision not to trade is a valid outcome. Re-evaluation is scheduled after the CPI release.",
  },
  {
    match: /risk/i,
    answer:
      "**Key risks today**\n\n- **US CPI (13:30, critical)** — affects XAU/USD, EUR/USD, GBP/USD and USD/JPY simultaneously. Expect a temporary widening of spreads.\n- **Correlated exposure** — EUR/USD and GBP/USD currently share a high USD factor loading; combined positions understate true portfolio risk.\n- **Volatility regime** — ATR is elevated versus its 20-period average, so fixed-distance stops will be hit more often than the backtest baseline assumes.\n- **Resistance proximity on gold** — the nearest liquidity cluster sits close to price, which compresses achievable reward on late entries.",
  },
  {
    match: /cpi|inflation/i,
    answer:
      "**CPI impact framework**\n\nConsensus is 3.1% y/y versus 3.2% previously. The model's conditional estimates:\n\n- **Below 3.0%** — real yields likely fall further; gold upside continuation probability rises to roughly 72%.\n- **In line (3.0–3.2%)** — the pre-event structure typically reasserts itself after an initial two-way move; base case probability dominates.\n- **Above 3.3%** — dollar strength and higher real yields would likely invalidate the current gold long scenario.\n\nThese are conditional scenario estimates from historical analogues, not forecasts of the release itself.",
  },
];

export const aiService = {
  async chat(message: string): Promise<string> {
    await delay(900);
    const hit = AI_RESPONSES.find((r) => r.match.test(message));
    if (hit) return hit.answer;
    return `I can reason over the platform's current market state for the eight tracked instruments.\n\nRight now the composite picture is: **XAU/USD bullish (89/100)**, **EUR/USD bearish (84/100)**, **GBP/USD bullish (79/100)**, with the broader environment classified as risk-on and a critical CPI release due within the hour.\n\nAsk me things like "why is gold bullish?", "what would invalidate the current setup?", "compare gold and EUR/USD", or "what are the major risks today?". All output is based on simulated demo data and reflects model estimates rather than certainty.`;
  },
};
