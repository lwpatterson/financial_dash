# Stock Alert Tracker — Project Context

This file gives Claude context about this project for continued development.
It is auto-loaded by Claude Code at the start of every session.

---

## What This App Does

A locally-run **personal finance + stock monitoring** web app. Features:

- **Watchlist** — add tickers, view live indicators (RSI, MACD, SMA, BB), mini price charts
- **Alerts** — build if/and/or alert rules with a visual builder; notified via browser pop-up + optional email
- **Financial Assets** — Retirement accounts, Work Stock (ESPP/RSU), Physical Assets, Liquid Assets
- **Planning** — Mortgage calculator (with target payoff year), Payoff vs. Invest comparison, Dividends portfolio
- **Inflation** — Live CPI-U rate from BLS + per-account inflation drag, real return, opportunity cost, consumer staples purchasing power

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, SQLModel, APScheduler |
| Database | SQLite (local, stored at `backend/data/stocks.db`) |
| Stock Data | yfinance + pandas-ta |
| HTTP client | httpx (for BLS API calls) |
| Frontend | React 18, Vite, Tailwind CSS, Recharts, lucide-react |
| Container | Docker + Docker Compose |
| Notifications | Browser Notifications API + optional SMTP email (smtplib) |

**Removed / not present:** Twilio, SMS — explicitly removed. Do not re-add.

---

## Project Structure

```
stock-tracker/
├── .devcontainer/devcontainer.json
├── .env.example                      # SMTP config template
├── Makefile                          # make start / stop / logs / build / clean
├── docker-compose.yml                # backend :8000, frontend :5173
├── CLAUDE.md                         # ← this file
├── backend/
│   ├── main.py                       # FastAPI app + lifespan (scheduler)
│   ├── database.py                   # SQLite engine, init_db(), migrations
│   ├── models/
│   │   └── db.py                     # All SQLModel tables + Pydantic schemas
│   ├── routers/
│   │   ├── tickers.py                # GET/POST/DELETE /tickers, indicators
│   │   ├── alerts.py                 # CRUD /alerts/rules, events, pending, run-now
│   │   ├── dividends.py              # /dividends/ — portfolio + holdings
│   │   ├── retirement.py             # /retirement/ — retirement accounts CRUD
│   │   ├── workstock.py              # /workstock/ — ESPP/RSU accounts + E*TRADE OAuth
│   │   ├── assets.py                 # /assets/ — physical assets CRUD
│   │   ├── liquid.py                 # /liquid/ — liquid accounts CRUD
│   │   ├── inflation.py              # /inflation/current — BLS CPI-U rate
│   │   └── staples.py                # /staples/prices — BLS consumer staples prices
│   └── services/
│       ├── indicators.py             # fetch_indicators(), evaluate_rule_tree(), MMBM/MMSM
│       ├── scheduler.py              # APScheduler, run_checks(), pending_notifications
│       ├── inflation.py              # BLS CPI-U YoY rate, 24h cache
│       └── staples.py                # BLS APU average retail prices, 24h cache
└── frontend/
    ├── vite.config.js                # Proxies /api → http://backend:8000
    ├── tailwind.config.js            # Custom palette (see Tailwind gotcha below)
    └── src/
        ├── main.jsx                  # BrowserRouter — all routes defined here
        ├── index.css                 # Tailwind + .card, light/dark theme, shade fixes
        ├── api.js                    # All fetch calls to /api/*
        ├── components/
        │   ├── Layout.jsx            # Left sidebar nav + light/dark toggle
        │   ├── RuleBuilder.jsx       # Visual AND/OR condition block editor
        │   └── ToastContainer.jsx    # Fixed bottom-right toast stack
        ├── hooks/
        │   └── useAlertNotifications.js  # Polls /alerts/pending every 30s
        └── pages/
            ├── Dashboard.jsx         # Watchlist: ticker cards, charts, indicators
            ├── DashboardPage.jsx     # Overview: net worth summary, section cards
            ├── AlertsPage.jsx        # Alert rules, RuleBuilder modal, Run Now
            ├── HistoryPage.jsx       # Fired alert log
            ├── RetirementPage.jsx    # Retirement account tracking
            ├── WorkStockPage.jsx     # ESPP/RSU + E*TRADE integration
            ├── AssetsPage.jsx        # Physical assets (with debt tracking)
            ├── LiquidAssetsPage.jsx  # Liquid accounts + inflation analysis
            ├── MortgagePage.jsx      # Amortization + extra payment + target payoff year
            ├── PayoffInvestPage.jsx  # Payoff vs. invest split calculator
            └── DividendPage.jsx      # Dividend portfolio tracker
```

---

## Nav Structure (Layout.jsx)

```
Overview
  └─ Dashboard (net worth summary)
Stocks
  ├─ Watchlist
  └─ Alerts
Financial Assets
  ├─ Retirement
  ├─ Work Stock
  ├─ Physical Assets
  └─ Liquid Assets
Planning
  ├─ Mortgage
  ├─ Payoff vs. Invest
  └─ Dividends
```

Light/dark mode toggle button is at the bottom of the sidebar.
Theme is persisted to `localStorage` (`theme: 'light' | 'dark'`).

