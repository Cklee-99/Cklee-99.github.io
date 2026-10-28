# Quantfolio Lab — Agent Instructions and Project State

> This file is the source of truth for project goals, engineering rules, current progress, decisions, pending work, and known issues. Every AI coding agent must read it before making changes and update it after completing a task. `UI_UX_SPEC.md` is the source of truth for frontend design tokens, layout, navigation, localization, interaction, and client-side persistence; read it before any UI-facing change.

## 1. Project Identity

- **Project name:** Quantfolio Lab
- **Repository slug:** `quantfolio-lab`
- **Tagline:** Open-Source Quantitative Investing Playground
- **Purpose:** An open-source, mobile-first web application for learning about US stock and ETF investing through historical data, deterministic trading strategies, technical indicators, and backtesting.
- **Primary users:** Individual learners and developers researching quantitative investment strategies.
- **Deployment target:** GitHub Pages.
- **Runtime constraint:** The deployed application must not require an LLM API, paid backend, or continuously running server.
- **Financial disclaimer:** Educational and research use only. Do not claim that any strategy guarantees profit or provides personalized financial advice.

## 2. Mandatory Agent Workflow

Before every task:

1. Read this entire file.
2. Read `UI_UX_SPEC.md` before creating or modifying frontend UI, layout, styles, navigation, localization, charts, loading/error states, or user-facing interactions. If the file is missing, report that blocker and do not invent a conflicting design system.
3. Inspect the current repository structure and relevant source files.
4. Check the working tree and existing changes before editing anything.
5. Identify the current milestone, the requested task, dependencies, and acceptance criteria.
6. If repository state conflicts with this file, inspect the evidence and update this file rather than blindly trusting stale notes.

After every task:

1. Run the relevant tests, lint checks, type checks, or build commands when available.
2. Report the exact commands executed and their actual results. Never claim a command passed if it was not run.
3. Update **Current Status**, the relevant **Milestone Roadmap** checklist, **Known Issues and Resolutions**, and **Decision Log** as needed. Keep completed tasks and the next actionable task explicit.
4. Record important file changes, test failures, workarounds, and unresolved limitations.
5. Mark an item complete only after verifying it. If it was implemented but not tested, label it `Implemented, not verified`.
6. Keep the next task small enough to implement and validate in one focused session.

Do not attempt to implement every milestone in one uncontrolled batch. Do not erase useful history when updating this file.

## 3. Communication and Coding Rules

- Communicate with the project owner in Traditional Chinese unless asked otherwise.
- Write all source code, identifiers, and code comments in English.
- Keep comments minimal and useful; prefer one-line English comments when needed.
- Prefer clear names, small modules, strict typing, and simple designs over unnecessary abstractions.
- Explain errors with the file or command involved, the cause supported by evidence, and a concrete fix.
- Do not fabricate market data, test results, deployment results, or provider capabilities.
- Ask for clarification only when a missing decision blocks safe implementation; otherwise use documented defaults and record the assumption.
- Do not run destructive commands, delete existing user work, commit, push, or change remote repository settings without explicit authorization.
- Do not expose or commit API keys, access tokens, passwords, or other secrets.

## 4. Technology Decisions

Initial stack:

- React
- TypeScript with strict compiler settings
- Vite
- Responsive CSS with reusable design tokens defined by `UI_UX_SPEC.md`
- `i18next` and `react-i18next` with bundled `zh-TW` and `en` resources, subject to dependency compatibility checks
- Hash-based client-side routing suitable for GitHub Pages
- TradingView Lightweight Charts for financial charts, subject to its current API and attribution requirements
- Vitest for unit and integration tests
- npm with `package-lock.json`
- GitHub Actions for GitHub Pages deployment
- IndexedDB for appropriate market-data caching
- localStorage for non-sensitive preferences and settings

Do not add a backend server. Verify library compatibility against current official documentation before integrating a library. Pin dependencies through the lockfile and avoid loading core runtime dependencies from an unpinned CDN.

## 5. Product Requirements

