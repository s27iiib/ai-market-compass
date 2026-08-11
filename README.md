# AI Market Compass

Absolutely. Below is a master prompt designed to be pasted directly into Lovable.dev. It focuses on building the entire working frontend/UI, with realistic mock/live-ready data structures, interactions, navigation, charts, panels, responsive behaviour, and the AI trading experience we designed.

MASTER BUILD PROMPT — AI GOLD & FOREX TRADING INTELLIGENCE PLATFORM

ROLE

You are a senior product designer, UX architect, frontend engineer, and fintech dashboard specialist.

Build a premium, production-quality AI-powered Gold & Forex Trading Intelligence Platform.

This is NOT a generic admin dashboard and NOT a simple TradingView clone.

The product should feel like a combination of:

Professional institutional trading terminal

Modern quantitative research platform

AI market intelligence system

Advanced charting platform

Trading journal

Strategy/backtesting laboratory

AI trading copilot

The first supported flagship instrument is XAU/USD (Gold).

The platform must also support:

EUR/USD

GBP/USD

USD/JPY

USD/CHF

AUD/USD

USD/CAD

NZD/USD

The architecture and UI must be designed so additional assets can easily be added later.

1. CORE PRODUCT PHILOSOPHY

The UI must communicate this concept:

"The chart shows what is happening.
The AI explains why it is happening.
The intelligence engine estimates what could happen next.
The risk engine tells the trader whether the opportunity is worth taking."

Do NOT make the product look like a collection of random indicators.

The interface should prioritize:

Market understanding

Opportunity discovery

AI reasoning

Probability

Risk

Decision support

Explainability

The platform must prominently support three possible conclusions:

LONG

SHORT

WAIT / NO TRADE

The platform should NOT visually encourage constant trading.

A high-quality "NO TRADE" decision should be treated as a valuable outcome.

2. VISUAL DESIGN DIRECTION

Create a premium dark trading terminal.

Overall style

Dark charcoal/near-black background

High contrast but not harsh

Minimal visual clutter

Thin borders

Subtle glass/panel effects where appropriate

Rounded corners, but not excessive

Professional typography

Dense information architecture without feeling crowded

Sophisticated financial/institutional aesthetic

Colour system

Use:

Neutral dark charcoal/black as the base

White/light grey for primary information

Muted grey for secondary information

Green for bullish/positive states

Red for bearish/negative states

Amber for warnings

Mint/turquoise as the AI identity colour

The mint/turquoise accent represents the AI intelligence layer.

Do NOT overuse gradients.

Do NOT make the application look like a gaming interface.

Do NOT use excessive neon.

Do NOT use giant decorative illustrations.

The product must feel like professional financial software.

3. APPLICATION SHELL

Create a persistent application shell consisting of:

Left sidebar

Navigation:

Dashboard

Markets

Scanner

AI Analyst

Strategies

Backtesting

Journal

Alerts

Risk Center

Settings

The sidebar should support:

Expanded mode

Collapsed icon-only mode

At the top:

Platform logo

Product name

"AI Trading Intelligence"

At the bottom:

Settings

Help

User profile

4. TOP BAR

Create a persistent top navigation/header.

Include:

Left

Current page title.

Centre/right

Market status

Market session

Search

Notifications

AI status

User profile

Example:

"Markets Open"

"London Session"

"AI Engine Online"

Use a small live-status indicator.

Include a global search field allowing the user to search:

XAU/USD

EUR/USD

GBP/USD

Strategies

Signals

Journal entries

5. DASHBOARD

The Dashboard is the main home page.

Its purpose is to answer:

"What is happening in the market right now?"

Create the following sections.

5.1 Greeting / Market State

Display:

"Market Overview"

Current session.

Example:

London Session

Then show:

Overall Market Regime

Possible states:

Risk-On

Risk-Off

Neutral

High Volatility

Low Volatility

Example:

RISK-ON

Use a clear status indicator.

6. MARKET OVERVIEW CARDS

Create cards for:

XAU/USD

EUR/USD

GBP/USD

USD/JPY

USD/CHF

AUD/USD

USD/CAD

