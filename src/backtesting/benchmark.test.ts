/* Deterministic tests for the comparable buy-and-hold benchmark account: initial
   purchase at the first eligible open, fees, slippage, fractional/whole shares,
   dividends, splits, adjustment-policy safety, and equity reconciliation. */

import { describe, expect, it } from 'vitest'
import type { BacktestConfig } from '../config/backtest'
import type { DailyBar, MarketDataset } from '../data/market'
import { VALID_ADJUSTMENT_POLICY_NONE } from '../data/market'
import { loadDemoDataset } from '../data/demo'
import { runBuyAndHoldBenchmark } from './benchmark'
import { runSimulation } from './simulator'

function bar(date: string, open: number, close: number, dividend?: number, splitRatio?: number): DailyBar {
  return {
    date,
    open,
    high: Math.max(open, close),
    low: Math.min(open, close),
    close,
    volume: 1000,
    dividend,
    splitRatio,
  }
}

function dataset(bars: DailyBar[], adjustmentPolicy = VALID_ADJUSTMENT_POLICY_NONE): MarketDataset {
  return {
    symbol: 'SPY',
    sourceType: 'csv',
    dateRange: { start: bars[0].date, end: bars[bars.length - 1].date },
    bars,
    validCount: bars.length,
    adjustmentPolicy,
  }
}

function config(overrides: Partial<BacktestConfig> = {}): BacktestConfig {
  return {
    ticker: 'SPY',
    strategy: 'trend_following',
    initialCapital: 10000,
    startDate: '2024-01-02',
    endDate: '2024-01-05',
    benchmark: 'SPY',
    allocation: 1,
    feeRate: 0.001,
    slippage: 0.001,
    fractionalShares: true,
    ...overrides,
  }
}