### 5.1 Configuration

The user must be able to configure:

- US stock or ETF ticker, default `SPY`
- Trading strategy
- Initial capital in USD
- Inclusive start and end dates; end date defaults to the current calendar date
- Maximum allocation per position
- Transaction fee and slippage assumptions
- Fractional-share setting
- Benchmark ticker, default `SPY`
- Visibility of technical indicators, candlestick patterns, and available market events

Validate inputs and explain invalid configurations clearly. Do not imply that a bar exists for a date when no completed daily session is available.

### 5.2 Dashboard and Charts

Display, where applicable:

- Initial capital, final equity, profit/loss, and total return
- CAGR, maximum drawdown, annualized volatility, and Sharpe ratio with documented assumptions
- Executed trade count, closed-trade win rate, and portfolio exposure
- Buy-and-hold benchmark return and performance difference
- Daily candlesticks, MA5/MA20/MA60, Bollinger Bands (20, 2), and RSI14
- Trade markers, a daily decision timeline, equity curve, and drawdown visualization
- Data source, data range, cache status, and error/loading states

Do not represent an unavailable metric as zero. For example, win rate is not applicable when no trades have closed.

### 5.3 Market Events

Treat market events as a separate data domain from price-derived indicators. Support dated manual annotations or CSV imports first. Only show events supported by actual data and identify their source when available. Never invent historical headlines. Clearly report when event data is unavailable.

## 6. Market Data Rules

Use a normalized daily-bar model with fields where available:

- `date`, `open`, `high`, `low`, `close`, `volume`
- `adjustedClose`, `dividend`, `splitRatio`

Represent exchange dates as ISO calendar dates (`YYYY-MM-DD`). Avoid unintended local-time or UTC date shifts.

Implement data access behind a replaceable provider interface. Initial data modes, in priority order:

1. Deterministic demonstration data for development and testing.
2. CSV upload and validation for user-provided historical data.
3. A replaceable online market-data provider.
4. Browser caching of previously retrieved data.

Verify the current provider's API, CORS behavior, rate limits, coverage, attribution, and terms before claiming it is supported. Treat undocumented endpoints and public CORS proxies as experimental, not guaranteed services. Treat browser-side API keys as public because users can inspect them.

Never silently substitute demonstration data for real market data. Label demonstration data visibly. On provider failure, explain the error and offer cached data, CSV import, or explicitly labeled demonstration data.

Validate dates, duplicates, finite numeric values, positive prices, non-negative volume, OHLC relationships, missing values, suspicious gaps, and insufficient history. Do not silently interpolate missing prices.

## 7. Indicator and Pattern Rules

Implement pure, deterministic functions without UI dependencies:

- Simple moving averages: 5, 20, and 60 sessions
- Bollinger Bands: 20-session SMA and 2 standard deviations
- RSI: 14 sessions using Wilder's smoothing
- Candlestick patterns: Doji, bullish engulfing, bearish engulfing, hammer, and shooting star

Document the standard-deviation convention and pattern thresholds. Handle insufficient history and undefined values explicitly. Avoid division by zero and do not mutate input arrays. Add unit tests with known expected values.

Use sufficient pre-start warm-up bars to calculate indicators, but do not let warm-up bars create trades or change initial capital.

## 8. Strategy Rules

Every strategy must return exactly one decision for each eligible trading session: `BUY`, `SELL`, or `HOLD`.

Initial strategies:

1. **Trend Following:** MA20/MA60 crossover with documented entry and exit rules.
2. **Mean Reversion:** RSI14 and Bollinger Band conditions.
3. **Scheduled Capital Deployment:** configurable monthly tranche deployment without assuming deposits that are not configured.
4. **Candlestick Confirmation:** explicit pattern and trend/indicator confirmation rules.
5. **Momentum Breakout:** RSI14, Bollinger Bands, and a documented trend filter.

Define thresholds, signal precedence, entries, exits, and limitations in code and documentation. Treat strategies as educational examples, not verified profitable systems. Avoid optimizing and evaluating thresholds on the same historical period without disclosing the bias.