NZD/USD

Each card must display:

Current price

Percentage change

Direction

AI Confluence Score

Market regime

Mini sparkline

Current setup if available

Example:

XAU/USD

$3,4XX.XX

+0.82%

AI Score

89/100

BULLISH

LONG SETUP

Clicking a card opens the corresponding Market Workspace.

7. AI CONFLUENCE SCORE

Create a reusable AI Confluence Score component.

Score:

0–100

Interpretation:

90–100 = Exceptional

80–89 = Strong

70–79 = Good

60–69 = Weak

Below 60 = Avoid

The UI must make it clear this is a synthetic platform score, not a guaranteed probability of profit.

Show the score using a professional circular or horizontal visualization.

Example:

89 / 100

STRONG SETUP

8. BEST OPPORTUNITIES

Create a section called:

Best Opportunities

Display ranked opportunities.

Columns:

Asset

Direction

AI Score

Strategy

Probability

R

Market Regime

Risk

Action

Example:

XAU/USD | LONG | 89 | Trend Following | 76% | 1:3.2 | Bull | Medium

EUR/USD | SHORT | 84 | Reversal | 73% | 1:2.7 | Bear | Low

GBP/USD | LONG | 79 | Breakout | 69% | 1:2.4 | Bull | Medium

Clicking a row opens that market's workspace.

9. CURRENCY STRENGTH MAP

Create a professional Currency Strength section.

Show:

USD
89/100

GBP
72/100

EUR
63/100

JPY
51/100

CHF
48/100

AUD
41/100

CAD
38/100

NZD
31/100

Use horizontal strength bars.

Then show:

Strongest

USD

Weakest

NZD

Potential Relative-Strength Opportunities

USD/NZD

USD/AUD

etc.

10. ECONOMIC CALENDAR

Create an economic calendar widget.

Display:

Time

Country

Event

Importance

Previous

Forecast

Actual

Affected assets

Importance:

Low

Medium

High

Critical

Example:

13:30

USA

CPI

HIGH IMPACT

Affected:

XAU/USD

EUR/USD

GBP/USD

USD/JPY

The platform should visually warn users when a major event is approaching.

Example:

"US CPI in 42 minutes"

11. MARKET NEWS

Create a market news panel.

Each article displays:

Headline

Source

Timestamp

Sentiment

Impact

Affected assets

Example:

FED SIGNALS HIGHER-FOR-LONGER RATE ENVIRONMENT

Sentiment:

Bearish Gold

Impact:

High

Affected:

XAU/USD

EUR/USD

GBP/USD

Clicking an article opens a detailed news analysis modal.

12. AI MARKET SUMMARY

Create a prominent AI-generated summary card.

Example:

AI Market Summary

"Gold remains structurally bullish on the 4H timeframe. The USD has weakened while US yields have declined. Technical momentum remains positive, but price is approaching a significant resistance zone. CPI is due shortly, increasing short-term event risk."

Below:

AI Confidence

84/100

Buttons:

"Ask AI"

"View Full Analysis"

13. MARKET WORKSPACE

This is the most important screen in the application.

When the user clicks XAU/USD, open a dedicated Market Workspace.

Structure:

Top:
Asset information

Middle:
Large chart

Right:
AI Intelligence Panel

Bottom:
Analysis tabs

14. MARKET HEADER

Display:

XAU/USD

Gold / US Dollar

Current price

Daily change

Bid

Ask

Spread

Market session

AI Bias

AI Score

Example:

XAU/USD

3,4XX.XX

+0.82%

BULLISH

87/100

15. TIMEFRAME SELECTOR

Include:

1m
5m
15m
30m
1H
4H
1D
1W

The selected timeframe must update the chart and analysis UI.

16. PROFESSIONAL CHART

Create a large interactive candlestick chart.

Use a charting library appropriate for financial data.

The chart must support:

Candlesticks

Zoom

Pan

Crosshair

Tooltip

Timeframe switching

Volume

Grid

Price axis

Time axis

Overlay options:

EMA

SMA

VWAP

Bollinger Bands

RSI

MACD

ATR

Support

Resistance

Supply zones

