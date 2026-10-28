# Quantfolio Lab — UI/UX Design Specification

> This document is the source of truth for frontend visual design, interaction patterns, navigation, localization, client-side persistence, and presentation behavior. Read it before creating or changing UI components, styling, charts, navigation, loading states, caching behavior, or user-facing text. `AGENTS.md` remains the source of truth for overall project goals, engineering workflow, milestone status, technical constraints, decisions, and issue history.

## 1. Product and Design Goals

### Product identity

- **Product:** Quantfolio Lab
- **Tagline:** Open-Source Quantitative Investing Playground
- **Audience:** People learning US stock/ETF investing and testing deterministic strategies.
- **Primary viewport:** Mobile, starting at 390 × 844 CSS pixels; remain usable at 320 CSS pixels.
- **Deployment:** Static site on GitHub Pages, including project-site URLs such as `https://<owner>.github.io/quantfolio-lab/`.
- **Default locale:** Traditional Chinese (`zh-TW`). Secondary locale: English (`en`).

### Design principles

1. **Clarity over decoration.** Present the current ticker, date range, data source, portfolio equity, return, and drawdown before secondary details.
2. **Trust through transparency.** Always distinguish real provider data, cached data, imported CSV data, and demonstration data.
3. **Mobile-first.** The main configuration and essential portfolio metrics must work without horizontal page scrolling.
4. **Consistent semantics.** Reuse design tokens, spacing, typography, button styles, status labels, and interaction patterns.
5. **Progressive disclosure.** Keep the default workflow simple; put advanced simulation parameters in a collapsible section.
6. **Accessible by default.** Do not use color as the only status cue. Provide labels, keyboard focus, and adequate touch targets.
7. **Static-host compatible.** Every core feature must work in a static build without server-side rendering, a backend, or an LLM API.

## 2. Frontend Stack and Dependency Policy

Use the existing project stack. Do not replace it without documenting the reason in `AGENTS.md`.

- **Application:** React + TypeScript, strict typing.
- **Build tool:** Vite.
- **Styles:** Local CSS with shared CSS custom properties; avoid inline one-off visual values when a design token exists.
- **Financial charts:** `lightweight-charts`, installed from npm and bundled into the static build. Follow the installed version's current API and license/attribution notice.
- **Localization:** `i18next` + `react-i18next`, with translation resources bundled locally. Do not fetch translation JSON from a runtime server.
- **Date/number formatting:** Native `Intl.DateTimeFormat` and `Intl.NumberFormat` unless a documented edge case justifies a dependency.
- **Automated tests:** Vitest and the project's selected React testing tools.
- **Client storage:** `localStorage` for small preferences; IndexedDB for larger structured market data and saved simulation records.
- **Icons:** Prefer one consistently applied icon library if already installed. If adding one, use a maintained React-compatible package from npm, not a runtime CDN. Pair icons with visible labels or accessible names.
- **Fonts:** Use a system-first font stack. No external font request may be required for the UI to render correctly.

Do not load React, chart libraries, translation files, CSS frameworks, or critical UI code from unpinned runtime CDNs. Dependencies must be installed through npm and locked in `package-lock.json`. Keep dependencies proportionate to the feature set.

## 3. Visual Design Tokens

Define shared CSS custom properties in a central file such as `src/styles/tokens.css`. Components must reference tokens rather than inventing competing palettes. The values below are the design baseline; RGB is shown explicitly for consistent implementation.

### 3.1 Light theme