A strategy may only access data available at the decision timestamp. It must not inspect future bars, future adjusted values, future events, or later transaction results.

## 9. Backtesting and Accounting Rules

The initial simulator is long-only:

- No short selling, margin, or borrowing.
- Cash and holdings must never become negative.
- Apply configured transaction fees and slippage.
- Support configurable fractional shares.
- Limit execution to at most one trade action per trading session.
- Record each decision, execution, skipped order, cost, cash balance, position quantity, and portfolio snapshot.

### Execution timing — avoid look-ahead bias

1. Use data available through the close of session T to generate the decision for T.
2. Schedule a BUY or SELL for the next eligible session.
3. Execute at the next session's open using the documented slippage and fees.
4. Never use that next session's high, low, close, or volume to decide or price the earlier signal.
5. If an order cannot execute before the selected end date, leave it pending and do not count it as an executed trade.

Track cash, share quantity, position market value, portfolio equity, realized/unrealized P&L, fees, slippage, dividends, and corporate actions where supported. Portfolio equity equals cash plus the market value of open positions. Do not double-count dividends already incorporated into a total-return price series. Explicitly disclose limitations when corporate-action data is incomplete.

Implement a buy-and-hold benchmark using the same date range and documented assumptions. Report unavailable comparisons as unavailable, not zero.

Use documented, consistent definitions for total return, CAGR, maximum drawdown, volatility, Sharpe ratio, win rate, trade count, exposure, and benchmark excess return.

## 10. Testing and Quality Gates

Create tests for:

- Moving averages, Bollinger Bands, RSI, and candlestick patterns
- Strategy signals and precedence
- Warm-up bars and inclusive date boundaries
- CSV parsing and invalid data
- Transaction fees, slippage, fractional shares, and cash/position invariants
- Splits and dividends when implemented
- Benchmark and performance metrics
- No-trade, missing-data, and insufficient-history cases
- At least one full deterministic backtest and its transaction ledger

Use deterministic fixtures; do not use random mock prices in calculation tests. Fix regressions introduced by a change before moving on.

## 11. GitHub Pages Requirements

The app must build as a static site and work under a repository subpath, not only at the domain root. Configure Vite's base path and GitHub Actions appropriately. Run tests before deployment. Document repository setup and deployment steps. Do not claim deployment occurred unless it was actually verified.

Do not push or change GitHub settings without explicit owner authorization.

## 12. Milestone Roadmap

### Milestone 0 — Local Project Bootstrap

- [x] Owner reports Node.js v22.23.4 and npm v10.9.9.
- [x] Owner reports Vite React TypeScript scaffold created in `quantfolio-lab`.
- [x] Owner reports completing the local setup/build verification step. Exact command output was not included in the conversation; re-run checks before relying on the result.
- [x] Place `AGENTS.md` and `UI_UX_SPEC.md` at the repository root and verify both are tracked locally.

### Milestone 1 — Foundation and Responsive Shell

- [ ] Read `UI_UX_SPEC.md` and inspect/validate the scaffold before editing.
- [ ] Implement reusable CSS tokens from `UI_UX_SPEC.md`.
- [ ] Implement the mobile-first app shell and static-safe navigation.
- [ ] Implement the simulation configuration form and validation.
- [ ] Add empty, loading, and error states.
- [ ] Add bundled `zh-TW` and `en` localization foundations.
- [ ] Verify type checking, tests, and production build.

### Milestone 2 — Data and Indicators

- [ ] Define normalized market data types and provider interface.
- [ ] Create deterministic demonstration fixtures.
- [ ] Implement CSV import, preview, and validation.
- [ ] Implement MA, Bollinger Bands, RSI, and candlestick patterns.
- [ ] Add unit tests and source-status display.

### Milestone 3 — Strategies and Backtesting

- [ ] Implement the five initial strategies.
- [ ] Implement next-session execution and transaction accounting.
- [ ] Implement fees, slippage, and fractional-share settings.
- [ ] Implement benchmark and performance metrics.
- [ ] Add deterministic integration tests.