Demand zones

Liquidity zones

Market structure

AI entry zone

Stop loss

Take profit

AI predicted range

Create a chart toolbar for toggling overlays.

17. AI CHART OVERLAYS

The chart must visually display AI intelligence.

Show:

AI Entry Zone

A subtle highlighted zone.

Stop Loss

Red horizontal line.

Take Profit

Green horizontal lines.

Liquidity

Horizontal liquidity zones.

Supply/Demand

Subtle shaded regions.

Market Structure

Labels:

HH

HL

LH

LL

BOS

CHOCH

AI Predicted Range

Display a probabilistic future range rather than pretending to know an exact future price.

Example:

NEXT 4 HOURS

Bullish:
64%

Neutral:
23%

Bearish:
13%

18. RIGHT-SIDE AI INTELLIGENCE PANEL

This is a defining feature.

Title:

AI Market Intelligence

Show:

Market Bias

BULLISH

AI Confluence

87/100

Directional Scenarios

UP
78%

RANGE
16%

DOWN
6%

Use clear probability visualizations.

19. AI REASONING

Display:

Why?

Checklist:

✓ Higher timeframe bullish structure

✓ Liquidity sweep detected

✓ VWAP reclaimed

✓ Volume expansion

✓ DXY weakness

✓ US yields declining

✓ Momentum positive

Each item should be clickable to reveal more detail.

20. AI RISKS

Display:

Risks

Examples:

⚠ CPI in 42 minutes

⚠ Resistance nearby

⚠ Volatility elevated

⚠ Order flow conflicting

The AI panel must make risk visually prominent.

21. AI TRADE SIGNAL CARD

When the conditions meet the platform's threshold, show:

LONG SETUP

XAU/USD

AI Score

89/100

Entry:

XXXX–XXXX

Stop Loss:

XXXX

Take Profit 1:

XXXX

Take Profit 2:

XXXX

Risk/Reward:

1:3.2

Estimated Scenario Probability:

76%

Buttons:

"Analyse Trade"

"Set Alert"

"Add to Watchlist"

Do NOT create an actual broker order button in the first UI version.

This platform is initially an analysis/decision-support system.

22. NO TRADE STATE

This is extremely important.

If conditions are conflicting, display:

NO TRADE

AI Score:

67/100

Then explain:

✓ Technical structure bullish

✓ Macro supportive

✗ CPI in 12 minutes

✗ Resistance nearby

✗ Order flow conflicting

✗ Risk/reward only 1.3

Recommendation:

WAIT

Next Re-evaluation:

After CPI release

The NO TRADE state should look polished and valuable, not like an error.

23. MULTI-TIMEFRAME ANALYSIS

Create a dedicated section.

Display:

1D — BULLISH — 86

4H — BULLISH — 89

1H — BULLISH — 87

15M — NEUTRAL — 61

5M — BEARISH — 42

Below:

AI Interpretation

"The lower timeframe bearish movement appears to be a short-term retracement within a bullish higher-timeframe structure."

24. MARKET STRUCTURE PANEL

Show:

4H

HH ✓

HL ✓

BOS ✓

1H

HH ✓

HL ✓

BOS ✓

15M

LH ✓

LL ✓

Retracement

Then:

Market Structure State:

BULLISH CONTINUATION

25. LIQUIDITY MAP

Create a visual liquidity map.

Show:

Previous highs

Previous lows

Equal highs

Equal lows

Liquidity pools

Sweeps

Current price

AI commentary:

"Price is currently positioned between two significant liquidity pools."

26. BOTTOM ANALYSIS TABS

Under the chart, create tabs:

Overview

Technical

Market Structure

Macro

Order Flow

Sentiment

News

AI Forecast

Risk

Each tab must display relevant information.

27. TECHNICAL TAB

Show:

Trend

Momentum

Volatility

Volume

Indicators

Use clean metric cards.

Example:

Trend:

BULLISH

RSI:

62

ADX:

28

ATR:

XX

VWAP:

ABOVE

Momentum:

POSITIVE

28. MACRO TAB

Create a Gold Macro Intelligence dashboard.

Display:

DXY

