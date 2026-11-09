/* Deterministic performance metrics and benchmark tests. */

import { describe, expect, it } from 'vitest'
import type { BacktestConfig } from '../config/backtest'
import type { DailyBar } from '../data/market'
import type { DailySnapshot, ExecutedOrder } from './types'
import { computeSummary } from './performance'
import { buyAndHoldReturn } from './benchmark'

function config(): BacktestConfig {
  return {
    ticker: 'SPY',
    strategy: 'trend_following',
    initialCapital: 10000,
    startDate: '2024-01-01',
    endDate: '2024-04-30',
    benchmark: 'SPY',
    allocation: 1,
    feeRate: 0.001,
    slippage: 0.001,
    fractionalShares: true,
  }
}

function snapshot(date: string, equity: number, positionValue: number): DailySnapshot {
  return { date, cash: equity - positionValue, shares: 1, positionValue, equity, dayFees: 0 }
}

function sellOrder(date: string, realizedPnL: number): ExecutedOrder {
  return {
    date,
    action: 'SELL',
    shares: 1,
    price: 100,
    openPrice: 100,
    gross: 100,
    fee: 0.1,
    slippageCost: 0.1,
    net: 99.8,
    realizedPnL,
    reasonCode: 'sell',
  }
}

describe('computeSummary', () => {
  it('computes total return, drawdown, CAGR, volatility, and Sharpe from a deterministic curve', () => {
    const snapshots = [
      snapshot('2024-01-02', 10000, 0),
      snapshot('2024-01-03', 11000, 11000),
      snapshot('2024-01-04', 9900, 9900),
    ]
    const summary = computeSummary(config(), snapshots, [], null)
    expect(summary.initialCapital).toBe(10000)
    expect(summary.finalEquity).toBe(9900)
    expect(summary.totalReturn).toBeCloseTo(-0.01, 10)
    expect(summary.maxDrawdown).toBeCloseTo(-0.1, 10)
    expect(summary.annualizedVolatility).toBeCloseTo(0.1 * Math.sqrt(252), 10)
    expect(summary.sharpeRatio).toBeCloseTo(0, 10)
    // CAGR uses actual calendar days (2024-01-02 → 2024-01-04 = 2 days) with
    // 365.25 days/year, not a fixed session count.
    expect(summary.cagr).toBeCloseTo(Math.pow(0.99, 365.25 / 2) - 1, 10)
  })

  it('annualizes CAGR from the actual calendar span, not the session count', () => {
    // Both runs have the same 2 snapshots and +20% total return, but the second
    // spans a weekend so it covers 3 calendar days while the first covers 1.
    const monday = computeSummary(
      config(),
      [snapshot('2024-01-02', 10000, 0), snapshot('2024-01-03', 12000, 12000)],
      [],
      null,
    )
    const weekend = computeSummary(
      config(),
      [snapshot('2024-01-05', 10000, 0), snapshot('2024-01-08', 12000, 12000)],
      [],
      null,
    )
    // Same session count, different number of actual calendar days.
    expect(weekend.cagr).toBeCloseTo(Math.pow(1.2, 365.25 / 3) - 1, 10)
    expect(monday.cagr).toBeCloseTo(Math.pow(1.2, 365.25 / 1) - 1, 10)
  })

  it('leaves CAGR null when the snapshots span no calendar period', () => {
    const summary = computeSummary(config(), [snapshot('2024-01-02', 10000, 0)], [], null)
    expect(summary.cagr).toBeNull()
  })

  it('uses a documented zero risk-free rate (mean session return, no subtraction)', () => {
    const snapshots = [
      snapshot('2024-01-02', 10000, 0),
      snapshot('2024-01-03', 11000, 11000),
      snapshot('2024-01-04', 12100, 12100),
    ]
    const summary = computeSummary(config(), snapshots, [], null)
    // Returns are +10%, +10%; std = 0 so the ratio is guarded to null.
    expect(summary.sharpeRatio).toBeNull()
  })

  it('leaves win rate null when no trade has closed', () => {
    const snapshots = [snapshot('2024-01-02', 10000, 0)]
    const summary = computeSummary(config(), snapshots, [], null)
    expect(summary.closedWinRate).toBeNull()
    expect(summary.tradeCount).toBe(0)
  })

  it('computes the closed-trade win rate from realized P&L', () => {
    const snapshots = [snapshot('2024-01-02', 10000, 0)]
    const ledger = [sellOrder('2024-01-03', 50), sellOrder('2024-01-04', -20)]
    const summary = computeSummary(config(), snapshots, ledger, null)
    expect(summary.tradeCount).toBe(2)
    expect(summary.closedWinRate).toBe(0.5)
  })

  it('reports exposure as the average invested fraction', () => {
    const snapshots = [
      snapshot('2024-01-02', 10000, 10000),
      snapshot('2024-01-03', 11000, 11000),
    ]
    const summary = computeSummary(config(), snapshots, [], null)
    expect(summary.exposure).toBe(1)
  })

  it('computes excess return against a provided benchmark', () => {
    const snapshots = [snapshot('2024-01-02', 10000, 0), snapshot('2024-01-03', 10500, 10500)]
    const summary = computeSummary(config(), snapshots, [], 0.04)
    expect(summary.excessReturn).toBeCloseTo(0.05 - 0.04, 10)
  })
})

describe('buyAndHoldReturn', () => {
  function bar(date: string, close: number): DailyBar {
    return { date, open: close, high: close, low: close, close, volume: 1000 }
  }

  it('returns last/first close over the inclusive range', () => {
    const bars = [bar('2024-01-02', 100), bar('2024-01-03', 110), bar('2024-01-04', 108)]
    expect(buyAndHoldReturn(bars, { startDate: '2024-01-02', endDate: '2024-01-04' })).toBeCloseTo(0.08, 10)
  })

  it('returns null with fewer than two bars in range', () => {
    const bars = [bar('2024-01-02', 100)]
    expect(buyAndHoldReturn(bars, { startDate: '2024-01-02', endDate: '2024-01-04' })).toBeNull()
  })

  it('never fabricates a value for an empty range', () => {
    expect(buyAndHoldReturn([], { startDate: '2024-01-02', endDate: '2024-01-04' })).toBeNull()
  })
})
