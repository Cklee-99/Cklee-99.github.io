/* Deterministic tests for pure chart-series transformations. Uses fixed inputs
   only; no random prices. Confirms date alignment, future-data absence, marker
   fill-date placement, benchmark availability, and null/NaN/Infinity filtering. */

import { describe, expect, it } from 'vitest'
import type { DailyBar, MarketDataset } from '../../data/market'
import { VALID_ADJUSTMENT_POLICY_NONE } from '../../data/market'
import { loadDemoDataset } from '../../data/demo'
import type { BacktestConfig } from '../../config/backtest'
import { runSimulation } from '../../backtesting/simulator'
import type { ExecutedOrder } from '../../backtesting/types'
import { CHART_PALETTES } from './chart-theme'
import {
  isoToBusinessDay,
  businessDayToIso,
  validateDateAxis,
  buildCandles,
  buildAlignedLine,
  buildVolume,
  buildMarkers,
  buildDrawdown,
  buildChartSeriesSet,
  buildPerformanceSeriesSet,
  buildTimelineRows,
  filterTimelineRows,
  sessionIndexByDate,
} from './chart-utils'

function bar(date: string, open: number, high: number, low: number, close: number, volume: number): DailyBar {
  return { date, open, high, low, close, volume }
}

function dataset(bars: DailyBar[]): MarketDataset {
  return {
    symbol: 'SPY',
    sourceType: 'csv',
    dateRange: { start: bars[0].date, end: bars[bars.length - 1].date },
    bars,
    validCount: bars.length,
    adjustmentPolicy: VALID_ADJUSTMENT_POLICY_NONE,
  }
}

function cfg(
  demo: MarketDataset,
  startIndex: number,
  endIndex: number,
  strategy: string,
): BacktestConfig {
  return {
    ticker: 'SPY',
    strategy: strategy as BacktestConfig['strategy'],
    initialCapital: 10000,
    startDate: demo.bars[startIndex].date,
    endDate: demo.bars[endIndex].date,
    benchmark: 'SPY',
    allocation: 1,
    feeRate: 0,
    slippage: 0,
    fractionalShares: true,
  }
}

function bdIso(bd: { year: number; month: number; day: number }): string {
  return `${bd.year}-${String(bd.month).padStart(2, '0')}-${String(bd.day).padStart(2, '0')}`
}

const palette = CHART_PALETTES.light