US 2Y

US 10Y

Real Yields

Fed Expectations

Inflation

Risk Sentiment

Geopolitical Risk

Then:

Gold Macro Score

81/100

BULLISH

Explain the major contributors.

29. ORDER FLOW TAB

Where data is available, show:

Buy volume

Sell volume

Delta

CVD

Liquidity

Bid/ask imbalance

Use charts.

Include an AI interpretation.

30. SENTIMENT TAB

Display:

Gold sentiment

USD sentiment

Risk appetite

News sentiment

Social sentiment

Create sentiment gauges.

31. AI FORECAST TAB

Display scenario analysis.

Example:

Next 4 Hours

Bullish continuation

64%

Neutral

23%

Bearish reversal

13%

Then:

Expected Range

XXXX–XXXX

Key Upside Level

XXXX

Key Downside Level

XXXX

Invalidation

XXXX

Make it clear these are model estimates, not guarantees.

32. RISK TAB

Show:

Entry

Stop

Take profit

Risk/reward

ATR risk

Volatility

Event risk

Correlation risk

Position size calculator

Allow user to enter:

Account size

Risk percentage

Entry

Stop

The UI calculates suggested position size.

33. AI ANALYST PAGE

Create a ChatGPT-like AI interface dedicated to markets.

Title:

AI Market Analyst

The AI has access to platform market data.

Example questions:

"Why is gold bullish?"

"What would invalidate the current setup?"

"Compare Gold and EUR/USD."

"Find the strongest setup."

"Why shouldn't I trade right now?"

"What are the major risks today?"

"Analyse today's CPI impact."

Use chat bubbles but maintain the premium trading-terminal aesthetic.

Include quick prompt buttons.

34. MARKET SCANNER

Create a full-screen market scanner.

Columns:

Asset

Price

Change

AI Score

Bias

Regime

Strategy

Probability

R

Risk

Session

Signal

Allow sorting and filtering.

Filters:

Asset

Direction

Score

Strategy

Session

Probability

R

Risk

Market regime

Example filter:

AI Score > 80

LONG

R > 2

London Session

35. STRATEGY LAB

Create a strategy management page.

Display:

My Strategies

Gold Trend AI

London Breakout

NY Reversal

Liquidity Sweep

Macro Momentum

Each strategy has:

Status

Win rate

Profit factor

Sharpe

Max drawdown

Number of trades

Last updated

Create:

"Create Strategy"

button.

36. STRATEGY BUILDER

Create a visual strategy builder.

Fields:

Asset

Timeframe

Entry conditions

Exit conditions

Risk

Filters

Example conditions:

RSI < 30

EMA crossover

BOS detected

Liquidity sweep

DXY weakening

US yields falling

High-impact event absent

Allow:

"Add Condition"

Use a clean builder interface.

37. BACKTESTING PAGE

Create a professional quantitative backtesting interface.

Inputs:

Strategy

Asset

Timeframe

Start date

End date

Initial capital

Risk per trade

Commission

Spread

Slippage

Output:

Net Return

Win Rate

Profit Factor

Sharpe

Sortino

Max Drawdown

Average R

Number of Trades

Expectancy

Create charts:

Equity curve

Drawdown

Monthly returns

Win/loss distribution

Performance by market regime

Performance by session

Performance by day of week

38. AI MODEL LAB

Create an advanced page for the platform's models.

Models:

Market Regime Model

Direction Model

Volatility Model

Trade Probability Model

Signal Fusion Model

For each show:

Version

Accuracy

Precision

Recall

AUC

Calibration

Out-of-sample performance

Last trained

Model status

Drift status

This section can be labeled:

"Advanced"

so ordinary traders are not overwhelmed.

39. TRADING JOURNAL

Create a full journal.

Every AI signal can become a journal entry.

Each entry:

Asset

Direction

Entry

Exit

Result

R multiple

AI Score

Strategy

Market Regime

Reason

Outcome

Allow:

Tags

Notes

Screenshots

Search

Filters

40. AI JOURNAL ANALYSIS

Add an AI button:

"Analyse My Trading"

The AI generates insights such as:

"You perform best when trading XAU/USD during London/New York overlap."

"You tend to enter late during breakout setups."

"Your average losing trade occurs when signal confidence is below 72."

Use mock data initially.

41. ALERTS

Create an Alerts page.

Support:

Price Alert

"XAU/USD > XXXX"

AI Score Alert

"XAU/USD AI Score > 85"

Signal Alert

"New XAU/USD LONG setup"

Structure Alert

"Bullish BOS detected"

Macro Alert

"High-impact CPI released"

Risk Alert

"Current setup invalidated"

Create:

"Create Alert"

modal.

42. RISK CENTER

Create a professional risk dashboard.

Show:

Portfolio Value

Daily Risk

Open Risk

Maximum Drawdown

Correlation Risk

Current Exposure

Assets:

XAU/USD

EUR/USD

GBP/USD

USD/JPY

The AI should detect correlated exposures.

Example:

"EUR/USD and GBP/USD currently have high USD-factor correlation."

43. WATCHLIST

Allow users to create watchlists.

Example:

My Gold Watchlist

XAU/USD

XAG/USD

DXY

US10Y

Forex Watchlist

EUR/USD

GBP/USD

USD/JPY

USD/CHF

Allow drag/reorder.

44. NOTIFICATIONS

Notification center should include:

New AI signal

Signal invalidated

Major economic release

Price alert

Strategy alert

AI model update

Risk warning

45. SETTINGS

Create settings sections:

Account

Notifications

Appearance

Chart

Indicators

Risk

AI Preferences

Data Sources

API Connections

Broker

Security

46. AI PREFERENCES

Allow users to configure:

Risk tolerance:

Conservative

Balanced

Aggressive

Minimum AI score:

60–95

Minimum R:R:

1.5–4.0

Preferred sessions:

Asia

London

New York

London/New York overlap

Preferred markets:

Gold

Forex

Allow AI notifications.

Allow macro warnings.

Allow news warnings.

47. RESPONSIVE DESIGN

The platform must be responsive.

Desktop

Full professional terminal.

Laptop

Compact sidebar and panels.

Tablet

Collapse secondary panels.

Mobile

Do NOT attempt to display the entire desktop terminal.

Create mobile-specific layouts:

Bottom navigation:

Dashboard

Markets

Scanner

AI

Alerts

Market Workspace should become stacked:

Asset header

Chart

AI signal

Intelligence

Analysis

Risk

48. INTERACTION DESIGN

The application must feel alive.

Implement:

Hover states

Tooltips

Smooth transitions

Loading skeletons

Empty states

Error states

Toast notifications

Modal windows

Expand/collapse panels

Tabs

Dropdowns

Search

Filtering

Sorting

Watchlist interactions

Chart timeframe switching

Do not over-animate.

Animations should be subtle and professional.

49. MOCK DATA ARCHITECTURE

For the first version, use realistic mock data but structure the application as if real APIs will be connected.

Create clean data models/interfaces for:

Asset
MarketQuote
Candle
TechnicalMetrics
MarketStructure
LiquidityZone
MacroMetric
EconomicEvent
NewsArticle
AISignal
AIProbability
RiskMetrics
Strategy
BacktestResult
Trade
JournalEntry
Alert
ModelMetrics

Do NOT hardcode values directly throughout components.

Centralize mock data.

The architecture must make it easy to replace mock services with real API services later.

50. API-READY ARCHITECTURE

Create a service abstraction layer.

For example:

/services
    marketService
    economicService
    newsService
    aiService
    strategyService
    backtestService
    journalService
    alertService

Initially these can return mock data.

Later they will connect to the actual backend.

Do not tightly couple UI components to mock data.

51. COMPONENT ARCHITECTURE

Build reusable components:

AssetCard

MarketHeader

CandlestickChart

AIConfluenceScore

BiasBadge

ProbabilityBar

SignalCard

RiskCard

MacroCard

EconomicEventCard

NewsCard

CurrencyStrength

MarketScannerTable

LiquidityMap

StructurePanel

MultiTimeframePanel

AIChat

StrategyCard

BacktestMetrics

EquityCurve

