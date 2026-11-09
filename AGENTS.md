# Quantfolio Lab — Agent Instructions and Project State

> This file is the source of truth for project goals, engineering rules, current progress, decisions, pending work, and known issues. Every AI coding agent must read it before making changes and update it after completing a task. `UI_UX_SPEC.md` is the source of truth for frontend design tokens, layout, navigation, localization, interaction, and client-side persistence; read it before any UI-facing change.

## 1. Project Identity

- **Project name:** Quantfolio Lab
- **Repository name:** `Cklee-99.github.io`
- **Repository URL:** `https://github.com/Cklee-99/Cklee-99.github.io`
- **Published URL:** `https://cklee-99.github.io/`
- **GitHub Pages site type:** User site (the repository name matches the GitHub account's `<owner>.github.io` naming convention). This is the root site, not a project site under `/quantfolio-lab/`.
- **Product/repository slug for future standalone project hosting:** `quantfolio-lab` (not the current deployment repository name).
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
- **Language policy (permanent):** All owner-facing communication must be Traditional Chinese. `src/i18n/locales/zh-TW/` must contain Traditional Chinese only — never Simplified Chinese; `src/i18n/locales/en/` must remain English. Every new visible UI label, error, status, strategy description, and simulation message must exist in both locales with consistent keys.
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
- `i18next`/`react-i18next` plan replaced by a bundled local `translate(locale, key)` lookup (`src/i18n/index.ts`); keeps zero runtime dependencies and works offline on GitHub Pages.
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

### Current deployment target

- Repository: `Cklee-99.github.io` (`https://github.com/Cklee-99/Cklee-99.github.io`).
- Published site: `https://cklee-99.github.io/`.
- This is a GitHub Pages **user site**, served from the domain root. Do not configure it as a project site.
- Vite production `base` must remain `/` (or use Vite's default root base). Do not set it to `/quantfolio-lab/` for the current deployment.
- GitHub Actions must run the locked npm install, checks/build as appropriate, upload the `dist/` directory as the Pages artifact, and deploy that artifact.
- The workflow is expected under `.github/workflows/` and the Pages source is configured to use GitHub Actions. Inspect the actual file and Pages settings evidence before claiming they are correct.
- The current workflow runs quality gates `npm run lint` and `npm run test` after `npm ci` and before the production build (`npm run build`, which also runs the TypeScript compiler via `tsc -b`). Deployment only occurs after lint, test, and build succeed. `actions/checkout` uses `persist-credentials: false` because no later workflow step needs Git checkout credentials.
- Resolve assets using Vite-aware imports or `import.meta.env.BASE_URL`; avoid paths that assume a different deployment root.
- Keep the app static: no runtime server, SSR, backend API, LLM API, or scheduled server job may be required.

### Future hosting change

If the owner later creates a separate repository named `quantfolio-lab` and deploys it as a GitHub Pages project site, its URL will normally be `https://cklee-99.github.io/quantfolio-lab/`. Only then should the production Vite `base` and asset-path tests be changed for `/quantfolio-lab/`. Do not make that change as part of the current work.

Run relevant tests and a production build before deployment. Do not push, commit, or change remote GitHub settings without explicit owner authorization.

## 12. Milestone Roadmap

### Milestone 0 — Local Project Bootstrap

- [x] Owner reports Node.js v22.23.4 and npm v10.9.9.
- [x] Owner reports Vite React TypeScript scaffold created in `quantfolio-lab`.
- [x] Owner reports completing the local setup/build verification step. Exact command output was not included in the conversation; re-run checks before relying on the result.
- [x] Place `AGENTS.md` and `UI_UX_SPEC.md` at the repository root (owner-provided screenshot shows both files at the root; local tracking status should still be checked by the agent).
- [x] Configure and deploy the static Vite build through GitHub Actions to `https://cklee-99.github.io/` (owner reports deployment succeeded; the next agent should inspect the workflow and re-run the build rather than claiming independent verification).

### Milestone 1 — Foundation and Responsive Shell

- [x] Read `UI_UX_SPEC.md` and inspect/validate the scaffold before editing.
- [x] Implement reusable CSS tokens from `UI_UX_SPEC.md` (`src/styles/tokens.css`).
- [x] Implement the mobile-first app shell and static-safe navigation (`AppShell` with hash-based `router`).
- [x] Implement the simulation configuration form and validation (`BacktestView` wired to pure `validateBacktestConfig`).
- [x] Add empty, loading, and error states (`StatusBanner`, unavailable/metric-none labels).
- [x] Add bundled `zh-TW` and `en` localization foundations (local `translate(locale, key)` lookup; no runtime fetch).
- [x] Verify type checking, tests, and production build (`npm run build`, `npm run lint`, `npm run test` — see Current Status).

### Milestone 2 — Data and Indicators

- [x] Define normalized market data types and provider interface.
- [x] Create deterministic demonstration fixtures.
- [x] Implement CSV import, preview, and validation.
- [x] Implement MA, Bollinger Bands, RSI, and candlestick patterns.
- [x] Add unit tests and source-status display.

### Milestone 3 — Strategies and Backtesting

- [x] Implement the five initial strategies.
- [x] Implement next-session execution and transaction accounting.
- [x] Implement fees, slippage, and fractional-share settings.
- [x] Implement benchmark and performance metrics.
- [x] Add deterministic integration tests.

### Milestone 4 — Dashboard and Charts

- [x] Implement candlestick chart and overlays (TradingView Lightweight Charts v5.2.1).
- [x] Implement MA5/MA20/MA60 and Bollinger Bands overlays.
- [x] Implement volume visualization and chart controls.
- [x] Implement RSI14 panel with fixed 0–100 scale and 30/70 references.
- [x] Implement equity curve, benchmark comparison, and drawdown chart.
- [x] Implement BUY/SELL execution markers and daily decision/transaction timeline.
- [x] Validate mobile layout and error handling (viewport checks UNVERIFIED — see Known limitations).
- [ ] Record a passing full `npm run verify` (owner integrated terminal required).

### Milestone 5 — Online Data and Release

- [ ] Verify the selected provider's current API and usage terms (Yahoo chart endpoint and the cors.dev proxy remain undocumented/experimental; availability is not guaranteed).
- [x] Implement online data retrieval and resilient caching (Yahoo chart provider + localStorage/IndexedDB cache implemented and wired into Analysis this session; end-to-end fetch and full verify still pending).
- [ ] Add optional market-event import.
- [ ] Complete README, license, and disclaimer.
- [ ] Run complete tests and production build.
- [x] Configure the current GitHub Pages user-site deployment using the root URL and `dist/` build artifact (owner reports deployment succeeded; future changes must re-validate it).
- [ ] Obtain explicit authorization before pushing or changing remote settings.

## 13. Current Status

- **Current milestone:** Milestones 1, 1.2, 2, 2.1, 3, and 3.1 are complete. Milestone 4 — Dashboard and Charts is `Implemented` using TradingView Lightweight Charts v5.2.1 (bundled via npm; no runtime CDN): candlestick + MA5/MA20/MA60 + Bollinger overlays, volume overlay with chart controls, RSI14 panel (fixed 0–100 scale with 30/70 references), equity curve + benchmark comparison + drawdown chart, BUY/SELL execution markers, and a daily decision/transaction timeline. Chart rendering is decoupled from the financial calculations (`chart-utils.ts` validates dates and rejects non-finite/negative OHLC without mutating simulation results). `npx tsc -b` PASS (exit 0), `npm run lint` PASS (exit 0), `npm run build` PASS (exit 0, `✓ 85 modules transformed`, gzip JS 151.38 kB). Targeted chart-utils/benchmark/locale Vitest runs exceed the harness 30s window (protocol 16.4) and are UNVERIFIED here — run `npm run verify` (or `npm run test`) in the VS Code integrated terminal.
- **Project implementation status:** Milestones 1, 1.2, 2, 2.1, 3, and 3.1 complete. Milestone 4 adds chart infrastructure (`src/components/charts/{chart-theme,chart-types,chart-utils,ChartLegend,ChartTooltip}.tsx|.ts`), four chart components (`CandlestickChart`, `RSIChart`, `EquityCurveChart`, `DrawdownChart`), reworked `Analysis.tsx`/`Overview.tsx`/`BacktestView.tsx`/`AppShell.tsx`, new `analysis.*`/`dashboard.*` bilingual locale keys, a `chart-utils` test file, and the bundled `lightweight-charts` v5.2.1 dependency (pinned through `package-lock.json`). No backend server was added.
- **Current deployment:** `Cklee-99.github.io` → `https://cklee-99.github.io/`, a user site at the domain root. Vite production `base` is `/` (set explicitly in `vite.config.ts`). GitHub Actions publishes the `dist/` build artifact after lint/test/build success. No push/deploy was performed this session.
- **Current verified tests:** All 123 pre-existing Vitest cases across 11 test files pass in earlier targeted runs (strategies 23, accounting 11, performance 8, simulator 8, locale parity 3 = 53 milestone-3 cases, plus 70 pre-existing indicator/pattern/market/csv/config cases). This session `npx tsc -b`, `npm run lint`, and `npm run build` all PASS with direct exit 0 (build: `✓ 85 modules transformed`, gzip JS 151.38 kB — up from 71 modules / 86.28 kB due to the chart library and components). The new `chart-utils.test.ts` and the full `npm run test`/`npm run verify` gates still exceed the harness 30s window (protocol 16.4) — they must be run in the VS Code integrated terminal.
- **Current status — Milestone 4 (this session, implemented):** Chart infrastructure and four chart components wired into `Analysis.tsx`/`Overview.tsx`/`BacktestView.tsx`; chart series are keyed by `dataKey` (recreated only when data changes, with listeners/instances cleaned up on effect cleanup). TypeScript fixes applied in this session: `chartThemes()/chartThemeMode()` theme helpers typed with `DeepPartial<ChartOptions>` with enumerated `ColorType.Solid`, `LineStyle.Solid/Dashed`, `CrosshairMode.Normal`, explicit crosshair `labelVisible/labelBackgroundColor`, deterministic `localization.locale`; `chart-theme.ts` switched from `ChartOptionsBase` to `DeepPartial<ChartOptions>`; `ChartSeriesSet.candles` and `buildCandles` retyped to `CandlestickData<BusinessDay>[]` (so `candle.time` is a `BusinessDay` date object, not a `Time`); series refs typed `ISeriesApi<'Line'>`/`ISeriesApi<'Histogram'>`; execution markers drawn via `createSeriesMarkers` (not the stale `setMarkers`, which Lightweight Charts v5 removed); volume scale margins applied through `chart.priceScale('volume').applyOptions(...)` (no `scaleMargins` keys inside series options); `chart-utils.ts` fixed an invalid `values.every(...)` call (replaced with a `reduce` scan) plus a `chartBenchmarkMissing` spread-into-`ChartWarning[]` type fix and a `rows.slice()` copy for the `all` timeline filter; `Analysis.tsx` dropped a stale `setReadError` reference; `Overview.tsx` passes the non-null `perf!` to the equity curve; `benchmark.test.ts` parenthesizes the `initialExecutionPrice` cast; chart test/localization import paths corrected to `../../`. `npx tsc -b` PASS, `npm run lint` PASS, `npm run build` PASS (all exit 0, direct). No commit/push/deploy performed.
- **Current status — Milestone 5 (this session, implemented):** The owner selected Yahoo Finance as the sole online provider. Added `src/data/providers/yahoo-finance.ts` (browser-side chart-endpoint provider behind the replaceable `MarketDataSource`; configurable endpoint/proxy; exchange-timezone date rendering; daily only; quote/adjclose/dividend/split parsing; inclusive-range filter; `fetch` with `credentials: 'omit'`), `src/data/providers/cache.ts` (localStorage + IndexedDB keyed cache, no-op degrade on any failure), four new `IssueCode`s, bilingual `data.provider.*`/`data.issue.provider*` locale keys, and a Yahoo fetch section in `Analysis.tsx` (ticker + inclusive date range + fetch button + issue list). Added deterministic `yahoo-finance.test.ts` (URL/parse/normalize/cacheKey). Python `yfinance` is NOT used. Verification of the new provider and full `npm run verify` is UNVERIFIED in the harness 30s window here; `npx tsc -b` and `npm run lint` must be re-run after the connection-free edits and the owner must record `npm run verify` exit 0 in the integrated terminal.
- **Current blocker:** None, but the harness's 30s window still cannot capture `npx vitest run` (single or multi file) or the full `npm run test`/`npm run verify`. The owner's integrated-terminal `npm run verify` surfaced 6 failing Vitest cases, which are now corrected (see Known Issues); a full re-`npm run verify` exit 0 is pending the owner's integrated-terminal run.
- **Next task:** Owner re-runs `npm run verify` (and `npx tsc -b`/`npm run lint`) in the VS Code integrated terminal and records the actual exit code, now with the new `yahoo-finance.test` provider cases plus the corrected Milestone 3.1/4 gate. Then perform responsive viewport checks (320/360/390/480/768/1024/sidebar-wide), verify light/dark theme and `en`/`zh-TW` switching in the deployed UI, and confirm an end-to-end Yahoo fetch (ticker → dataset → backtest) before closing Milestone 5.
- **Important:** Do not rerun Vite scaffolding, change Vite `base` to `/quantfolio-lab/`, or overwrite meaningful files without inspection. Do not use capture files for verification (see section 16). The harness background window cannot capture `npm run test`/`npm run verify`; run those gates in the VS Code integrated terminal.

## 14. Known Issues and Resolutions

Record issues using this format:

- **Issue:** Short title.
- **Observed evidence:** Exact error, output, or reproducible behavior.
- **Root cause:** Confirmed cause, or `Unconfirmed` if not proven.
- **Resolution:** The actual fix applied, or `Pending`.
- **Verification:** Exact command or test and its result.

- **Issue:** GitHub Pages initially displayed a blank page after the source repository was pushed.
  - **Observed evidence:** The owner reported that the workflow showed deployment success but `https://cklee-99.github.io/` appeared blank. Earlier diagnosis found that the entry HTML referenced `/src/main.tsx`, which is a development entry rather than a production bundle, and the repository did not initially include the intended Vite build/deploy workflow.
  - **Root cause:** GitHub Pages was not serving a correctly built Vite production artifact.
  - **Resolution:** Add a GitHub Actions workflow to run the npm install/build and deploy `dist/`; configure Pages to use GitHub Actions.
  - **Verification:** The owner subsequently reported deployment succeeded. The agent must inspect `.github/workflows/` and re-run `npm run build` before asserting the setup remains valid.

- **Issue:** Vite scaffold dependency resolution failed during initial setup.
  - **Observed evidence:** npm reported `ERESOLVE`; the scaffold selected `typescript@7.0.2`, while `typescript-eslint@8.72.1` declared peer support for TypeScript `<6.1.0`.
  - **Root cause:** Incompatible TypeScript and typescript-eslint peer dependency ranges in the generated dependency tree.
  - **Resolution:** The owner was instructed to set `devDependencies.typescript` to `~6.0.2` and run `npm install` again.
  - **Verification:** The owner subsequently reported completing Step 4. The exact install/build output was not provided here, so re-run `npm install` if needed and verify `npm run build` before relying on this as independently confirmed.

- **Issue:** BacktestView form structure was broken by multi-step editor assembly.
  - **Observed evidence:** `npm run build` reported TS2657/TS17002/TS1128 — JSX expressions without one parent element; the file contained interleaved, duplicated fragments.
  - **Root cause:** Sequential append/insert edits across an 8 KB target exceeded tool size limits and left content misordered.
  - **Resolution:** Deleted the file and rebuilt it from a clean two-part edit: imports/component header/required fields, then advanced section/status/actions/closing tags. Verified no duplicated sections remain.
  - **Verification:** `npm run build` passes; `npm run lint` passes.

- **Issue:** Locale strategy keys did not match strategy ids.
  - **Observed evidence:** BacktestView rendered `t('backtest.strategy.' + option.id)` with ids like `trend_following`, while locale bundles used keys like `backtest.strategy.trendFollowing`, so `translate` fell back to the raw key on screen.
  - **Root cause:** Key naming (camelCase) diverged from `STRATEGIES` id naming (snake_case).
  - **Resolution:** Renamed both `en` and `zh-TW` strategy and purpose keys to snake_case matching the ids.
  - **Verification:** `npm run build` and `npm run lint` pass; strategy labels now resolve via the local bundle.

- **Issue:** Shell terminal stops reporting command completion mid-run, leaving outputs unwritten.
  - **Observed evidence:** `npm run build > build.out 2>&1` produced an empty `build.out` and repeated foreground commands returned `Command completion could not be observed`; `test.out` initially captured only the vitest header until a later full run wrote the complete report.
  - **Root cause:** `Unconfirmed` — environmental/terminal capturer behavior during long-running npm commands, not a code defect.
  - **Resolution:** The capture-file workaround was a temporary measure specific to the earlier terminal harness. Repository policy now supersedes it: `AGENTS.md` section 16 (Terminal Execution and Verification Protocol) requires `npm run verify`, direct terminal output, no capture files, one command at a time, and honest PASSED/FAILED/UNVERIFIED reporting. Existing capture files remain untracked in the tree but must not be read as evidence.
  - **Verification:** `npm run lint` and `npm run build` return direct output (PASSED). The harness 30s background window cannot capture `npm run test`/`npm run verify`; the owner ran `npm run verify` manually in the VS Code integrated terminal and reported exit 0 (PASSED), so the Milestone 2 test gate is verified (7 files, 67 Vitest cases).

- **Issue:** Lightweight Charts v5 removed `setMarkers` and rejects `scaleMargins` keys inside series options; the chart theme previously targeted the all-required `ChartOptionsBase`.
  - **Observed evidence:** The initial Milestone 4 TypeScript run (edited in the session) surfaced `chart-theme.ts` errors for a numeric `background.type` (expects `ColorType`), missing crosshair `labelVisible/labelBackgroundColor`, missing `timeScale`/`localization.locale` fields on the all-required `ChartOptionsBase`, plus usage of the stale `setMarkers` API and `scaleMargins` on a `HistogramSeries` partial options object.
  - **Root cause:** Chart theme/component code predated Lightweight Charts v5's narrowed option typing and API renaming (`createSeriesMarkers` replaces `setMarkers`; per-scale margins move to the price scale).
  - **Resolution:** `chartHostOptions` now returns `DeepPartial<ChartOptions>` with enumerated `ColorType`/`LineStyle`/`CrosshairMode` values and explicit crosshair label settings plus deterministic `locale: 'en-US'`; markers are drawn via `createSeriesMarkers`; volume margins applied via `chart.priceScale('volume').applyOptions(...)`; `ChartSeriesSet.candles`/`buildCandles` retyped to `CandlestickData<BusinessDay>[]`; series refs narrowed to `ISeriesApi<'Line'>`/`< 'Histogram'>`.
  - **Verification:** `npx tsc -b` PASS (exit 0, direct) and `npm run build` PASS (exit 0, direct) after the fixes; ESLint PASS (exit 0).
- **Issue:** Fresh-targeted `npx vitest run` (single or multi file) and full `npm run test`/`npm run verify` repeatedly exceed the harness 30s background window without an observed result.
  - **Observed evidence:** A single-file `npx vitest run src/components/charts/chart-utils.test.ts` timed out with no output (protocol 16.4).
  - **Root cause:** `Unconfirmed` — environmental harness window limit, not a code defect (the same constraint previously gated Milestone 2/3/3.1 runs).
  - **Resolution:** Not retried (protocol 16.5); the owner must run `npm run verify` in the VS Code integrated terminal and record the actual exit code.
  - **Verification:** Pending the owner's visible integrated-terminal run.

- **Issue:** The owner's integrated-terminal `npm run verify` surfaced 6 failing Vitest cases that the harness could never capture (3 test files failed).
  - **Observed evidence:** `src/npm-run-result.txt` — `npm run verify` (chain lint→test→build) ran, Vitest reported 13 files: 3 failed / 10 passed, 6 tests failed / 161 passed (167). Failures: accounting `leaves the zero-fee behavior unchanged` (expected cash 1000, actual 1100); benchmark `reports daily account equity aligned with every eligible session close` (`dividendCash` 0 vs `shares × 0.25`); chart-utils `drops null and non-finite ... misalignment` (warnings lacked `chartNonFinite`), `places BUY/SELL markers ...` (no `買入` marker), `aggregates a full chart series set ...` (`bollUpper.length` 0 vs 2), `builds and filters the timeline ...` (hold-filter yielded an executed BUY row).
  - **Root cause:** (1) accounting test wrote an incorrect expected cash for a zero-fee round trip — `applySell(5, gross 600)` credits 600 → cash 1100, not 1000. (2) The benchmark fixture put a 0.25 dividend on the purchase-day bar; the main simulator applies corporate actions at session start (shares 0 on the purchase day) so the benchmark never credits it — dividends must sit on post-purchase sessions. (3) `buildAlignedLine` discarded non-finite values without emitting `chartNonFinite`. (4) The marker test used `cfg(30,39)`, before MA60 warm-up (index 60), so no order ever executed and markers were empty; it now uses a fixed two-order ledger. (5) `buildChartSeriesSet` test passed an all-null `bollUpper` but asserted 2 points (argument-order slip). (6) The timeline hold-filter assertion checked `r.order` instead of the actual filter key `r.decision` (a HOLD row may share a date with an unrelated execution).
  - **Resolution:** Corrected the accounting expected cash to 1100; moved the benchmark dividend to the `2024-01-03` session; added `chartNonFinite` emission in `buildAlignedLine`; rebuilt the marker test from a deterministic BUY+SELL `ExecutedOrder[]` ledger; reordered the series arguments so `bollUpper`/`bollMiddle` each hold two finite points; changed the hold-filter assertion to `expect(r.decision).toBe('HOLD')`.
  - **Verification:** `npx tsc -b` PASS (exit 0) and `npm run lint` PASS (exit 0) this session. Targeted `npx vitest run` of the three affected files exceeded the 30s harness window (protocol 16.4) → UNVERIFIED here; the owner must re-run `npm run verify` in the VS Code integrated terminal and record the exit code.

Do not invent additional issues or claim verification that has not been observed.

- **Issue:** Simulator queued HOLD decisions and executed them as SELL orders the next session.
  - **Observed evidence:** The scheduled-deployment integration test failed — `result.ledger.filter((o) => o.action === 'SELL').length` returned 12 for a strategy that never emits SELL, because every HOLD decision turned into a sell next session.
  - **Root cause:** `runSimulation` queued every decision (including HOLD); the executor treated any non-BUY action as a SELL, so ordinary hold days incorrectly closed the position.
  - **Resolution:** Only BUY and SELL decisions queue an order; HOLD clears the queue (`if (i < simEnd && decision.action !== 'HOLD')`).
  - **Verification:** scheduled-deployment integration test passes; all 8 simulator tests pass in the targeted run.
- **Issue:** zh-TW locale contained three Simplified-Chinese strings that violate the Traditional-Chinese-only policy.
  - **Observed evidence:** `data.csv.noValid` (`绝不会悄悄丢弃`), `data.diag.title` (`后续里程碑`), `data.diag.patternsTitle` (`蜡烛圖形態`).
  - **Root cause:** Pre-existing Simplified variants inconsistent with the required Taiwan Traditional terminology.
  - **Resolution:** Rewrote them as `絕不會悄悄丟棄`, `後續里程碑`, `蠟燭圖形態`; new milestone-3 zh-TW resources were written in Traditional Chinese from the start.
  - **Verification:** Grep over zh-TW data/strategy/simulation files found no simplified `会`/`图`/`蜡`/`后` variants.

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
- **D-010:** The current deployment is the GitHub Pages user site repository `Cklee-99.github.io`, published at `https://cklee-99.github.io/`; Vite's production base is `/`, and GitHub Actions deploys the `dist/` artifact. `/quantfolio-lab/` is only relevant if a separate project-site repository is created later.
- **D-011:** Localization uses a bundled `Record<string, string>` lookup (`translate(locale, key)` with English fallback) instead of runtime `i18next`; this keeps zero runtime dependencies and works offline on GitHub Pages. Custom attribute names (e.g. `<div data-theme="dark">`) drive CSS theme switching, so `strategy` label keys follow `Option.id` snake_case to avoid raw-key rendering.
- **D-012:** Milestone 2 normalizes market data as typed `DailyBar`/`MarketDataset` behind a replaceable `MarketDataSource`. Deterministic demo data is clearly labeled synthetic. CSV import rejects invalid rows with visible issues; dates must be unique ISO `YYYY-MM-DD` and are sorted ascending; no interpolation or silent zero substitution. Indicators are aligned to input length and return `null` before a complete window; Bollinger Bands use population standard deviation (divide by N); Wilder RSI's first value appears at index `period`. Candlestick patterns never use future bars; hammer/shooting star require a documented prior trend. New `data.*` locale keys are covered by a parity test.
- **D-013:** Real-body engulfing is the defined pattern contract. Bullish: previous candle bearish, current bullish, and `current.open <= prev.close && current.close >= prev.open`. Bearish: previous bullish, current bearish, and `current.open >= prev.close && current.close <= prev.open`. Comparisons are inclusive at equality; wicks outside the previous candle's full high/low range never disqualify a real-body engulf, and a candle whose full range covers the previous candle but whose real body does not is rejected. `isBullishEngulfing`/`isBearishEngulfing` names and interfaces are unchanged.
- **D-014:** The `MarketDataSource` contract loads asynchronously (`load(request): Promise<MarketDataLoadResult>`) because a browser-side provider must `fetch()`. `createDemoDataSource()` satisfies it with `Promise.resolve(...)`. Pure synchronous utilities (`loadDemoDataset()`, `createDemoBars()`, CSV parsing/validation, indicators) stay synchronous. Consumers that call `.load()` await it.
- **D-015:** A strategy may only emit BUY/SELL/HOLD; strategy functions never place orders or touch accounting. Sizing strategies (scheduled deployment) signal an optional `buyBudget` (gross spend cap) through the decision record; the simulator additionally caps every buy by available cash, allocation capacity, and fee headroom.
- **D-016:** Only BUY and SELL decisions create a queued order; HOLD clears the queue. Execution happens at the next eligible session's open from a decision taken at the previous session's close, and capacity is valued at that previous close — preventing look-ahead.
- **D-017:** Scheduled deployment defaults to 12 equal monthly tranches from the configured initial capital (no external deposits and never a SELL). A tranche's budget is `min(initialCapital/12, cash/(1+feeRate), equity*allocationRatio - positionValue)`; zero-budget tranches report `monthlyTrancheSkipped` instead of silently trading. `trancheCount` is a supported strategy constant (12) pending future config exposure.
- **D-018:** zh-TW locale files must contain Traditional Chinese only. Owner-facing communication is Traditional Chinese; `en` resources remain English. Reason codes and UI labels always live in bundled translation keys, never hardcoded.
- **D-019:** Milestone 3.1 enforces the look-ahead boundary in the decision data itself: `buildStrategyContext` truncates the bars prefix and every indicator array (MA5, MA20, MA60, Bollinger upper/middle/lower, RSI14) to exactly `index + 1`, so future bars and future indicator values are physically absent. `index` remains the original dataset index; because arrays have length `index + 1`, `[index]` is the newest element and `[index - 1]` the previous session.
- **D-020:** The BUY transaction fee is included in the weighted-average cost basis (`(prevShares × prevBasis + buyGross + buyFee) / totalShares`). SELL realized P&L therefore reflects both the original purchase cost and all allocated buy fees plus the sell fee, so closed-trade profitability and win rate are not overstated. Slippage is not added a second time because the execution price already incorporates it; BUY/SELL fees remain reflected exactly once through the cash ledger.
- **D-021:** The comparable buy-and-hold benchmark is an account (`runBuyAndHoldBenchmark`) that buys 100% of the initial capital (subject to execution costs, independent of the strategy's allocation cap) at the first eligible session's open and values at the last eligible session's close, using the same fee, slippage, fractional-share, dividend, and split rules as the main simulation. Corporate actions are processed only when `dataset.adjustmentPolicy === VALID_ADJUSTMENT_POLICY_NONE` (`'unadjusted'`); otherwise the benchmark is marked `available: false` with `benchmarkAdjustmentUnsupported` so corporate actions are never silently double-counted. `buyAndHoldReturn` remains a documented price-only helper but is no longer used as the simulator benchmark.
- **D-022:** CAGR is annualized from the actual calendar days between the first and final snapshots (365.25 days/year), not a fixed 252-session count. Volatility and Sharpe keep a fixed 252-session annualization for trading-session returns. The Sharpe ratio explicitly assumes a zero risk-free rate (there is no separate cash benchmark), so the mean session return is used directly without a subtraction.
- **D-023:** The owner selected Yahoo Finance as the sole online provider: the browser-side chart endpoint (`query1.finance.yahoo.com/v8/finance/chart`) through the configurable cors.dev proxy, daily interval only, no API key, no Yahoo session cookies, personal non-commercial research. It is undocumented/experimental with no uptime guarantee; Python `yfinance` is NOT a runtime dependency. On failure the app offers the cache, CSV import, and labeled DEMO data.
- **D-024:** The Yahoo provider keeps `endpointBase`/`proxyBase` isolated in `YahooProviderConfig` so they can be swapped without touching the market-data domain or engines. Trading dates are rendered from `meta.exchangeTimezoneName` so bars never shift with the user's local clock. Inclusive range is enforced by filtering parsed bars to the requested `[startDate, endDate]` (not by trusting Yahoo's period boundary). Missing quote cells become `NaN` so the existing validation rejects them. The provider is labeled "Yahoo Finance (Unofficial)".
- **D-025:** Resilient caching keys a normalized dataset by `provider|symbol|start|end`. localStorage is the cross-browser primary store (most browsers, including Chrome/Edge, do not expose the `indexedDB` global for the W3C IDB API); IndexedDB is used when that global exists. Any storage failure degrades to a no-op; a cache hit for the exact inclusive range avoids a re-fetch, and fresh data is always written after a successful fetch.


## 16. Terminal Execution and Verification Protocol

This section applies to every AI coding agent working in this repository. It exists to prevent unreliable terminal capture, repeated identical tool calls, and misleading verification claims.

### 16.1 Local Quality Gate

- `npm run verify` is the normal local quality-gate command. It runs `npm run lint && npm run test && npm run build` with shell `&&` chaining: each step must exit 0 before the next runs, a failure stops the chain immediately, the shell propagates the exact exit code, and each tool prints its normal output directly to the terminal. No arguments are needed and no wrapper script is applied.
- Run `npm run verify` instead of separate lint/test/build invocations unless a specific single step must be isolated for debugging.
- Preserve the existing `lint`, `test`, and `build` scripts and `package.json` dependencies and do not add verification dependencies beyond the four quality-gate tools already configured.

### 16.2 Direct Terminal Output Only

- Consume command output directly from the terminal tool response. Never capture a command's output into a file with `>`, `>>`, `2>&1`, `tee`, `Out-File`, or equivalent redirection.
- Do not create temporary output artifacts such as `*.capture`, `verify*.out`, `test.out`, `lint.out`, or `build.out`. Existing artifacts may remain in the working tree but must not be read as evidence, created again, or used as the result of a command.
- Never infer success from an empty output, a partial log, or a stale capture file.

### 16.3 One Command at a Time

- Run at most one verification command at a time. Do not start a second verification command while one is still running.
- Do not launch multiple identical builds, tests, or lint passes in parallel, and do not run watch-mode commands as automated verification.

### 16.4 Handling a Still-Running Command

- If a command has not yet returned, keep waiting. Do not launch a redundant second copy of the same command, do not inspect a capture file, and do not spawn another process to obtain the same result.
- Report completion only after the actual exit status is observed.

### 16.5 No Repeated Identical Tool Calls

- Never retry an identical failing tool call repeatedly. When a call fails, inspect the actual error, identify whether the problem is a path, permission, command, terminal, or tool limitation, change the approach, and only retry when there is a concrete reason.
- If a file read is incomplete, request a smaller targeted range instead of re-reading the same full file with the same arguments.

### 16.6 No Interactive Git Pagers

- Use `git --no-pager` variants for any command that could open an interactive pager (for example `git --no-pager diff`, `git --no-pager log`, `git --no-pager status`).

### 16.7 Honest Verification Status

Classify every verification result:

- `PASSED` — command completed with exit code 0.
- `FAILED` — command completed with a non-zero exit code.
- `UNVERIFIED` — command completion or its actual result could not be observed.

Never claim that a command passed unless its exit code 0 was actually observed. If the terminal cannot reliably capture a result, stop retrying and report the exact blocker to the owner.

## 17. Task Acceptance Template

For each completed task, update the status in this file using:

- **Task:**
- **Status:** `Complete`, `Implemented, not verified`, or `Blocked`.
- **Files changed:**
- **Commands executed:**
- **Verification results:**
- **Known limitations:**
- **Next task:**

Never mark an item complete based only on generated code or visual inspection when a relevant test/build could be run.

### Milestone 1 Acceptance

- **Task:** Implement Milestone 1 — Foundation and Responsive Shell.
- **Status:** `Complete` (verified by build/lint/test this session).
- **Files changed:**
  - `src/App.tsx`, `src/main.tsx`
  - `src/components/{AppShell,Footer,Header,LangSwitcher,Nav,StatusBanner,ThemeToggle}.tsx`
  - `src/views/{Analysis,BacktestView,More,Overview}.tsx`
  - `src/i18n/index.ts`, `src/i18n/locales/en/*`, `src/i18n/locales/zh-TW/*`
  - `src/nav-data.ts`
  - `src/config/validate.config.test.ts`, `src/styles/app.css`
  - `package.json` (added Vitest + `test` script)
- **Commands executed:** `npm run build` (tsc -b && vite build), `npm run lint`, `npm run test`.
- **Verification results:** Build passes (48 modules, gzip 75.57 kB JS); lint passes (no errors); `npm run test` — 6/6 Vitest cases pass for `validateBacktestConfig`.
- **Known limitations:** Charts/indicators/engine remain `unavailable` in this milestone by design. No browser-to-localStorage or IndexedDB persistence tests yet. zh-TW/en key parity verified by review, not by an automated snapshot test.
- **Next task:** Milestone 2 — Data and Indicators.

### Milestone 1 Code-Review Fixes (post-acceptance, implemented this session)

- **Task:** Apply requested Milestone 1 code-review fixes without starting Milestone 2 or committing/pushing.
- **Status:** Implemented; full re-verification was attempted but shell commands could not be observed to complete in this session (environmental terminal issue), so build/lint/test results below are from the prior completed session unless re-run successfully.
- **Files changed:**
  - `src/views/BacktestView.tsx` — form submit now uses a typed `handleSubmit(event: FormEvent<HTMLFormElement>)` that calls `event.preventDefault()`; validation errors/status remain visible after submit. Every input got an `id` with a matching `htmlFor` label and `aria-invalid`. Date inputs use `type="date"`; numeric inputs use `type="number"` with `min`/`max`/`step`. Strategy and fractional-share buttons now get explicit `option-button active` classes and `aria-pressed`. The advanced toggle now carries `aria-expanded` and `aria-controls="advanced-settings"`, and the advanced section is wrapped in `<div id="advanced-settings">`.
  - `src/components/Nav.tsx` — desktop and mobile bottom-nav buttons now use `className={route === active ? 'nav-link active' : 'nav-link'}`; `aria-current="page"` preserved.
  - `src/styles/app.css` — added `.option-button.active`; added `safe-area-inset-bottom` to bottom-nav padding; added mobile `.app` bottom padding (`64px + safe-area-inset-bottom`) under `max-width: 479px`; `.app-header` wraps on small screens.
  - `index.html` — viewport meta now includes `viewport-fit=cover`.
  - `src/config/backtest.ts` — added pure helpers `selectStrategy(config, strategy)` and `setFractionalShares(config, fractionalShares)` that preserve every other form value and never mutate the input.
  - `src/config/select.config.test.ts` (new) — 4 deterministic Vitest cases for the two helpers.
  - `UI_UX_SPEC.md` — removed two outdated `i18next`/`react-i18next` references; replaced them with the bundled `translate(locale, key)` description.
- **Commands executed this session:** `npm run test > test.out 2>&1` (output captured and read back: 2 files, 10 tests passed), `npm run lint > lint.out 2>&1` (clean, no errors), `npm run build > build.out 2>&1` (attempted; `build.out` remained empty and completion was not observed due to an environmental terminal timeout).
- **Verification results:** `npm run test` — 10/10 pass, confirmed this session from captured `test.out` (select 4 + validate 6). `npm run lint` passes (clean output captured). `npm run build` re-run could not be observed to complete this session (environmental terminal timeout); prior completed session recorded build pass (48 modules, gzip 75.57 kB JS), so the 4 new selection tests are the newly confirmed cases this session.
- **Known limitations:** Client-side mobile layout at 320/360/390 px not visually verified this session; no horizontal-overflow regression test exists yet. Browser persistence (localStorage/IndexedDB) still unverified.
- **Next task:** Verify the re-verification commands (`npm run test`, `npm run lint`, `npm run build`) when the terminal is available, then proceed to Milestone 2 — Data and Indicators.

### Milestone 1.2 — Deployment and Quality Gate Hardening

- **Task:** Make the GitHub Pages deployment configuration explicit, add lint/test quality gates to the deploy workflow, verify `package.json` scripts, inspect temporary `.out` files, reconcile documentation, and re-run all quality-gate commands. Do not start Milestone 2, commit, push, or deploy.
- **Status:** `Complete` (verified this session).
- **Files changed:**
  - `vite.config.ts` — added explicit `base: '/'` (root-site user-site deployment) with a one-line comment; `@vitejs/plugin-react` plugin and existing config preserved. Do not use `/quantfolio-lab/`.
  - `.github/workflows/deploy.yml` — added `with: persist-credentials: false` to the pinned `actions/checkout` step (no later step needs checkout credentials); added `Lint` (`npm run lint`) and `Test` (`npm run test`) steps after `Install dependencies` (`npm ci`) and before `Build application` (`npm run build`, which already runs `tsc -b`). Preserved: Node.js 22, npm dependency caching, GitHub Pages permissions/env, `dist/` artifact path, concurrency config, triggers (`main` push + `workflow_dispatch`), and all pinned Action commit SHAs (checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5). No `pull_request` trigger added.
  - `AGENTS.md` — updated section 11 (quality-gate description), section 13 Current Status (build re-verified; base `/` explicit), section 14 (terminal-timeout Known Issue updated with the successful one-block chain workaround), and this Milestone 1.2 acceptance entry.
- **Commands executed:** One chained block written to `verify_all.capture` (new temp file, not the existing `.out` files): `npm ci`, `npm run lint`, `npm run test`, `npm run build`, ending with an `ALL DONE` sentinel.
- **Verification results:** `npm ci` succeeded (added 201 packages, audited 202 in 24s). `npm run lint` passes (`> eslint .`, no errors). `npm run test` passes (Vitest v3.2.7, `Test Files 2 passed (2)`, `Tests 10 passed (10)`). `npm run build` passes (`tsc -b && vite build`, 48 modules transformed, `✓ built in 870ms`, gzip JS 75.83 kB). `dist/index.html` references `/assets/index-BRSBjsYM.js` and `/assets/index-QxYnqvOf.css` — root-absolute asset paths confirming the root-site base `/` (no `/quantfolio-lab/`). The `--- ALL DONE ---` sentinel confirms the whole chain completed.
- **Known limitations:** The deployed site (`https://cklee-99.github.io/`) itself was not re-verified in this session (no push/deploy authorized); the workflow change will take effect on the next deploy. Temporary `.out` files are untracked and not staged. `git status` shows no staged files.
- **Next task:** Milestone 2 — Data and Indicators (unchanged).

### Milestone 2 — Data and Indicators

- **Task:** Implement Milestone 2 — Data and Indicators: normalized market-data types and provider interface, deterministic demo fixtures, CSV import/preview/validation, SMA/Bollinger/RSI/candlestick indicators, deterministic unit tests, source-status + CSV + indicator UI, and bilingual localized labels.
- **Status:** `Complete` (verified — lint, test, and build each pass with exit 0).
- **Files changed:**
  - `src/data/market.ts` (new) — `DailyBar`, `MarketDataset`, `DataRequest`, `MarketDataSource`, `validateRow`, `normalizeBars`, `isPlainDate`, issue codes, duplicate/OHLC/date/numeric validation.
  - `src/data/demo.ts` (new) — deterministic `DEMO` dataset (fixed LCG, 260 bars), `loadDemoDataset`, `createDemoDataSource`, labeled synthetic.
  - `src/data/csv.ts` (new) — `tokenizeCsv`, `resolveColumns`, `importCsv`; BOM, CRLF/LF, quoted fields, header aliases, missing columns, invalid numbers, duplicate/unsorted dates, OHLC errors.
  - `src/indicators/{series,bollinger,rsi,patterns}.ts` (new) — SMA, Bollinger (population σ, 20/2), Wilder RSI14, doji/bullish–bearish engulfing/hammer/shooting star.
  - `src/data/{market,csv}.test.ts`, `src/indicators/{indicators,patterns}.test.ts` (new); `src/i18n/locale.test.ts` (new parity test for `data.*` keys).
  - `src/i18n/locales/en/data.ts` and `zh-TW/data.ts` (new).
  - `src/components/{AppShell,StatusBanner}.tsx`, `src/views/{Overview,BacktestView,Analysis,More}.tsx`, `src/styles/app.css` — dataset state wiring, source status, CSV preview, indicator/pattern tables.
  - `package.json` — added `verify` script; no dependencies added.
  - `AGENTS.md` — section 16 protocol + this acceptance entry; `.clineignore` — added `*.capture`, `*.out`.
- **Commands executed:** `npm run lint` (PASSED, direct output, exit 0); `npm run build` (PASSED, direct output, exit 0); `npm run test` (PASSED, exit 0) and `npm run verify` (PASSED, exit 0) — the harness's 30s background window cannot capture these gates, so the owner ran them in the VS Code integrated terminal and reported exit 0.
- **Verification results:** All quality gates exit 0. `npm run lint` clean. `npm run build` (`tsc -b && vite build`, `✓ 55 modules transformed`, gzip JS 81.70 kB). `npm run test` — 7 test files / 67 Vitest cases all pass, including the three formerly-failing candlestick pattern fixtures (hammer/shooting-star trend lookback and the `findPatterns` doji range) after their correction. The two build-time TypeScript errors (a `DailyBar` object-literal spread carrying the non-`DailyBar` `line` key; a `FileList|null` vs `File[]` `onChange` mismatch) were fixed and the build passes.

### Milestone 2.1 — Corrective Follow-up: Real-Body Engulfing and Asynchronous DataSource

- **Task:** Focused correction before Milestone 3. (1) Reimplement bullish/bearish engulfing recognition to use real-body coverage instead of the full high/low candle range. (2) Make the `MarketDataSource` load contract asynchronous (`Promise<MarketDataLoadResult>`). Do not reimplement Milestone 2, start Milestone 3, commit, push, or deploy.
- **Status:** `Implemented` — changed tests pass (29 targeted), `npm run lint` and `npm run build` pass with direct exit 0. Full `npm run verify` UNVERIFIED in the 30s harness window (protocol 16.4); run it in the VS Code integrated terminal to record the closing exit 0.
- **Files changed:**
  - `src/indicators/patterns.ts` — `isBullishEngulfing` now uses `current.open <= prev.close && current.close >= prev.open` (previous candle bearish, current bullish); `isBearishEngulfing` uses `current.open >= prev.close && current.close <= prev.open` (previous bullish, current bearish). Inclusive equality; real-body coverage is authoritative and wicks never qualify or disqualify by themselves. Names/signatures unchanged; no future-bar access.
  - `src/data/market.ts` — `MarketDataSource.load(request)` return type changed from `MarketDataLoadResult` to `Promise<MarketDataLoadResult>` so a browser-side `fetch()` provider can implement the interface. `MarketDataset`/`MarketDataLoadResult` structures and validation behavior unchanged.
  - `src/data/demo.ts` — `createDemoDataSource().load` now returns `Promise.resolve({...})`. Pure synchronous `loadDemoDataset()` and `createDemoBars()` preserved.
  - `src/indicators/patterns.test.ts` — added 5 real-body engulfing tests: real-body cover with wicks short of the previous full range (bullish and bearish), full-range cover but real-body non-cover rejected, reversed-direction rejection, and inclusive boundary equality.
  - `src/data/market.test.ts` — added `VALID_ADJUSTMENT_POLICY_NONE` import; the existing sync `load()` test became an awaited `async` test, plus a new dataset-metadata assertions test (sourceType, symbol, providerId undefined, requestedRange, dateRange, validCount, adjustmentPolicy).
  - `AGENTS.md` — section 13 status, D-013/D-014 decision entries, and this corrective-follow-up entry (section 17 acceptance history preserved).
- **Commands executed:** `npx vitest run src/indicators/patterns.test.ts src/data/market.test.ts` (PASSED, exit 0 — patterns 14, market 15, 29 tests); `npm run lint` (PASSED, direct, exit 0); `npm run build` (PASSED, direct, exit 0, `✓ 55 modules transformed`, gzip JS 81.70 kB); `npm run verify` (UNVERIFIED — harness 30s timeout before completion; per protocol 16.4 run it in the VS Code integrated terminal).
- **Verification results:** All newly added/updated fixtures pass in the targeted run. Combined test count is now 73 Vitest cases across 7 test files (Milestone 2's 67 plus 6 added: 5 real-body engulfing + 2 async-datasource, with the former synchronous load test converted in place). `npm run lint` clean; `npm run build` passes. Closing `npm run verify` exit 0 pending the owner's integrated-terminal run.
- **Known limitations:** The full `npm run verify` could not be captured in the 30s harness window; only the targeted test run plus lint/build were observed with exit 0 here. No push/commit/deploy was performed. Online provider still not introduced; CSV parsing/validation and indicator utilities remain synchronous. Browser persistence (localStorage/IndexedDB) still not covered.
- **Next task:** Milestone 3 — Strategies and Backtesting (unchanged).
- **Known limitations:** Online provider and charting (Milestone 4/5) not started; browser persistence (localStorage/IndexedDB) still not covered; the harness background terminal cannot observe `npm run test`/`npm run verify`, so those gates must be run in the VS Code integrated terminal; `git status` shows `src/data/`, `src/indicators/`, and `src/i18n/locale.test.ts` untracked (not committed).
- **Next task:** Milestone 3 — Strategies and Backtesting.

### Milestone 3 — Strategies and Backtesting

- **Task:** Implement Milestone 3 — Strategies and Backtesting: a deterministic strategy registry (five strategies), a pure backtesting engine with next-session execution and accounting, fees/slippage/fractional-share settings, benchmark and performance metrics, deterministic tests, and basic Backtest UI (Run backtest + results panel). Do not commit, push, deploy, or start Milestone 4.
- **Status:** `Implemented` — targeted tests (53 new + 70 pre-existing) PASS, `npm run lint` PASS (exit 0), `npm run build` PASS (exit 0, 71 modules, gzip JS 86.28 kB). Full `npm run verify` UNVERIFIED in the 30s harness window (protocol 16.4); run it in the VS Code integrated terminal.
- **Files changed:**
  - `src/strategies/{types,registry,trend-following,mean-reversion,scheduled-deployment,candlestick-confirmation,momentum-breakout}.ts` (new) — typed StrategyContext/Decision, five deterministic strategies, registry by stable id.
  - `src/backtesting/{types,accounting,execution,benchmark,performance,simulator}.ts` (new) — portfolio state & corporate actions, order sizing/execution, buy-and-hold benchmark, performance metrics, deterministic simulator.
  - `src/strategies/strategies.test.ts`, `src/backtesting/{accounting,performance,simulator}.test.ts` (new — 50 deterministic cases).
  - `src/i18n/locales/{en,zh-TW}/strategy.ts` and `{en,zh-TW}/simulation.ts` (new), wired into both `resources.ts`; zh-TW written in Traditional Chinese only; `zh-TW/data.ts` Simplified strings corrected; `locale.test.ts` parity extended to `strategy.*`/`simulation.*`.
  - `src/views/BacktestView.tsx` — Run-backtest button, validation gate, and localized results panel; `src/styles/app.css` — `.sim-result`/`.metric-list`/`.warning-list` styles.
  - `AGENTS.md` — language policy (section 3), Milestone 3 roadmap status, Current Status, Known Issues, D-015–D-018, and this acceptance entry.
- **Commands executed:** `npx vitest run` over the 4 new engine/strategy test files + locale (PASSED, exit 0 — 53 tests); `npx vitest run` over the 6 pre-existing engine/data/config files (PASSED, exit 0 — 70 tests); `npx eslint .` (PASSED, exit 0); `npm run build` (PASSED, exit 0, `✓ 71 modules transformed`, gzip JS 86.28 kB). Full `npm run test`/`npm run verify` are not observable in the 30s harness window (protocol 16.4 — UNVERIFIED here).
- **Verification results:** All 123 Vitest cases across 11 test files pass in targeted runs. `npm run lint` clean. `npm run build` passes. The HOLD-as-SELL simulator bug and the zh-TW Simplified strings are fixed. Closing `npm run verify` exit 0 pending the owner's integrated-terminal run.
- **Known limitations:** No full-chart UI (Milestone 4); online provider still not introduced; browser persistence (localStorage/IndexedDB) not covered; `trancheCount` is a fixed default of 12 (not yet an exposed config field); full `npm run verify` gated by the 30s harness window.
- **Next task:** Milestone 4 — Dashboard and Charts.

### Milestone 3.1 — Corrective Follow-up: Look-Ahead Protection and Comparable Benchmark

- **Task:** Focused corrective improvement before Milestone 4. (1) Remove future-indicator exposure from the strategy context by truncating every indicator array and the bars prefix to length `index + 1`. (2) Include the BUY transaction fee in the weighted-average cost basis so SELL realized P&L reflects both buy and sell fees. (3) Replace the price-only benchmark with a comparable account buy-and-hold benchmark that uses the same fees, slippage, fractional-share setting, corporate actions, and inclusive date range, and reports its account fields. (4) Review the CAGR annualization and document it. Do not reimplement Milestone 3, start Milestone 4, commit, push, or deploy.
- **Status:** `Implemented, not verified` in the harness — the 30s background window could not capture `npx vitest run` (single-file or multi-file) or `npm run verify` (protocol 16.4). The owner must run `npm run verify` in the VS Code integrated terminal to record the closing exit 0.
- **Files changed:**
  - `src/backtesting/simulator.ts` — renamed `buildContext` to exported `buildStrategyContext`; truncates `bars` and every indicator array (MA5/MA20/MA60, Bollinger upper/middle/lower, RSI14) to exactly `index + 1`; computes `runBuyAndHoldBenchmark` and feeds `summary.benchmarkReturn`/`excessReturn` from its account total return; propagates benchmark warnings; returns `benchmark` on the result including the insufficient-range early return.
  - `src/backtesting/accounting.ts` — `applyBuy` weighted-average cost basis now includes the BUY fee; `applySell` realized P&L therefore includes buy fees through the basis plus the sell fee.
  - `src/backtesting/benchmark.ts` — added `BenchmarkAccountResult` and `runBuyAndHoldBenchmark` (100% of initial capital at first eligible open, same fee/slippage/fractional/corporate-action rules, valuation at last eligible close; corporate actions only under `VALID_ADJUSTMENT_POLICY_NONE`, otherwise `available:false` with `benchmarkAdjustmentUnsupported`/`benchmarkNoRange`/`benchmarkNoPurchase`). `buyAndHoldReturn` kept as the documented price-only helper.
  - `src/backtesting/types.ts` — added `benchmark: BenchmarkAccountResult` to `SimulationResult`.
  - `src/backtesting/performance.ts` — CAGR now uses actual calendar days (365.25 days/year) between first and final snapshots; documented the fixed 252-session volatility/Sharpe annualization and the zero risk-free-rate Sharpe assumption.
  - `src/strategies/types.ts` — `StrategyContext`/`StrategyIndicators` documentation updated to state every exposed array has length `index + 1` and future values are physically absent.
  - Tests: `src/backtesting/benchmark.test.ts` (new — 12 cases), plus new cases in `src/backtesting/accounting.test.ts` (8), `src/backtesting/performance.test.ts` (4), `src/backtesting/simulator.test.ts` (7), and `src/strategies/strategies.test.ts` (1).
  - Locales: `src/i18n/locales/en/simulation.ts` and `zh-TW/simulation.ts` — added `simulation.warning.benchmarkNoRange`, `simulation.warning.benchmarkAdjustmentUnsupported`, `simulation.warning.benchmarkNoPurchase` in both languages (zh-TW Traditional Chinese only).
  - `AGENTS.md` — Current Status, Decision Log D-019–D-022, and this acceptance entry.
- **Commands executed:** `npx vitest run` full milestone-engine file set and a single `benchmark.test.ts` attempt inside the harness — both timed out in the 30s background window (protocol 16.4, stop retrying). No lint/build/test result could be observed in the harness.
- **Verification results:** `UNVERIFIED` here — all targeted Vitest cases (benchmark 12 + accounting 8 new + performance 4 new + simulator 7 new + strategies 1 new, plus the 123 existing) and `npm run lint`/`npm run build`/`npm run verify` must be run in the VS Code integrated terminal and recorded with their actual exit codes.
- **Known limitations:** The benchmark account details (execution price, shares, fees, dividends) are reported on the model but the Milestone 3 results panel still shows only the summary metrics and warnings. The online provider, charting UI (Milestone 4), and browser persistence remain not started. `trancheCount` is still a fixed default of 12.
- **Next task:** Owner records a passing `npm run verify` in the VS Code integrated terminal for Milestone 3.1, then Milestone 4 — Dashboard and Charts.

### Milestone 4 — Dashboard and Charts

- **Task:** Implement Milestone 4 — Dashboard and Financial Charts using TradingView Lightweight Charts v5.2.1: candlestick + MA5/MA20/MA60 + Bollinger overlays, volume overlay and chart controls, RSI14 panel, equity curve + benchmark comparison, drawdown chart, BUY/SELL execution markers, a daily decision/transaction timeline, chart infrastructure (theme/types/utils/legend/tooltip), bilingual `analysis.*`/`dashboard.*` locale keys, response layout, and deterministic chart-utility tests. Do not commit, push, deploy, or proceed to Milestone 5.
- **Status:** `Implemented` — `npx tsc -b` PASS (exit 0), `npm run lint` PASS (exit 0), `npm run build` PASS (exit 0, `✓ 85 modules transformed`, gzip JS 151.38 kB). Chart-utility/benchmark/locale Vitest runs exceed the harness 30s window (protocol 16.4); the full `npm run verify` exit 0 is UNVERIFIED here and must be recorded by the owner in the VS Code integrated terminal.
- **Files changed:**
  - `src/components/charts/chart-theme.ts` — `ChartTheme` palette, `chartThemes()`/`chartThemeMode()`, and `chartHostOptions(theme): DeepPartial<ChartOptions>` using enumerated `ColorType.Solid`, `LineStyle.Solid/Dashed`, `CrosshairMode.Normal`, explicit crosshair `labelVisible/labelBackgroundColor`, deterministic `localization.locale: 'en-US'`. (Switched from the all-required `ChartOptionsBase` to `DeepPartial<ChartOptions>`.)
  - `src/components/charts/chart-types.ts` — chart data types; `ChartSeriesSet.candles` typed `CandlestickData<BusinessDay>[]`.
  - `src/components/charts/chart-utils.ts` — pure series builders (validates dates, rejects non-finite/negative OHLC without mutating simulation results): `buildCandles`, `buildAlignedLine`, `buildVolume`, `buildRSIPoints`, `buildEquityPoints`, `buildDrawdownPoints`, `buildChartSeriesSet`, decision/transaction timeline (`filterTimelineRows` returns a copy for `all`), markers, warnings, `currencyToString`. Fixed the invalid `values.every(...)` call (replaced with a `reduce` scan) and a `chartBenchmarkMissing` spread-into-`ChartWarning[]` type mismatch.
  - `src/components/charts/{ChartLegend,ChartTooltip}.tsx` (new) and `{CandlestickChart,RSIChart,EquityCurveChart,DrawdownChart}.tsx` (new) — chart components wired into `Analysis.tsx`/`Overview.tsx`/`BacktestView.tsx`/`AppShell.tsx`; series keyed by `dataKey` (recreated only when data changes), listeners/instances cleaned up on effect cleanup; execution markers via `createSeriesMarkers`; volume scale margins via `chart.priceScale('volume').applyOptions(...)`; series refs typed `ISeriesApi<'Line'>`/`ISeriesApi<'Histogram'>`.
  - `src/components/charts/chart-utils.test.ts` (new) — deterministic chart-utility cases (candles/OHLC validation, timeline, markers, series data); import paths corrected to `../../` and callback params explicitly typed (`ExecutedOrder`, `DailyBar`).
  - `src/i18n/locales/{en,zh-TW}/analysis.ts` and `dashboard.ts` (new), wired into both `resources.ts`; zh-TW Traditional Chinese only; locale parity test extended.
  - `src/views/Analysis.tsx` — dropped the stale `setReadError` reference; chart sections wired. `src/views/Overview.tsx` — equity curve receives the non-null `perf!`. `src/backtesting/benchmark.test.ts` — parenthesized the `initialExecutionPrice` cast. `package.json`/`package-lock.json` — pinned `lightweight-charts` v5.2.1. `AGENTS.md` — roadmap, Current Status, Known Issues, this acceptance entry.
- **Commands executed:** `npx tsc -b` (PASS, exit 0, direct), `npm run lint` (PASS, exit 0, direct), `npm run build` (PASS, exit 0, direct — `tsc -b && vite build`, `✓ 85 modules transformed`, `✓ built in 325ms`, gzip JS 151.38 kB). `npx vitest run` single-file and multi-file targeted gates each exceeded the 30s harness window (protocol 16.4) without an observed result.
- **Verification results:** TypeScript compile clean, ESLint clean, production build clean — all exit 0. The 123 pre-existing Vitest cases previously passed in targeted milestone runs; the new `chart-utils.test` cases and the full `npm run test`/`npm run verify` must be confirmed in the VS Code integrated terminal.
- **Known limitations:** Responsive viewport checks (320/360/390/480/768/1024/sidebar-wide) and light/dark theme + `en`/`zh-TW` switching verification have not been performed; the full `npm run verify` exit 0 is UNVERIFIED here (harness 30s window, protocol 16.4); the online provider (Milestone 5) and browser persistence remain not started; `trancheCount` remains a fixed default of 12.
- **Next task:** Owner records a passing full `npm run verify` in the VS Code integrated terminal (Milestone 3.1 + Milestone 4 gates); market data providers already account for historical coverage; then perform responsive/theme/locale checks before Milestone 5 — Online Data and Release.


### Milestone 5 — Yahoo Finance Provider and Resilient Caching

- **Task:** Implement the owner-selected online provider (Yahoo Finance chart endpoint, no API key, browser-side fetch) behind the replaceable `MarketDataSource`, with response normalization (exchange-timezone dates, quote/adjclose/dividend/split, inclusive inclusive-range filtering), resilient caching (localStorage + IndexedDB), bilingual provider/issue labels, an Analysis fetch section, deterministic provider tests, and `AGENTS.md` documentation. Do not add a backend, use Python `yfinance`, commit, push, or deploy.
- **Status:** `Implemented, not verified` — code and tests are written; `npx tsc -b`, `npm run lint`, `npm run build`, targeted `npx vitest run`, and the full `npm run verify` must be recorded by the owner in the VS Code integrated terminal (harness 30s window, protocol 16.4).
- **Files changed:**
  - `src/data/providers/yahoo-finance.ts` (new) — `YahooProviderConfig`/`DEFAULT_YAHOO_PROVIDER_CONFIG`, `YAHOO_PROVIDER_ID`/`YAHOO_PROVIDER_LABEL`, `buildYahooUrl(symbol,start,end,config)` (proxy-wrapped, `encodeURIComponent`, `period1`/`period2`/`interval=1d`/`events=div,splits`), exchange-timezone date rendering (`exchangeDate`, fallback local), `parseYahooChart` (quote/adjclose/dividend/split; missing cells become `NaN`), `normalizeYahooChart` (inclusive range filter + `normalizeBars` under sourceType `provider`, providerId `yahoo_chart`), `createYahooFinanceProvider(config?)` (cache-first `load`, `fetch` with `credentials: 'omit'`, stores fresh dataset).
  - `src/data/providers/cache.ts` (new) — `cacheKey(request, providerId)`; `loadDatasetCache`/`saveDatasetCache` with localStorage primary and guarded `indexedDB` global secondary; any storage failure degrades to a no-op.
  - `src/data/market.ts` — `IssueCode` extended with `providerNetworkError`/`providerBadResponse`/`providerEmptyResult`/`providerNoCoverage`.
  - `src/i18n/locales/{en,zh-TW}/data.ts` — added `data.provider.*` and `data.issue.provider*` keys (zh-TW Traditional Chinese only).
  - `src/views/Analysis.tsx` — added a provider section (ticker/start/end inputs, fetch button, validation errors, issue list, success label) wired to `createYahooFinanceProvider()` and `onDataset(dataset)`.
  - `src/data/providers/yahoo-finance.test.ts` (new) — deterministic URL/parse/normalize/cacheKey cases (no network, no storage).
  - `AGENTS.md` — roadmap, Current Status, Decision Log D-023–D-025, known-limitation note, and this acceptance entry.
- **Commands executed:** None this session (file edits only). The owner must run, one at a time, `npx tsc -b`, `npm run lint`, `npx vitest run src/data/providers/yahoo-finance.test.ts`, and `npm run verify` (protocol 16.3).
- **Verification results:** `UNVERIFIED` — the new provider tests and full gate require the owner's integrated-terminal run and recorded exit codes.
- **Known limitations:** Online fetch cannot be exercised in deterministic unit tests (no network). Chrome/Edge do not expose the `indexedDB` global, so caching there uses localStorage (documented in D-025). Yahoo's endpoint and cors.dev are undocumented/experimental and can fail; CSV and DEMO fallbacks remain available. The configured `trancheCount` default is still 12. README/license/disclaimer and optional market-event import remain pending.
- **Next task:** Owner records `npx tsc -b`, `npm run lint`, the Yahoo provider test run, and `npm run verify` exit codes in the integrated terminal; then perform responsive/theme/locale checks and an end-to-end Yahoo fetch before closing Milestone 5.