| Token | Hex | RGB | Use |
|---|---|---|---|
| `--color-bg` | `#F6F8FC` | `rgb(246, 248, 252)` | Page background |
| `--color-surface` | `#FFFFFF` | `rgb(255, 255, 255)` | Main cards, forms, navigation surfaces |
| `--color-surface-muted` | `#F1F5F9` | `rgb(241, 245, 249)` | Secondary panels, table headers |
| `--color-surface-hover` | `#EAF0F8` | `rgb(234, 240, 248)` | Hovered rows and controls |
| `--color-text` | `#111827` | `rgb(17, 24, 39)` | Primary text |
| `--color-text-muted` | `#667085` | `rgb(102, 112, 133)` | Secondary text and descriptions |
| `--color-border` | `#E4E7EC` | `rgb(228, 231, 236)` | Borders and separators |
| `--color-primary` | `#2563EB` | `rgb(37, 99, 235)` | Main action, selected navigation, links |
| `--color-primary-hover` | `#1D4ED8` | `rgb(29, 78, 216)` | Primary action hover |
| `--color-primary-soft` | `#DBEAFE` | `rgb(219, 234, 254)` | Selected backgrounds and subtle highlights |
| `--color-positive` | `#15803D` | `rgb(21, 128, 61)` | Positive return and price movement |
| `--color-negative` | `#DC2626` | `rgb(220, 38, 38)` | Negative return and price movement |
| `--color-warning` | `#B45309` | `rgb(180, 83, 9)` | Warnings and stale-data notices |
| `--color-info` | `#0369A1` | `rgb(3, 105, 161)` | Informational status |
| `--color-focus` | `#7C3AED` | `rgb(124, 58, 237)` | Visible focus outline where primary blue is insufficient |
| `--color-overlay` | `rgba(15, 23, 42, 0.45)` | `rgba(15, 23, 42, 0.45)` | Modal backdrop |

### 3.2 Dark theme

| Token | Hex | RGB | Use |
|---|---|---|---|
| `--color-bg` | `#0B1220` | `rgb(11, 18, 32)` | Page background |
| `--color-surface` | `#111827` | `rgb(17, 24, 39)` | Main cards and panels |
| `--color-surface-muted` | `#182235` | `rgb(24, 34, 53)` | Secondary panels and table headers |
| `--color-surface-hover` | `#202D43` | `rgb(32, 45, 67)` | Hovered rows and controls |
| `--color-text` | `#F3F4F6` | `rgb(243, 244, 246)` | Primary text |
| `--color-text-muted` | `#A3ADBE` | `rgb(163, 173, 190)` | Secondary text |
| `--color-border` | `#2B374B` | `rgb(43, 55, 75)` | Borders and separators |
| `--color-primary` | `#60A5FA` | `rgb(96, 165, 250)` | Main action and selected navigation |
| `--color-primary-hover` | `#93C5FD` | `rgb(147, 197, 253)` | Primary action hover |
| `--color-primary-soft` | `#1E3A5F` | `rgb(30, 58, 95)` | Selected backgrounds |
| `--color-positive` | `#4ADE80` | `rgb(74, 222, 128)` | Positive return and price movement |
| `--color-negative` | `#F87171` | `rgb(248, 113, 113)` | Negative return and price movement |
| `--color-warning` | `#FBBF24` | `rgb(251, 191, 36)` | Warnings and stale-data notices |
| `--color-info` | `#38BDF8` | `rgb(56, 189, 248)` | Informational status |
| `--color-focus` | `#C4B5FD` | `rgb(196, 181, 253)` | Visible focus outline |
| `--color-overlay` | `rgba(0, 0, 0, 0.64)` | `rgba(0, 0, 0, 0.64)` | Modal backdrop |

Use light theme as the initial default. Add a theme toggle and persist the user's explicit preference. Do not infer that a market is profitable from color alone; show a `+`/`−`, text label, or icon as appropriate. Use US-market convention for price movement: green for up/positive and red for down/negative. Do not use the positive/negative colors for unrelated decoration.

### 3.3 Chart palette

Use these semantic chart colors consistently in both themes, adjusting luminance only where necessary for readability.

| Series | Light theme | Dark theme |
|---|---|---|
| Up candle / positive volume | `#16A34A` | `#4ADE80` |
| Down candle / negative volume | `#DC2626` | `#F87171` |
| MA5 | `#7C3AED` | `#C4B5FD` |
| MA20 | `#2563EB` | `#60A5FA` |
| MA60 | `#EA580C` | `#FB923C` |
| Bollinger upper/lower bands | `#94A3B8` | `#64748B` |
| Bollinger middle band | `#64748B` | `#CBD5E1` |
| RSI | `#8B5CF6` | `#A78BFA` |
| Benchmark | `#475569` | `#94A3B8` |
| Equity curve | `#0D9488` | `#2DD4BF` |
| Drawdown | `#DC2626` | `#F87171` |

Use line styles, legends, or labels as well as colors to identify chart series. Ensure chart tooltips and axis labels remain readable in both themes.

### 3.4 Typography

Use this CSS font stack by default:

```css
font-family: Inter, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Do not make remote font downloads a runtime requirement. If locally bundled font files are added later, verify licensing and include the required license notice.

Type scale:

| Token | Size | Typical use |
|---|---:|---|
| `--font-size-xs` | `12px` | Chart metadata, helper text, compact badges |
| `--font-size-sm` | `14px` | Secondary labels and table details |
| `--font-size-md` | `16px` | Body text and form fields |
| `--font-size-lg` | `18px` | Card titles and section headings |
| `--font-size-xl` | `24px` | Main page headings and important metrics |
| `--font-size-2xl` | `30px` | Hero portfolio value on wider screens only |

Use a body line height around `1.5`, headings around `1.2–1.35`, and tabular numerals for prices, percentages, quantities, and financial metrics (`font-variant-numeric: tabular-nums`). Avoid very small text for essential financial values. On narrow screens, use responsive sizing rather than allowing titles or metrics to overflow.

### 3.5 Spacing, radius, borders, and shadows

Use a 4px base spacing scale:

- `--space-1: 4px`
- `--space-2: 8px`
- `--space-3: 12px`
- `--space-4: 16px`
- `--space-5: 20px`
- `--space-6: 24px`
- `--space-8: 32px`
- `--space-10: 40px`

Use 8px for small controls, 12px for inputs/buttons, and 16px for standard cards. Use subtle borders as the primary separation method; keep shadows limited to dropdowns, menus, and overlays. Avoid putting every metric in a separate heavily decorated card.

## 4. Responsive Layout

Use CSS Grid and Flexbox. Avoid fixed-width layouts and page-level horizontal scrolling.

Recommended breakpoints:

- **Small mobile:** up to `359px`
- **Mobile:** `360–479px`
- **Large mobile:** `480–767px`
- **Tablet:** `768–1023px`
- **Desktop:** `1024px` and above
- **Wide content maximum:** approximately `1200px`

### Mobile behavior

- Single-column main content with compact spacing.
- Fixed bottom navigation with safe-area padding and enough space so it never covers content or form actions.
- Important actions must have at least a 44 × 44 CSS-pixel touch target when practical.
- KPI cards use a 2-column grid where legible; use a horizontal scroll row only for secondary cards and show an indication that more cards exist.
- Advanced controls collapse under a clear “Advanced settings” section.
- Charts must resize to the viewport and have usable touch/crosshair interactions. Do not force tiny side-by-side charts on phone screens.
- Tables should convert to stacked detail rows or provide a contained horizontal-scroll region with clear headers; do not cause the entire page to scroll horizontally.

### Tablet and desktop behavior

- Use a left sidebar or wider top navigation on desktop; maintain the same information architecture as mobile.
- Use a two-column layout for configuration and summary when sufficient width is available.
- Show chart and detail panels side by side only when the content remains legible.
- Keep content centered within the maximum width; do not stretch financial cards across ultrawide displays.

## 5. Navigation and Information Architecture

Use hash-based client-side routing (for example, React Router `HashRouter`) or an equivalent approach that works when a user refreshes a nested view on GitHub Pages. Avoid relying on server rewrite rules that GitHub Pages does not provide by default.

Primary views:

1. **Overview** (`#/overview`): current configuration summary, latest simulation headline metrics, equity summary, recent run, data-source status, and a primary “Run backtest” action.
2. **Backtest** (`#/backtest`): ticker, strategy, initial capital, date range, fee/slippage, allocation, fractional-share settings, benchmark, advanced options, and validation results.
3. **Analysis** (`#/analysis`): candlestick chart, indicator overlays, volume, RSI, trade markers, equity curve, and drawdown.
4. **More** (`#/more`): links to Strategy Library, Data & Events, Simulation History, and Settings.

Desktop may expose Strategy Library, Data & Events, Simulation History, and Settings directly in the sidebar. Mobile should show four primary bottom-nav items: Overview, Backtest, Analysis, More. The selected item must be apparent from shape/contrast and an accessible current-page label, not color alone.

Do not create empty tabs that look functional but have no implementation. If a view is planned but not built, hide its navigation entry until it is usable or label it clearly as unavailable.

## 6. Screen Content and Behavior

### 6.1 Shared application shell

The header should include:

- Quantfolio Lab wordmark or simple text logo.
- Active ticker and data freshness summary when relevant.
- Theme toggle.
- Language selector (`繁體中文` / `English`).
- Responsive navigation.

The footer or About section should contain the educational-use disclaimer, data-provider notes, open-source license links, and TradingView attribution required by the chart library. Attribution must remain discoverable on both desktop and mobile.