JournalEntry

AlertCard

NotificationCenter

Keep components modular.

52. DATA STATES

Every important component must support:

Loading

Skeleton state.

Loaded

Normal UI.

Empty

Helpful empty state.

Error

Clear error message and retry button.

Offline

Show:

"Market data connection unavailable."

Do not silently display stale live data as if it were current.

53. REALISTIC DEMO DATA

Populate the application with realistic but clearly simulated data.

Use XAU/USD as the primary demo asset.

Create realistic:

Candlestick history

AI scores

technical values

market structures

macro values

news

economic events

signals

backtest statistics

journal entries

Do NOT label simulated data as real-time.

Clearly distinguish:

"DEMO DATA"

until real data sources are connected.

54. AI EXPLANATION STYLE

AI text must sound like an experienced quantitative market analyst.

Do NOT generate hype.

Avoid:

"Guaranteed profit"

"Easy money"

"100% accurate"

"Market will definitely rise"

Instead use:

"Model estimates"

"Current evidence suggests"

"Probability"

"Scenario"

"Invalidation"

"Risk"

"Confidence"

The AI must acknowledge uncertainty.

55. KEY AI SCENARIO MODEL

Every major analysis should support:

Bullish Scenario

Probability

Conditions

Target

Base Scenario

Probability

Conditions

Range

Bearish Scenario

Probability

Conditions

Target

Example:

BULLISH
64%
Continuation above resistance

BASE
23%
Range between support and resistance

BEARISH
13%
Break below demand

56. MARKET REGIME ENGINE UI

Create a market regime badge:

Possible:

TRENDING BULL

TRENDING BEAR

RANGE

BREAKOUT

REVERSAL

HIGH VOLATILITY

LOW VOLATILITY

Show:

Regime confidence

Historical strategy performance in this regime.

Example:

CURRENT REGIME:

TRENDING BULL

Confidence:

91%

Best Strategy:

Trend Following

Historical expectancy:

+0.42R

57. AI DECISION TIMELINE

For each signal, create a timeline.

Example:

14:21

Bullish structure detected

14:24

Liquidity sweep confirmed

14:27

DXY weakness detected

14:30

US yields declining

14:34

AI score → 71

14:38

Volume confirmation

14:41

AI score → 84

14:42

LONG SIGNAL

14:55

+0.8R

This must be visually compelling.

58. SIGNAL EXPLANATION

Every signal should have a "Why this signal?" section.

Show contributing factors:

Market regime

15%

Market structure

15%

Trend

10%

Momentum

10%

Volume

10%

Liquidity

10%

Macro

10%

Sentiment

5%

Risk/reward

15%

These percentages are UI examples only and should be configurable in the future.

59. COMMAND PALETTE

Add a keyboard-accessible command palette.

Shortcut:

Cmd/Ctrl + K

Commands:

Search market

Open XAU/USD

Open scanner

Ask AI

Create alert

Open backtest

Open journal

Toggle sidebar

Settings

60. GLOBAL SEARCH

Search across:

Markets

Signals

Strategies

Journal

News

Economic events

Example:

Search:

"gold"

Results:

XAU/USD

Gold Signals

Gold Strategies

Gold News

Gold Journal Entries

61. IMPORTANT UX PRINCIPLE

Do not overwhelm the user.

Use progressive disclosure.

Default:

What?

Bullish.

How strong?

87/100.

Why?

Five key reasons.

What could go wrong?

Three risks.

What should I do?

WAIT / LONG / SHORT.

Advanced information can be expanded.

62. DASHBOARD INFORMATION HIERARCHY

The hierarchy must be:

LEVEL 1

Market state

Opportunity

Risk

LEVEL 2

AI explanation

Probability

Regime

LEVEL 3

Technical details

Macro

Structure

Liquidity

LEVEL 4

Raw metrics

Advanced quantitative statistics

Do not make raw indicators the main focus.

63. DESIGN THE UI FOR A 27-INCH MONITOR

The primary experience should look exceptional on a large desktop monitor.

Use space intelligently.

Avoid excessive empty space.

Avoid giant cards that only contain one number.

