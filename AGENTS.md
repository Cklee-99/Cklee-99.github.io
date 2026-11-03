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
- [x] Configure the current GitHub Pages user-site deployment using the root URL and `dist/` build artifact (owner reports deployment succeeded; future changes must re-validate it).
- [ ] Obtain explicit authorization before pushing or changing remote settings.

## 13. Current Status

- **Current milestone:** Milestone 2 — Data and Indicators is COMPLETE (all quality gates pass). `npm run lint` and `npm run build` PASS via direct terminal output; `npm run test` PASSES with exit 0 when run in the VS Code integrated terminal (the harness's 30s background window cannot capture `npm run test`/`npm run verify`, so the owner ran the gate manually there and reported exit 0).
- **Project implementation status:** Milestone 1 (incl. code-review fixes) and Milestone 1.2 are complete. Milestone 2 adds `src/data/{market,demo,csv}.ts`, `src/indicators/{series,bollinger,rsi,patterns}.ts`, deterministic unit tests, and localized dataset/CSV/indicator UI in Overview/Analysis/Backtest/More. No new runtime dependencies were added. `package.json` now includes a `verify` script (`npm run lint && npm run test && npm run build`).
- **Current deployment:** `Cklee-99.github.io` → `https://cklee-99.github.io/`, a user site at the domain root. Vite production `base` is `/` (set explicitly in `vite.config.ts`). GitHub Actions publishes the `dist/` build artifact after lint/test/build success. No push/deploy was performed this session.
- **Current verified tests:** All quality gates PASS with exit 0. `npm run lint` (clean, direct output). `npm run build` (`tsc -b && vite build`, `✓ 55 modules transformed`, gzip JS 81.70 kB, direct output). `npm run test` (7 test files / 67 Vitest cases, exit 0) — PASSED via the owner's manual `npm run verify` in the VS Code integrated terminal, including the three corrected candlestick pattern fixtures.
- **Current blocker:** None. Lint, test, and build each complete with exit code 0 (test/build/lint verified; test verified by the owner's integrated-terminal run because the harness 30s window cannot observe it).
- **Next task:** Milestone 3 — Strategies and Backtesting: five strategies, next-session execution and transaction accounting, fees/slippage/fractional shares, benchmark and performance metrics, and deterministic integration tests.
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
- **D-010:** The current deployment is the GitHub Pages user site repository `Cklee-99.github.io`, published at `https://cklee-99.github.io/`; Vite's production base is `/`, and GitHub Actions deploys the `dist/` artifact. `/quantfolio-lab/` is only relevant if a separate project-site repository is created later.
- **D-011:** Localization uses a bundled `Record<string, string>` lookup (`translate(locale, key)` with English fallback) instead of runtime `i18next`; this keeps zero runtime dependencies and works offline on GitHub Pages. Custom attribute names (e.g. `<div data-theme="dark">`) drive CSS theme switching, so `strategy` label keys follow `Option.id` snake_case to avoid raw-key rendering.
- **D-012:** Milestone 2 normalizes market data as typed `DailyBar`/`MarketDataset` behind a replaceable `MarketDataSource`. Deterministic demo data is clearly labeled synthetic. CSV import rejects invalid rows with visible issues; dates must be unique ISO `YYYY-MM-DD` and are sorted ascending; no interpolation or silent zero substitution. Indicators are aligned to input length and return `null` before a complete window; Bollinger Bands use population standard deviation (divide by N); Wilder RSI's first value appears at index `period`. Candlestick patterns never use future bars; hammer/shooting star require a documented prior trend. New `data.*` locale keys are covered by a parity test.

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
- **Known limitations:** Online provider and charting (Milestone 4/5) not started; browser persistence (localStorage/IndexedDB) still not covered; the harness background terminal cannot observe `npm run test`/`npm run verify`, so those gates must be run in the VS Code integrated terminal; `git status` shows `src/data/`, `src/indicators/`, and `src/i18n/locale.test.ts` untracked (not committed).
- **Next task:** Milestone 3 — Strategies and Backtesting.