### 6.2 Overview

Content order:

1. Page title and current ticker/date range.
2. Data-source status banner.
3. Portfolio equity and total return.
4. Supporting metrics: net P&L, max drawdown, trades, win rate when applicable.
5. Equity-curve chart.
6. Benchmark comparison.
7. Latest simulation summary and recent trade decisions.
8. Main CTA to configure or rerun a backtest.

On first use, show an onboarding empty state with a CTA to run the built-in demonstration dataset or import a CSV. Do not show fabricated portfolio metrics before a simulation exists.

### 6.3 Backtest configuration

Group controls into:

- **Required:** ticker, strategy, initial capital, start date, end date.
- **Execution assumptions:** max allocation, transaction fees, slippage, fractional shares.
- **Comparison:** benchmark ticker.
- **Optional analysis:** indicator and pattern visibility.

Use inline validation with a short explanation adjacent to the invalid field. Do not rely only on a toast. Preserve valid form values when changing tabs or when a request fails.

The primary action should have clear states: `Run backtest`, `Validating`, `Loading data`, `Simulating`, `Complete`, or `Failed`. Avoid showing invented percentage progress when exact progress is unavailable. If a run is cancellable, show a cancel action and make cancellation deterministic.

### 6.4 Analysis and chart interactions

- Render daily candlesticks with optional MA5/MA20/MA60, Bollinger Bands, and volume.
- Render RSI14 in a separate pane or aligned chart below price; label the 30 and 70 levels.
- Provide a compact legend with toggles for each overlay.
- Show exact date, OHLC values, volume, and available indicator values in the crosshair tooltip.
- Display BUY/SELL execution markers only for actual executions; use distinct styling for unexecuted decisions.
- Keep chart series colors identical to Section 3.3.
- Resize charts using `ResizeObserver` or the chart library's supported mechanism and dispose chart instances/listeners when components unmount.
- Never pass `NaN`, `Infinity`, duplicate dates, or invalid time values into chart series.
- Include the data range and data-source label near the chart.

### 6.5 Daily timeline and trade log

Every trading session should display one strategy decision (`BUY`, `SELL`, or `HOLD`) where the session is eligible for strategy evaluation. A decision must remain distinct from an actual order execution.

Show date, decision, concise reason, execution status, fill price if executed, share quantity, fees, remaining cash, holdings, and portfolio equity as applicable. Provide filters for all sessions, executed trades, BUY decisions, SELL decisions, and HOLD decisions. On mobile, prioritize date, decision, and status, with the remaining information revealed in a detail panel.

Use explicit text labels such as “Decision only — not executed” and “Executed next session” when applicable. Never imply an order filled just because a signal occurred.

### 6.6 Strategy Library

For every strategy, show:

- Strategy name and plain-language purpose.
- Exact entry and exit rules.
- Indicators and lookback periods used.
- Configurable parameters and defaults.
- Typical conditions where it may fail.
- Whether it is enabled for simulation.

Do not label any strategy “best”, “safe”, “guaranteed”, or “AI-predicted” without evidence. Explain that historical performance does not guarantee future results.

### 6.7 Data & Events

Show:

- Selected data provider or input mode.
- Ticker and available date range.
- Last successful retrieval time, where available.
- Fresh, cached, stale, imported, demo, or unavailable status.
- CSV format guidance, import preview, accepted/rejected row counts, and validation messages.
- Data source, license/attribution note, and provider limitation where applicable.
- Market-event list only when actual source data or user-imported annotations exist.

When provider data is unavailable, provide next actions: retry, use cached history, import CSV, or explicitly switch to demo data. Never silently switch to demo data.

### 6.8 Settings

Include:

- Language.
- Theme: light, dark, and optionally system.
- Number/date display preferences only if they can be implemented consistently.
- Manage local cache and saved simulation history.
- Explain that stored settings/data belong to the current browser origin and are not synchronized across devices.
- A confirmation step before deleting cached data or saved simulations.

## 7. Localization and Formatting

Use `i18next` and `react-i18next` with resources bundled in the application. The default locale is `zh-TW`; English is `en`.

Suggested structure:

```text
src/i18n/
  index.ts
  locales/
    zh-TW/
      common.json
      dashboard.json
      backtest.json
      analysis.json
      data.json
      settings.json
    en/
      common.json
      dashboard.json
      backtest.json
      analysis.json
      data.json
      settings.json
```