Use dense but readable information.

The interface should feel like a professional trading workstation.

64. DO NOT BUILD THESE YET

Do NOT implement real broker execution.

Do NOT claim the demo data is live.

Do NOT claim AI predictions are guaranteed.

Do NOT build autonomous trading.

Do NOT expose fake API connections as working integrations.

Instead create clean placeholders and interfaces for future integration.

65. FUTURE BACKEND CONTRACT

Structure the frontend so it can eventually receive:

GET /markets
GET /markets/{symbol}
GET /markets/{symbol}/candles
GET /markets/{symbol}/analysis
GET /markets/{symbol}/forecast
GET /signals
GET /scanner
GET /macro
GET /news
GET /economic-calendar
GET /strategies
GET /backtests
GET /journal
GET /alerts
POST /alerts
POST /backtests
POST /ai/chat

The frontend should not need to be rebuilt when these APIs are connected.

66. DEMO USER JOURNEY

Make sure the following journey works completely in the UI:

User lands on Dashboard.

Sees XAU/USD is the strongest setup.

Clicks XAU/USD.

Opens Market Workspace.

Changes timeframe from 1H to 15M.

Chart updates.

AI analysis updates.

User opens Technical tab.

User opens Macro tab.

User opens AI Forecast.

User sees Bull/Base/Bear probabilities.

User opens Signal.

User sees Entry / SL / TP / R.

User sees risks.

User sets an alert.

Toast confirms alert.

User opens Scanner.

Filters AI Score > 80.

Opens EUR/USD.

Returns to Dashboard.

Opens AI Analyst.

Asks "Why is gold bullish?"

AI responds using the demo market data.

User opens Backtesting.

Runs a demo backtest.

Results populate.

User opens Journal.

Reviews previous trades.

AI analyses journal behaviour.

User opens Settings.

Every step should actually work within the frontend.

67. QUALITY BAR

The result must look like a product that could realistically become a commercial fintech SaaS platform.

It must NOT look like:

A generic Tailwind template

A school project

A basic CRUD dashboard

A crypto meme trading interface

A collection of disconnected cards

It should feel like:

Bloomberg-inspired information density + modern fintech UX + AI-native interaction + professional quantitative trading software.

Do not copy Bloomberg or any existing company's branding.

Create an original design language.

68. FINAL PRODUCT STRUCTURE

The completed application should contain:

APP
│
├── Dashboard
│
├── Markets
│   ├── XAU/USD
│   ├── EUR/USD
│   ├── GBP/USD
│   ├── USD/JPY
│   ├── USD/CHF
│   ├── AUD/USD
│   ├── USD/CAD
│   └── NZD/USD
│
├── Scanner
│
├── AI Analyst
│
├── Strategies
│   ├── Strategy Library
│   └── Strategy Builder
│
├── Backtesting
│
├── AI Model Lab
│
├── Journal
│
├── Alerts
│
├── Risk Center
│
└── Settings

69. FINAL IMPLEMENTATION INSTRUCTION

Build the application as a fully interactive frontend prototype, not a static mockup.

Every navigation item should work.

Every major button should have an interaction.

Charts should be interactive.

Filters should work.

Tabs should work.

Modals should work.

Alerts should work using local/demo state.

AI chat should work using a mock response service.

Backtesting should work using a simulated dataset.

Journal interactions should work.

Settings should work.

Use realistic simulated market data and clearly label it as demo/simulated data.

Keep all data and services modular so they can later be replaced with real APIs and backend services.

Prioritize:

Exceptional UX

Professional visual design

Information hierarchy

AI-native interaction

Financial data visualization

Responsive design

Reusable components

API-ready architecture

Performance

Maintainability

The final result should feel like the first production-quality version of a serious AI Gold & Forex Trading Intelligence Platform, with XAU/USD as the flagship instrument.

Build the complete application rather than just a landing page.

This prompt is deliberately structured so Lovable builds the product interface and interaction architecture first, while leaving clean boundaries for the real market-data, ML, backtesting, and AI backend we'll connect afterward.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1d6ba174-2c2e-4f82-ba3b-e23ee23c4a61).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