describe('runBuyAndHoldBenchmark', () => {
  it('buys at the first eligible session open with the received execution price', () => {
    const bars = [bar('2024-01-02', 100, 101), bar('2024-01-03', 102, 103), bar('2024-01-04', 103, 104)]
    const result = runBuyAndHoldBenchmark(dataset(bars), config())
    expect(result.available).toBe(true)
    expect(result.startDate).toBe('2024-01-02')
    expect(result.endDate).toBe('2024-01-04')
    expect(result.initialExecutionPrice).toBeCloseTo(100 * 1.001, 10)
    expect(result.executedShares).toBeGreaterThan(0)
  })

  it('applies the buy transaction fee exactly once', () => {
    const bars = [bar('2024-01-02', 100, 101), bar('2024-01-03', 102, 103)]
    const result = runBuyAndHoldBenchmark(dataset(bars), config())
    expect(result.buyFee).toBeGreaterThan(0)
    expect(result.buyFee).toBeCloseTo(result.executedShares! * result.initialExecutionPrice! * 0.001, 10)
  })

  it('applies buy-side slippage on the execution price and reports its cost', () => {
    const bars = [bar('2024-01-02', 100, 101), bar('2024-01-03', 102, 103)]
    const result = runBuyAndHoldBenchmark(dataset(bars), config())
    expect(result.initialExecutionPrice).toBeCloseTo(100 * 1.001, 10)
    expect(result.slippageCost).toBeCloseTo(result.executedShares! * 100 * 0.001, 10)
  })

  it('purchases fractional shares when enabled and whole shares when disabled', () => {
    const bars = [bar('2024-01-02', 100, 101), bar('2024-01-03', 102, 103)]
    const fraction = runBuyAndHoldBenchmark(dataset(bars), config({ fractionalShares: true }))
    const whole = runBuyAndHoldBenchmark(dataset(bars), config({ fractionalShares: false }))
    expect(fraction.executedShares).toBeGreaterThan(0)
    expect(whole.executedShares).toBe(Math.floor(whole.executedShares!))
    expect(whole.executedShares! * whole.initialExecutionPrice! * (1 + 0.001)).toBeLessThanOrEqual(10000)
  })

  it('adjusts holdings for an eligible stock split', () => {
    const bars = [bar('2024-01-02', 100, 101), bar('2024-01-03', 102, 103, undefined, 2), bar('2024-01-04', 90, 91)]
    const result = runBuyAndHoldBenchmark(dataset(bars), config())
    expect(result.executedShares).toBeGreaterThan(0)
    expect(result.finalPositionValue).toBeCloseTo(result.executedShares! * 2 * 91, 5)
  })

  it('credits cash dividends per held share and reports them once', () => {
    const bars = [bar('2024-01-02', 100, 101), bar('2024-01-03', 102, 103, 0.5), bar('2024-01-04', 103, 104)]
    const result = runBuyAndHoldBenchmark(dataset(bars), config())
    expect(result.dividendCash).toBeCloseTo(result.executedShares! * 0.5, 10)
    expect(result.finalCash).toBeGreaterThanOrEqual(result.dividendCash)
  })

  it('never double-counts corporate actions under an unadjusted policy', () => {
    const bars = [bar('2024-01-02', 100, 101), bar('2024-01-03', 102, 103, 0.5), bar('2024-01-04', 103, 104)]
    const result = runBuyAndHoldBenchmark(dataset(bars, VALID_ADJUSTMENT_POLICY_NONE), config())
    expect(result.finalEquity).toBeCloseTo(result.finalCash! + result.finalPositionValue!, 10)
    expect(result.dividendCash).toBeCloseTo(result.executedShares! * 0.5, 10)
  })

  it('marks the benchmark unavailable when no session matches the range', () => {
    const bars = [bar('2024-01-02', 100, 101), bar('2024-01-03', 102, 103)]
    const result = runBuyAndHoldBenchmark(dataset(bars), config({ startDate: '2025-01-01' }))
    expect(result.available).toBe(false)
    expect(result.totalReturn).toBeNull()
    expect(result.warnings).toContain('benchmarkNoRange')
  })

  it('marks the benchmark unavailable when the adjustment metadata is incompatible', () => {
    const bars = [bar('2024-01-02', 100, 101), bar('2024-01-03', 102, 103)]
    const result = runBuyAndHoldBenchmark(dataset(bars, 'adjusted-splits'), config())
    expect(result.available).toBe(false)
    expect(result.totalReturn).toBeNull()
    expect(result.finalEquity).toBeNull()
    expect(result.warnings).toContain('benchmarkAdjustmentUnsupported')
  })

  it('reconciles final equity as cash plus holdings market value', () => {
    const bars = [bar('2024-01-02', 100, 101), bar('2024-01-03', 102, 103, 0.25), bar('2024-01-04', 103, 104)]
    const result = runBuyAndHoldBenchmark(dataset(bars), config())
    expect(result.finalEquity).toBeCloseTo(result.finalCash! + result.finalPositionValue!, 10)
  })

  it('reports a comparable total return with the same cost assumptions as the strategy', () => {
    const dataset = loadDemoDataset()
    const cfg = config({ startDate: dataset.bars[0].date, endDate: dataset.bars[dataset.bars.length - 1].date })
    const benchmark = runBuyAndHoldBenchmark(dataset, cfg)
    const simulation = runSimulation(dataset, cfg)
    expect(benchmark.available).toBe(true)
    // The summary's benchmark return is the account's total return, so excess
    // return is computed against the same documented cost assumptions.
    expect(simulation.summary.benchmarkReturn).toBe(benchmark.totalReturn)
    expect(simulation.benchmark.totalReturn).toBe(benchmark.totalReturn)
  })

  it('stays flat for a whole-share policy that cannot buy a single share', () => {
    const bars = [bar('2024-01-02', 20000, 20100), bar('2024-01-03', 20050, 20150)]
    const result = runBuyAndHoldBenchmark(dataset(bars), config({ fractionalShares: false }))
    expect(result.available).toBe(false)
    expect(result.executedShares).toBeNull()
    expect(result.warnings).toContain('benchmarkNoPurchase')
  })

  it('reports daily account equity aligned with every eligible session close', () => {
    const bars = [
      bar('2024-01-02', 100, 101),
      bar('2024-01-03', 102, 103, 0.25),
      bar('2024-01-04', 103, 104),
    ]
    const result = runBuyAndHoldBenchmark(dataset(bars), config())
    expect(result.available).toBe(true)
    expect(result.dailyEquity.length).toBe(bars.length)
    expect(result.dailyEquity.map((p) => p.date)).toEqual(['2024-01-02', '2024-01-03', '2024-01-04'])
    // First point equals the account immediately after purchase at its close.
    const shares = result.executedShares as number
    const buyGross = shares * (result.initialExecutionPrice as number)
    const buyFee = buyGross * 0.001
    const dayOneCash = 10000 - buyGross - buyFee
    expect(result.dailyEquity[0].equity).toBeCloseTo(dayOneCash + shares * 101, 8)
    // Final point equals the reported final equity and includes the dividend.
    expect(result.dailyEquity[result.dailyEquity.length - 1].equity).toBe(result.finalEquity as number)
    expect(result.dividendCash).toBeCloseTo(shares * 0.25, 8)
  })
})