Requirements:

- Do not hardcode user-facing labels, button text, statuses, validation messages, empty states, or accessibility labels in components; use translation keys.
- Do not fetch language resources from an external server at runtime.
- On first use, select `zh-TW`; after the user chooses a language, persist the selection and restore it on later visits.
- Use `Intl.NumberFormat` for USD, percentages, volumes, and other numeric values. Use `Intl.DateTimeFormat` for presentation dates without changing the underlying exchange calendar date.
- Keep stored dates as `YYYY-MM-DD` or another explicitly documented timezone-safe representation; do not casually convert date-only strings through UTC timestamps.
- Avoid concatenating fragments of translated sentences. Use complete translation messages and supported interpolation/pluralization.
- If a provider's event title is in its original language, do not silently claim it was translated by AI.
- Add a test or review checklist ensuring both locales have all keys used by the initial release.

## 8. Client-Side Caching and Persistence

All persistence must work on a static GitHub Pages deployment and must degrade gracefully if browser storage is unavailable or full.

### 8.1 In-memory cache

Use in-memory state/cache for data needed during the current session, such as active chart series and a currently running simulation. Avoid re-fetching the same data repeatedly within a single workflow. Do not treat memory as persistent storage.

### 8.2 IndexedDB

Use IndexedDB for larger structured records:

- Normalized daily OHLCV history and provider metadata.
- Imported CSV datasets when the user opts to keep them.
- Saved simulation runs, summaries, and transaction logs if this feature is implemented.
- User-saved strategy configurations if they exceed a small local preference object.

Market-data cache keys must distinguish at least provider, normalized ticker, interval, requested date range or range coverage, price-adjustment policy, and schema version. Store source, retrieval timestamp, actual covered date range, and cache schema version alongside the data.

Cache rules:

- Reuse cached historical bars when they cover the requested range and the source/adjustment policy matches.
- When online, revalidate the most recent portion of history so that newly completed sessions and provider corrections can be discovered.
- Treat provider-specific freshness windows as configurable policy, not a universal promise.
- If data is served from cache after network failure, clearly label it as cached and show its last retrieval time when known.
- Version the cache schema and handle migration or safe invalidation.
- Provide a user-controlled “Clear cached market data” action with confirmation.
- Never assume browser storage is permanent; it can be cleared or evicted by the browser.

### 8.3 localStorage

Use localStorage only for small, non-sensitive preferences such as:

- Theme.
- Selected locale.
- Last selected ticker and strategy.
- Non-sensitive form preferences.
- Small UI preferences such as collapsed/expanded panels.

Validate stored JSON and tolerate missing, malformed, or inaccessible storage. Never store API secrets, passwords, or authentication tokens. Never assume a frontend environment variable is a secret.

### 8.4 HTTP Cache and Cache API

Allow normal browser HTTP caching for static build assets. Do not add a custom service worker or promise full offline support unless explicitly designed, tested, and documented as a separate feature. Historical data persistence belongs in IndexedDB, not in ad-hoc cache entries with unclear invalidation rules.

## 9. Interaction, Loading, and Animation

### Interaction behavior

- Buttons show hover, active, disabled, and keyboard-focus states.
- Disable duplicate submissions while a simulation or import is running.
- Keep previous completed results visible until a new run succeeds; label them as previous results while a new run is in progress.
- Preserve user's form values on recoverable failure.
- Use toast/snackbar notifications only for brief secondary feedback; important errors must remain visible near the relevant area.
- Avoid modal dialogs for routine actions. Use a modal only for focused confirmation or critical interruption.
- Every clickable icon must have an accessible name and a usable touch target.

### Loading and empty states

- Initial app load: compact shell and purposeful empty state; do not show fake portfolio metrics.
- Network request: show a loading label and, where helpful, a skeleton matching the expected final layout.
- Simulation: show the current phase. If work can be chunked or cancelled, preserve responsiveness on mobile.
- No history: explain what is missing and provide CSV/demo options.
- No closed trades: show “Not applicable — no closed trades”, not a 0% win rate.
- Provider failure: retain the actual error category and offer a recovery action.
- Partial indicator history: label unavailable values rather than drawing misleading zero lines.

### Animation

Keep motion restrained and functional:

- Hover/focus state: approximately `100–150ms`.
- Small state transitions: approximately `150–200ms`.
- Drawer/modal: approximately `180–240ms` when motion is enabled.
- Use opacity and transform for lightweight transitions; avoid animating layout dimensions repeatedly.
- Do not animate financial figures in a way that suggests a different value or obscures the exact final number.
- Respect `prefers-reduced-motion: reduce`; remove non-essential transitions and disable decorative motion.
- No autoplaying animation, pulsing profit indicators, flashing charts, or sound effects.

## 10. Accessibility and Responsive Quality

Target WCAG 2.2 AA as an engineering goal.

- Use semantic headings, landmarks, buttons, labels, and form associations.
- Support keyboard navigation and visible focus rings.
- Aim for at least 4.5:1 contrast for normal text and 3:1 for large text and meaningful UI graphics where applicable.
- Never communicate BUY/SELL/HOLD, success/error, or positive/negative performance through color alone; use labels, icons, shapes, or symbols.
- Announce relevant asynchronous status changes accessibly without making every chart update a live announcement.
- Do not trap keyboard focus except in a correctly implemented modal.
- Check long tickers, large values, negative returns, long translated strings, empty datasets, and narrow widths.
- Verify the page at minimum widths of 320px, 360px, and 390px, plus tablet and desktop widths.

## 11. GitHub Pages and Static-Site Constraints

These requirements take priority over any design idea that needs a server.

1. All core app features must be implemented in client-side React/TypeScript and static assets.
2. Use Vite's correct `base` for a repository project site: `/quantfolio-lab/` in the production project-site build, while retaining convenient local development paths. Do not hardcode the owner's GitHub username.
3. Build and resolve assets through Vite/imported assets or `import.meta.env.BASE_URL`. Do not reference public assets using root-absolute paths such as `/logo.svg` when that would break the repository subpath.
4. Use hash-based routes (or equivalent static-safe routing) so refreshing a view does not require a server rewrite.
5. Bundle core UI dependencies and translation resources through npm. No feature may depend on a third-party script loaded from a CDN at runtime.
6. Do not put API keys in source code, repository secrets intended for client exposure, `VITE_*` variables, or generated JS bundles. Any key used by a browser is visible to users.
7. Online market-data services are optional and may fail due to provider policy, rate limits, network conditions, or CORS. CSV import and clearly labeled demo data must still work when external data is unavailable.
8. Do not introduce API endpoints, serverless functions, a database server, SSR, server-side secrets, or background scheduled jobs as required runtime dependencies.
9. Deployment must use GitHub Actions with a static build artifact, and deployment instructions must specify the build output directory.
10. Test the built site at its actual subpath, not only at `/`. Verify navigation, refresh, CSS, fonts/fallbacks, chart assets, translations, and demo/CSV workflows.
11. A feature is not “GitHub Pages compatible” merely because `npm run build` succeeds. Verify that it has no runtime dependency on unavailable server functionality.

## 12. Implementation and Acceptance Checklist

Before merging UI changes, verify the relevant items:

- [ ] The implementation follows the colors, type scale, spacing, and chart palette in this file.
- [ ] Both themes work, if theme support is implemented.
- [ ] Both `zh-TW` and `en` render correctly, if localization is implemented.
- [ ] No required UI copy is left hardcoded in components.
- [ ] Mobile navigation does not cover the page content or action buttons.
- [ ] No horizontal page overflow exists at 320px, 360px, and 390px.
- [ ] Loading, empty, unavailable, cached, demo, and error states are clear and distinct.
- [ ] Previous simulation results are not silently replaced by fake results when a fetch fails.
- [ ] Charts are responsive and clean up listeners/instances correctly.
- [ ] Storage failures do not crash the app.
- [ ] Keyboard focus, labels, contrast, and reduced-motion behavior are checked.
- [ ] `npm run build` succeeds; relevant tests pass.
- [ ] The production build has been checked with the `/quantfolio-lab/` path.
- [ ] No secret, fake financial claim, or unverified event has been introduced.

## 13. Change Control

- This file defines the UI/UX contract. Do not casually change the global palette, font stack, navigation structure, localization defaults, storage responsibilities, or animation policy while implementing an unrelated feature.
- If a change is justified, propose the reason, scope, and migration impact in the task report; update this file in the same change.
- Keep this document tool-agnostic. It must work as shared design context for Cline and other AI coding tools.
- Do not claim that a design or accessibility checklist passed unless it was actually inspected or tested.