---

## Key Design Decisions

- **SQLite only** — data lives in `backend/data/` (Docker volume). `make clean` wipes it.
- **DB migrations** — `database.py` runs `ALTER TABLE` statements on every startup (wrapped in try/except so they're no-ops if the column exists already). Add new migrations to the `_migrations` list.
- **No SMS / Twilio** — notifications are browser pop-ups + optional SMTP email.
- **Notification flow** — scheduler appends to `pending_notifications` list; frontend polls `GET /alerts/pending` every 30s, which returns and clears the list.
- **MMBM/MMSM** — Market Maker Buy/Sell Model detection in `indicators.py`. Exposed as boolean keys usable in the rule builder (`mmbm_signal`, `mmsm_signal`, etc.).
- **Rule tree format** — JSON in SQLite: `{ op: "AND"|"OR", conditions: [leaf|group, ...] }`. Leaf: `{ indicator, operator, value }`.
- **Vite proxy** — frontend calls `/api/*`; Vite proxies to `http://backend:8000`.
- **yfinance thread-safety** — do NOT call `yf.download` concurrently (race condition corrupts cache). History is fetched once and stored in `IndicatorCache.data` JSON so `getTickers` returns it directly; individual `getIndicators` calls are for fresh single-ticker refreshes only.
- **BLS API** — uses the public v1 API (no key required). Two services:
  - `inflation.py` — `GET https://api.bls.gov/publicAPI/v1/timeseries/data/CUSR0000SA0` (CPI-U YoY)
  - `staples.py` — `POST https://api.bls.gov/publicAPI/v1/timeseries/data/` with 8 APU series IDs (batch request)
  - Both cached for 24 hours with stale-data fallback on failure.

---

## ⚠️ Tailwind Color Gotcha

`tailwind.config.js` defines `green` and `red` as **flat single-value strings**:
```js
colors: { ..., green: '#22c55e', red: '#ef4444' }
```
In Tailwind v3, this **replaces** the entire shade palette for those names.
`text-green-400`, `text-red-400`, `bg-green-500`, etc. generate **no CSS rule** —
elements fall back to the inherited body color (black in light mode).

**Fix already applied in `index.css`:** explicit rules restore `text-green-300/400`
and `text-red-300/400` for dark mode, with darker overrides in the `.light` block.

**Rule:** never use `text-green-NNN` or `text-red-NNN` shades in new code without
also adding a restore + light-mode override in `index.css`. Alternatively use
`text-emerald-*`, `text-rose-*`, etc. (unaffected palettes).

---

## Light / Dark Theme

- CSS variables defined in `:root` (dark defaults) and `.light` class overrides — see `index.css`.
- `.light` class is toggled on `document.documentElement` and persisted to `localStorage`.
- Tailwind compiled classes use hardcoded hex. Light-mode overrides use two-class selectors
  (`.light .bg-panel`) which beat Tailwind's single-class specificity without `!important`.
- `text-slate-200` → near-black in light mode (via `.light .text-slate-200` override).

---

## Models in db.py

| Table | Purpose |
|---|---|
| `Ticker` | Watchlist symbols |
| `AlertRule` | Alert rule definitions (JSON rule tree) |
| `AlertEvent` | Fired alert log |
| `IndicatorCache` | Latest indicators + price history per ticker |
| `DividendHolding` | Shares owned per dividend ticker |
| `DividendSnapshot` | Latest dividend data per ticker (refreshed in bulk) |
| `LiquidAccount` | Checking/savings/HYSA/etc. with optional APY |
| `RetirementAccount` | 401k/IRA/Roth accounts |
| `Asset` | Physical assets with value + debt fields |
| `WorkStockAccount` | ESPP/RSU equity plan accounts |
| `ETradeCredential` | Singleton row for E*TRADE OAuth tokens |

---

## Available Indicator Keys (alert rule builder)

`price`, `open`, `high`, `low`, `volume`, `volume_ratio`,
`rsi`, `macd`, `macd_signal`, `macd_hist`,
`sma_20`, `sma_50`, `sma_200`, `ema_12`, `ema_26`,
`bb_upper`, `bb_mid`, `bb_lower`,
`mmbm_sweep`, `mmbm_mss`, `mmbm_signal`,
`mmsm_sweep`, `mmsm_mss`, `mmsm_signal`

---

## Running Locally

```bash
cp .env.example .env   # add SMTP creds if you want email alerts
make start             # start containers (detached)
make stop              # stop containers
make logs              # follow all logs
make build             # rebuild after dependency changes
make clean             # wipe containers + SQLite data (prompts)
```

App: http://localhost:5173 — API docs: http://localhost:8000/docs

---

## User Preferences & Context

- Runs on **local laptop** via devcontainer / Docker Desktop
- Uses **VS Code**
- Interested in **ICT concepts** — MMBM/MMSM, liquidity sweeps, market structure shifts
- Wants a **clean web UI** to watch during market hours, not a script runner
- No SMS. Browser pop-ups + optional email only.
- Prefers inline-editable cards (click pencil icon to edit in place) over modal dialogs for data entry