describe('chart-utils', () => {
  it('round-trips ISO dates through BusinessDay without timezone shift', () => {
    const bd = isoToBusinessDay('2024-03-15')
    expect(bd).toEqual({ year: 2024, month: 3, day: 15 })
    expect(businessDayToIso(bd)).toBe('2024-03-15')
  })

  it('validates strictly ascending unique date axes', () => {
    expect(validateDateAxis(['2024-01-02', '2024-01-03'])).toEqual([])
    expect(validateDateAxis([])).toEqual(['chartEmpty'])
    expect(validateDateAxis(['2024-01-03', '2024-01-02'])).toEqual(['chartDuplicates'])
    expect(validateDateAxis(['2024-01-02', '2024-01-02'])).toEqual(['chartDuplicates'])
  })

  it('drops invalid OHLC candles and never zero-fills them', () => {
    const bars = [
      bar('2024-01-02', 100, 105, 95, 103, 1000),
      bar('2024-01-03', 100, 95, 105, 103, 1000),
      bar('2024-01-04', Number.NaN, 105, 95, 103, 1000),
      bar('2024-01-05', 100, 115, 95, 103, 1000),
    ]
    const { candles, warnings } = buildCandles(bars)
    expect(candles.map((c) => bdIso(c.time))).toEqual(['2024-01-02', '2024-01-05'])
    expect(warnings).toContain('chartBadOHLC')
    expect(warnings).toContain('chartNonFinite')
    candles.forEach((c) => {
      expect(c.open > 0 && c.high >= c.low && c.high >= c.close && c.low <= c.open).toBe(true)
    })
  })

  it('drops null and non-finite aligned-line values and reports misalignment', () => {
    const dates = ['2024-01-02', '2024-01-03', '2024-01-04']
    const { line, warnings } = buildAlignedLine([null, 50, Number.NaN], dates)
    expect(line.length).toBe(1)
    expect(line[0].value).toBe(50)
    expect(warnings).toContain('chartNonFinite')
    expect(buildAlignedLine([1, 2], dates).warnings).toContain('chartMisaligned')
  })

  it('colors volume by session direction using the US chart palette', () => {
    const bars = [bar('2024-01-02', 100, 105, 95, 103, 1000), bar('2024-01-03', 100, 105, 95, 98, 2000)]
    const { volume } = buildVolume(bars, palette)
    expect(volume[0].color).toBe(palette.up)
    expect(volume[1].color).toBe(palette.down)
  })

  it('places BUY/SELL markers only on actual LEDGER fill dates', () => {
    const ledger: ExecutedOrder[] = [
      { date: '2024-01-18', action: 'BUY', shares: 10, price: 100.493, openPrice: 100.493, gross: 1004.93, fee: 0, slippageCost: 0, net: -1004.93, reasonCode: 'trendEntry' },
      { date: '2024-01-22', action: 'SELL', shares: 10, price: 110.2, openPrice: 110.2, gross: 1102, fee: 0, slippageCost: 0, net: 1102, reasonCode: 'trendExit' },
    ]
    const markers = buildMarkers(ledger, palette, '買入', '賣出')
    expect(markers.length).toBe(2)
    markers.forEach((marker, index) => {
      const iso = businessDayToIso(marker.time)
      expect(iso).toBe(ledger[index].date)
      expect(ledger.some((o) => o.date === iso)).toBe(true)
    })
    expect(markers[0].text).toBe('買入')
    expect(markers[1].text).toBe('賣出')
  })

  it('builds equity and benchmark curves from real values only', () => {
    const demo = loadDemoDataset()
    const result = runSimulation(demo, cfg(demo, 20, 40, 'scheduled_deployment'))
    const perf = buildPerformanceSeriesSet(result)
    expect(perf.equity.length).toBe(result.snapshots.length)
    expect(perf.benchmarkAvailable).toBe(true)
    expect(perf.benchmark.length).toBe(result.benchmark.dailyEquity.length)
  })

  it('computes peak-to-trough drawdown with a zero first point', () => {
    const dates = ['2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']
    const equity = [100, 120, 96, 108]
    const { line } = buildDrawdown(equity, dates)
    expect(line[0].value).toBe(0)
    expect(line[2].value).toBeCloseTo(-0.2, 10)
    expect(line[3].value).toBeCloseTo(-0.1, 10)
    line.forEach((p) => expect(p.value <= 0).toBe(true))
  })

  it('reports a missing benchmark without fabricating points', () => {
    const bars = [bar('2024-01-02', 100, 105, 95, 103, 1000), bar('2024-01-03', 100, 105, 95, 98, 2000)]
    const result = runSimulation(dataset(bars), cfg(dataset(bars), 0, 1, 'trend_following'))
    const perf = buildPerformanceSeriesSet(
      { ...result, benchmark: { ...result.benchmark, available: false, dailyEquity: [] } },
    )
    expect(perf.benchmarkAvailable).toBe(false)
    expect(perf.benchmark).toEqual([])
    expect(perf.warnings).toContain('chartBenchmarkMissing')
  })

  it('aggregates a full chart series set with aligned MA and Bollinger arrays', () => {
    const demo = loadDemoDataset()
    const dates = demo.bars.map((b: DailyBar) => b.date)
    const set = buildChartSeriesSet(
      demo.bars,
      [null, 10, 10],
      [null, null, null],
      [null, null, null],
      [null, 12, 12],
      [null, 11, 11],
      [null, 40, 41],
      [null, 40, 41],
      [],
      palette,
      '買入',
      '賣出',
    )
    expect(set.dates).toEqual(dates)
    expect(set.ma5.length).toBe(2)
    expect(set.bollMiddle.length).toBe(2)
    expect(set.bollUpper.length).toBe(2)
    expect(set.volume.length).toBe(demo.bars.length)
  })

  it('builds and filters the timeline without mutating decisions', () => {
    const demo = loadDemoDataset()
    const result = runSimulation(demo, cfg(demo, 10, 24, 'scheduled_deployment'))
    const rows = buildTimelineRows(result)
    expect(rows.length).toBe(result.decisions.length)
    const executed = filterTimelineRows(rows, 'executed')
    expect(executed.length).toBe(result.ledger.length)
    executed.forEach((r) => expect(r.order).not.toBeNull())
    filterTimelineRows(rows, 'hold').forEach((r) => expect(r.decision).toBe('HOLD'))
    filterTimelineRows(rows, 'skipped').forEach((r) => expect(r.skipped).not.toBeNull())
  })

  it('indexes sessions by ISO date for crosshair resolution', () => {
    const demo = loadDemoDataset()
    const index = sessionIndexByDate(demo.bars.map((b: DailyBar) => b.date))
    expect(index[demo.bars[0].date]).toBe(0)
    expect(index[demo.bars[demo.bars.length - 1].date]).toBe(demo.bars.length - 1)
  })
})