### Milestone 4 — Dashboard and Charts

- [ ] Implement candlestick chart and overlays.
- [ ] Implement RSI panel, equity curve, and drawdown chart.
- [ ] Implement execution markers and daily timeline.
- [ ] Validate mobile layout and error handling.

### Milestone 5 — Online Data and Release

- [ ] Verify the selected provider's current API and usage terms.
- [ ] Implement online data retrieval and resilient caching.
- [ ] Add optional market-event import.
- [ ] Complete README, license, and disclaimer.
- [ ] Run complete tests and production build.
- [ ] Validate GitHub Pages build configuration.
- [ ] Obtain explicit authorization before pushing or changing remote settings.

## 13. Current Status

- **Current milestone:** Milestone 1 — Foundation and Responsive Shell.
- **Project implementation status:** Owner reports completing the local Vite scaffold setup and build step. The exact terminal output is not recorded here, so the agent must verify the current project state and run the production build before making assumptions.
- **Current verified tests:** No test output has been provided in this file.
- **Current blocker:** Ensure `AGENTS.md` and `UI_UX_SPEC.md` are both present at the repository root; inspect `package.json`, the working tree, and current files first.
- **Next task:** Verify the scaffold and implement Milestone 1 only, following `UI_UX_SPEC.md`.
- **Important:** Do not rerun Vite scaffolding over the existing project. Do not overwrite meaningful files without inspection.

## 14. Known Issues and Resolutions

Record issues using this format:

- **Issue:** Short title.
- **Observed evidence:** Exact error, output, or reproducible behavior.
- **Root cause:** Confirmed cause, or `Unconfirmed` if not proven.
- **Resolution:** The actual fix applied, or `Pending`.
- **Verification:** Exact command or test and its result.
- **Issue:** Vite scaffold dependency resolution failed during initial setup.
  - **Observed evidence:** npm reported `ERESOLVE`; the scaffold selected `typescript@7.0.2`, while `typescript-eslint@8.72.1` declared peer support for TypeScript `<6.1.0`.
  - **Root cause:** Incompatible TypeScript and typescript-eslint peer dependency ranges in the generated dependency tree.
  - **Resolution:** The owner was instructed to set `devDependencies.typescript` to `~6.0.2` and run `npm install` again.
  - **Verification:** The owner subsequently reported completing Step 4. The exact install/build output was not provided here, so re-run `npm install` if needed and verify `npm run build` before relying on this as independently confirmed.

Do not invent additional issues or claim verification that has not been observed.

## 15. Decision Log

- **D-001:** Use React, TypeScript, and Vite for a maintainable static SPA.
- **D-002:** Deploy to GitHub Pages without a runtime backend.
- **D-003:** Keep indicators, strategies, accounting, and backtesting independent of the UI.
- **D-004:** Use deterministic demo data and CSV import so the app remains useful when online data providers fail.
- **D-005:** Treat online market-data providers and public CORS proxies as replaceable, potentially limited services.
- **D-006:** Generate signals using information available through the session close and execute at the next eligible session's open.
- **D-007:** Use this `AGENTS.md` as the source of truth for project instructions and progress. AI tools that do not automatically load it must be explicitly asked to read it before working.
- **D-008:** Use `UI_UX_SPEC.md` as the shared UI/UX design contract across AI tools; any approved global design change must update that file.
- **D-009:** Use bundled `zh-TW` and `en` translations, system-first fonts, local npm dependencies, and static-safe hash routing so the UI does not depend on runtime CDNs or server rewrites.

## 16. Task Acceptance Template

For each completed task, update the status in this file using:

- **Task:**
- **Status:** `Complete`, `Implemented, not verified`, or `Blocked`.
- **Files changed:**
- **Commands executed:**
- **Verification results:**
- **Known limitations:**
- **Next task:**

Never mark an item complete based only on generated code or visual inspection when a relevant test/build could be run.
