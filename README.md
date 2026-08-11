# Aurum — AI Gold & Forex Trading Intelligence

Decision-support platform for XAU/USD and FX majors. The system does not emit bare
buy/sell calls; every output carries a direction, a calibrated probability, a risk
assessment and an explanation — including `NO TRADE` as a first-class outcome.

> Not investment advice. All figures in the current build are simulated.

## Status

| Layer                     | State                     |
| ------------------------- | ------------------------- |
| Frontend (TanStack Start) | Running against mock data |
| Backend (FastAPI)         | Not started               |
| Market data               | Not connected             |
| Quant / ML                | Not started               |

All 11 sidebar destinations are implemented against mock data: `/`, `/markets`,
`/markets/$symbol`, `/scanner`, `/ai-analyst`, `/strategies`, `/backtesting`,
`/model-lab`, `/journal`, `/alerts`, `/risk`, `/settings`.

## Repository layout

```
src/           TanStack Start frontend
  routes/      File-based routing (see src/routes/README.md)
  components/  terminal/ = product UI, ui/ = shadcn primitives
  services/    Service layer — the single seam to the future backend
  lib/         Domain types, mock data, formatting
docs/          Design brief and architecture notes
```

## Getting started

```bash
bun install && bun run dev
```

Runs on http://localhost:8080.

| Command          | Purpose                                      |
| ---------------- | -------------------------------------------- |
| `bun run dev`    | Dev server with HMR                          |
| `bun run build`  | Production build (Nitro, node-server preset) |
| `bun run lint`   | ESLint                                       |
| `bun run format` | Prettier                                     |

## Architecture note: the service seam

`src/services/index.ts` is the boundary between UI and data. Components never
import mock data directly — they call services through TanStack Query. Each
service function is documented against the backend endpoint that will replace it,
so swapping simulation for live data is a change to one file rather than a
rewrite of the UI.

Domain models live in `src/lib/types.ts` and are the contract both sides must
agree on.
