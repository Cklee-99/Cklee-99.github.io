/* Pure chart-series transformations and data-integrity validation. No React, no
   Lightweight Charts instance code, and no reimplementation of indicators or
   accounting. Familiar calculations already belong to the milestone engines;
   this layer only shapes their verified outputs for chart consumption.

   Guarantees:
   - every emitted series uses BusinessDay time values from the original ISO dates;
   - null / NaN / Infinity / invalid OHLC / misaligned or duplicate dates are
     removed and reported as a ChartWarning, never passed to the chart library,
     and never replaced with zero. */

import type { DailyBar } from '../../data/market'
import type { BusinessDay, CandlestickData, HistogramData, LineData, SeriesMarker } from 'lightweight-charts'
import type { SimulationResult, ExecutedOrder, SkippedOrder, DailySnapshot } from '../../backtesting/types'
import type { ChartPalette } from './chart-theme'
import type { ChartSeriesSet, ChartWarning, PerformanceSeriesSet, TimelineFilter, TimelineRow } from './chart-types'

type NumericSeries = readonly (number | null)[]

export function isPlainIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/** ISO YYYY-MM-DD to a Lightweight Charts BusinessDay object (no timezone). */
export function isoToBusinessDay(date: string): BusinessDay {
  const [year, month, day] = date.split('-').map((part) => parseInt(part, 10))
  return { year, month, day }
}

export function businessDayToIso(time: BusinessDay): string {
  return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`
}

export function isFinite(number: number): boolean {
  return typeof number === 'number' && Number.isFinite(number)
}

/** Validates the session-date axis: strictly ascending and free of duplicates. */
export function validateDateAxis(dates: readonly string[]): ChartWarning[] {
  if (dates.length === 0) return ['chartEmpty']
  const warnings: ChartWarning[] = []
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] <= dates[i - 1]) {
      warnings.push('chartDuplicates')
      break
    }
  }
  return warnings
}

/** Candle series from validated bars. Invalid OHLC or non-finite rows are
    dropped and reported. Candles are never zero-filled. */
export function buildCandles(bars: readonly DailyBar[]): { candles: CandlestickData<BusinessDay>[]; warnings: ChartWarning[] } {
  const candles: CandlestickData<BusinessDay>[] = []
  const warnings = validateDateAxis(bars.map((b) => b.date))
  for (const bar of bars) {
    const values = [bar.open, bar.high, bar.low, bar.close]
    const finite = values.reduce((ok, v) => ok && isFinite(v) && v > 0, true)
    const ohlcValid = finite && bar.high >= bar.low && bar.high >= bar.open && bar.high >= bar.close && bar.low <= bar.open && bar.low <= bar.close
    if (!ohlcValid) {
      warnings.push(finite ? 'chartBadOHLC' : 'chartNonFinite')
      continue
    }
    candles.push({ time: isoToBusinessDay(bar.date), open: bar.open, high: bar.high, low: bar.low, close: bar.close })
  }
  if (candles.length === 0 && warnings.length === 0) warnings.push('chartEmpty')
  return { candles, warnings }
}

/** A value series aligned to the input dates. Null and non-finite entries are
    removed, never zero-filled; a misaligned length is reported. */
export function buildAlignedLine(values: readonly (number | null)[], dates: readonly string[]): { line: LineData[]; warnings: ChartWarning[] } {
  const line: LineData[] = []
  const warnings: ChartWarning[] = []
  if (values.length !== dates.length) warnings.push('chartMisaligned')
  for (let i = 0; i < values.length; i++) {
    const raw = values[i]
    if (raw === null) continue
    if (!isFinite(raw)) {
      warnings.push('chartNonFinite')
      continue
    }
    if (i >= dates.length) {
      warnings.push('chartMisaligned')
      continue
    }
    line.push({ time: isoToBusinessDay(dates[i]), value: raw })
  }
  return { line, warnings }
}

/** Volume histogram colored by session direction (US convention). Non-finite
    volumes are dropped and reported. */
export function buildVolume(bars: readonly DailyBar[], palette: ChartPalette): { volume: HistogramData[]; warnings: ChartWarning[] } {
  const volume: HistogramData[] = []
  const warnings: ChartWarning[] = []
  for (const bar of bars) {
    if (!isFinite(bar.volume)) {
      warnings.push('chartNonFinite')
      continue
    }
    const color = bar.close >= bar.open ? palette.up : palette.down
    volume.push({ time: isoToBusinessDay(bar.date), value: bar.volume, color })
  }
  return { volume, warnings }
}

/** Builds the buy/sell execution markers from actual ledger fills only.
    A marker is placed at the session where the order executed (its fill date),
    never on a signal-only session. Pending/skipped orders are never markers. */
export function buildMarkers(
  ledger: readonly ExecutedOrder[],
  palette: ChartPalette,
  buyLabel: string,
  sellLabel: string,
): SeriesMarker<BusinessDay>[] {
  const markers: SeriesMarker<BusinessDay>[] = []
  for (const order of ledger) {
    if (!isPlainIsoDate(order.date)) continue
    if (order.action === 'BUY') {
      markers.push({
        time: isoToBusinessDay(order.date),
        position: 'belowBar',
        shape: 'arrowUp',
        color: palette.up,
        text: buyLabel,
      })
    } else if (order.action === 'SELL') {
      markers.push({
        time: isoToBusinessDay(order.date),
        position: 'aboveBar',
        shape: 'arrowDown',
        color: palette.down,
        text: sellLabel,
      })
    }
  }
  return markers
}

/** Strategy equity curve from the actual daily snapshots. */
export function buildEquity(snapshots: readonly { date: string; equity: number }[]): LineData[] {
  return snapshots.filter((s) => isFinite(s.equity)).map((s) => ({ time: isoToBusinessDay(s.date), value: s.equity }))
}

/** Benchmark equity curve from the benchmark account's real daily equity
    points. Unavailable benchmarks have no points and are never invented. */
export function buildBenchmark(points: readonly { date: string; equity: number }[]): LineData[] {
  return points.filter((p) => isFinite(p.equity)).map((p) => ({ time: isoToBusinessDay(p.date), value: p.equity }))
}

/** Peak-to-trough drawdown per session: (equity - prior peak) / prior peak.
    The reference peak starts at the first session's equity, so the first point
    is 0. This is drawdown, never a one-day loss. */
export function buildDrawdown(equity: readonly number[], dates: readonly string[]): { line: LineData[]; warnings: ChartWarning[] } {
  const line: LineData[] = []
  const warnings: ChartWarning[] = []
  if (equity.length !== dates.length) warnings.push('chartMisaligned')
  let peak = 0
  for (let i = 0; i < equity.length; i++) {
    const value = equity[i]
    if (!isFinite(value)) continue
    if (peak <= 0 || value > peak) peak = value
    const drawdown = peak > 0 ? value / peak - 1 : 0
    if (i >= dates.length) {
      warnings.push('chartMisaligned')
      break
    }
    line.push({ time: isoToBusinessDay(dates[i]), value: drawdown })
  }
  return { line, warnings }
}

/** Full price-chart series from validated bars + engine indicator outputs. */
export function buildChartSeriesSet(
  bars: readonly DailyBar[],
  ma5: NumericSeries,
  ma20: NumericSeries,
  ma60: NumericSeries,
  bollUpper: NumericSeries,
  bollMiddle: NumericSeries,
  bollLower: NumericSeries,
  rsi14: NumericSeries,
  ledger: readonly ExecutedOrder[],
  palette: ChartPalette,
  buyLabel: string,
  sellLabel: string,
): ChartSeriesSet {
  const dates = bars.map((b) => b.date)
  const candles = buildCandles(bars)
  const volume = buildVolume(bars, palette)
  const ma5Line = buildAlignedLine(ma5, dates)
  const ma20Line = buildAlignedLine(ma20, dates)
  const ma60Line = buildAlignedLine(ma60, dates)
  const bollUpperLine = buildAlignedLine(bollUpper, dates)
  const bollMiddleLine = buildAlignedLine(bollMiddle, dates)
  const bollLowerLine = buildAlignedLine(bollLower, dates)
  const rsiLine = buildAlignedLine(rsi14, dates)
  const warnings = uniqueWarnings([
    ...candles.warnings,
    ...volume.warnings,
    ...ma5Line.warnings,
    ...ma20Line.warnings,
    ...ma60Line.warnings,
    ...bollUpperLine.warnings,
    ...bollMiddleLine.warnings,
    ...bollLowerLine.warnings,
    ...rsiLine.warnings,
  ])
  return {
    candles: candles.candles,
    ma5: ma5Line.line,
    ma20: ma20Line.line,
    ma60: ma60Line.line,
    bollUpper: bollUpperLine.line,
    bollMiddle: bollMiddleLine.line,
    bollLower: bollLowerLine.line,
    volume: volume.volume,
    rsi: rsiLine.line,
    markers: buildMarkers(ledger, palette, buyLabel, sellLabel),
    warnings,
    dates,
  }
}

/** Performance series (equity, benchmark, drawdown) from a simulation result. */
export function buildPerformanceSeriesSet(result: SimulationResult): PerformanceSeriesSet {
  const dates = result.snapshots.map((s) => s.date)
  const equityValues = result.snapshots.map((s) => s.equity)
  const drawdown = buildDrawdown(equityValues, dates)
  const benchmarkAvailable = result.benchmark.available && result.benchmark.dailyEquity.length > 0
  const missingBenchmark: ChartWarning[] = benchmarkAvailable ? [] : ['chartBenchmarkMissing']
  const warnings = uniqueWarnings([...drawdown.warnings, ...missingBenchmark])
  return {
    equity: buildEquity(result.snapshots),
    benchmark: buildBenchmark(result.benchmark.dailyEquity),
    benchmarkAvailable,
    initialCapital: result.config.initialCapital,
    drawdown: drawdown.line,
    warnings,
  }
}

function uniqueWarnings(list: readonly ChartWarning[]): ChartWarning[] {
  const seen: Record<string, boolean> = {}
  const out: ChartWarning[] = []
  for (const item of list) {
    if (item && !seen[item]) {
      seen[item] = true
      out.push(item)
    }
  }
  return out
}

/** Merges decisions, executed orders, skipped orders, and snapshots into one
    chronological timeline. A decision is never confused with an execution. */
export function buildTimelineRows(result: SimulationResult): TimelineRow[] {
  const snapshotsByDate: Record<string, DailySnapshot> = {}
  for (const s of result.snapshots) snapshotsByDate[s.date] = s
  const ordersByDate: Record<string, ExecutedOrder> = {}
  for (const o of result.ledger) ordersByDate[o.date] = o
  const skippedByDate: Record<string, SkippedOrder> = {}
  for (const s of result.skippedOrders) skippedByDate[s.date] = s
  return result.decisions.map((d) => ({
    date: d.date,
    decision: d.action,
    reasonCode: d.reasonCode,
    order: ordersByDate[d.date] ?? null,
    skipped: skippedByDate[d.date] ?? null,
    snapshot: snapshotsByDate[d.date] ?? null,
  }))
}

/** Filters the timeline without mutating the input rows. */
export function filterTimelineRows(rows: readonly TimelineRow[], filter: TimelineFilter): TimelineRow[] {
  switch (filter) {
    case 'all':
      return rows.slice()
    case 'executed':
      return rows.filter((r) => r.order !== null)
    case 'buy':
      return rows.filter((r) => r.decision === 'BUY')
    case 'sell':
      return rows.filter((r) => r.decision === 'SELL')
    case 'hold':
      return rows.filter((r) => r.decision === 'HOLD')
    case 'skipped':
      return rows.filter((r) => r.skipped !== null)
  }
}

/** O(1) session index lookup for crosshair time resolution by ISO date string. */
export function sessionIndexByDate(dates: readonly string[]): Record<string, number> {
  const index: Record<string, number> = {}
  for (let i = 0; i < dates.length; i++) index[dates[i]] = i
  return index
}

/** Intl-based formatting helpers (kept pure). */
function numberFormat(locale: string, options: Record<string, unknown>): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, options as Intl.NumberFormatOptions)
}

export function formatMoney(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value)
}

export function formatPercent(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 2 }).format(value * 100)
}

export function formatRatio(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 2 }).format(value)
}

export function formatVolume(value: number, locale: string): string {
  return numberFormat(locale, { maximumFractionDigits: 0 }).format(value)
}

