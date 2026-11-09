/* Full deterministic integration tests for the backtest simulator, using the
   fixed DEMO dataset so every run reproduces identical results. */

import { describe, expect, it } from 'vitest'
import type { BacktestConfig, StrategyId } from '../config/backtest'
import { loadDemoDataset } from '../data/demo'
import { runSimulation, buildStrategyContext } from './simulator'
import { initialPortfolio } from './accounting'
import { sma } from '../indicators/series'
import { bollingerBands } from '../indicators/bollinger'
import { rsi } from '../indicators/rsi'
import type { StrategyContext } from '../strategies/types'

function config(
  strategy: StrategyId = 'trend_following',
  startDate: string = '2024-01-02',
  endDate?: string,
): BacktestConfig {
  const dataset = loadDemoDataset()
  const rangeEnd = endDate ?? dataset.bars[dataset.bars.length - 1].date
  return {
    ticker: 'SPY',
    strategy,
    initialCapital: 10000,
    startDate,
    endDate: rangeEnd,
    benchmark: 'SPY',
    allocation: 1,
    feeRate: 0.001,
    slippage: 0.001,
    fractionalShares: true,
  }
}

describe('simulator determinism', () => {
  it('produces identical results for identical inputs', () => {
    const dataset = loadDemoDataset()
    const cfg = config('trend_following')
    const first = runSimulation(dataset, cfg)
    const second = runSimulation(dataset, cfg)
    expect(second.decisions).toEqual(first.decisions)
    expect(second.ledger).toEqual(first.ledger)
    expect(second.snapshots).toEqual(first.snapshots)
    expect(second.summary).toEqual(first.summary)
  })
})

describe('simulator invariants and timing', () => {
  it('keeps cash, shares, and equity invariants on every snapshot', () => {
    const dataset = loadDemoDataset()
    const result = runSimulation(dataset, config('trend_following'))
    expect(result.snapshots.length).toBeGreaterThan(0)
    for (const snap of result.snapshots) {
      expect(snap.cash).toBeGreaterThanOrEqual(0)
      expect(snap.shares).toBeGreaterThanOrEqual(0)
      expect(snap.equity).toBe(snap.cash + snap.positionValue)
    }
  })

  it('never executes an order on the first simulated session (no same-day execution)', () => {
    const dataset = loadDemoDataset()
    const result = runSimulation(dataset, config('trend_following'))
    const firstSessionDate = dataset.bars[0].date
    for (const order of result.ledger) {
      expect(order.date).not.toBe(firstSessionDate)
    }
    // The first decision necessarily schedules for the following session's open.
    expect(result.decisions.length).toBe(dataset.bars.length)
  })

  it('leaves a pending order unreported as executed when it cannot reach the next session', () => {
    const dataset = loadDemoDataset()
    const lastDate = dataset.bars[dataset.bars.length - 1].date
    const result = runSimulation(dataset, config('trend_following', '2024-01-02', lastDate))
    const lastDecision = result.decisions[result.decisions.length - 1]
    if (lastDecision.action === 'BUY' || lastDecision.action === 'SELL') {
      expect(result.skippedOrders.some((o) => o.date === lastDate)).toBe(true)
      expect(result.ledger.some((o) => o.date === lastDate && o.action === lastDecision.action)).toBe(false)
    }
  })

  it('keeps warm-up capital intact: first snapshot equals initial capital after a later start', () => {
    const dataset = loadDemoDataset()
    const result = runSimulation(dataset, config('trend_following', '2024-03-01'))
    expect(result.snapshots[0].cash).toBe(10000)
    expect(result.startDate).toBe('2024-03-01')
  })

  it('records a warning when early sessions lack indicator history', () => {
    const dataset = loadDemoDataset()
    const result = runSimulation(dataset, config('trend_following'))
    expect(result.warnings).toContain('insufficientIndicatorHistory')
  })

  it('reports a real runnable range even when the dataset is long', () => {
    const dataset = loadDemoDataset()
    const result = runSimulation(dataset, config('trend_following'))
    expect(result.startDate).toBe(dataset.bars[0].date)
    expect(result.endDate).toBe(dataset.bars[dataset.bars.length - 1].date)
  })
})

describe('scheduled deployment simulation', () => {
  it('deploys monthly tranches and never sells', () => {
    const dataset = loadDemoDataset()
    const result = runSimulation(dataset, config('scheduled_deployment'))
    expect(result.ledger.filter((o) => o.action === 'SELL').length).toBe(0)
    expect(result.ledger.filter((o) => o.action === 'BUY').length).toBeGreaterThan(0)
    for (const order of result.ledger) {
      expect(order.action).toBe('BUY')
      expect(order.net).toBeLessThan(0)
    }
  })
})

describe('strategy context look-ahead boundary', () => {
  function contextAt(index: number): StrategyContext {
    const dataset = loadDemoDataset()
    const cfg = config('trend_following')
    const closes = dataset.bars.map((b) => b.close)
    const ma5 = sma(closes, 5)
    const ma20 = sma(closes, 20)
    const ma60 = sma(closes, 60)
    const bb = bollingerBands(closes, 20, 2)
    const rsi14 = rsi(closes, 14)
    const state = initialPortfolio(cfg.initialCapital)
    return buildStrategyContext(
      dataset.bars,
      index,
      cfg,
      ma5,
      ma20,
      ma60,
      bb.upper,
      bb.middle,
      bb.lower,
      rsi14,
      state,
      cfg.initialCapital,
      0,
      0,
    )
  }

  it('truncates bars to index + 1 so a future bar is physically absent', () => {
    const ctx = contextAt(120)
    expect(ctx.bars.length).toBe(121)
    expect(ctx.bars[120]).toBeDefined()
    expect(ctx.bars[121]).toBeUndefined()
  })

  it('truncates every indicator array to exactly index + 1', () => {
    for (const index of [20, 100, 259]) {
      const ctx = contextAt(index)
      expect(ctx.bars.length).toBe(index + 1)
      expect(ctx.indicators.ma5.length).toBe(index + 1)
      expect(ctx.indicators.ma20.length).toBe(index + 1)
      expect(ctx.indicators.ma60.length).toBe(index + 1)
      expect(ctx.indicators.bollingerUpper.length).toBe(index + 1)
      expect(ctx.indicators.bollingerMiddle.length).toBe(index + 1)
      expect(ctx.indicators.bollingerLower.length).toBe(index + 1)
      expect(ctx.indicators.rsi14.length).toBe(index + 1)
    }
  })

  it('makes every future indicator value unreachable through the context', () => {
    const ctx = contextAt(120)
    expect(ctx.indicators.ma20[121]).toBeUndefined()
    expect(ctx.indicators.ma60[121]).toBeUndefined()
    expect(ctx.indicators.bollingerUpper[121]).toBeUndefined()
    expect(ctx.indicators.bollingerLower[121]).toBeUndefined()
    expect(ctx.indicators.rsi14[121]).toBeUndefined()
  })

  it('keeps warm-up indicator history available at the correct historical index', () => {
    const late = contextAt(180)
    expect(late.indicators.ma60[180]).toBeTypeOf('number')
    expect(late.indicators.rsi14[180]).toBeTypeOf('number')
    expect(late.indicators.ma60[180]).not.toBeNull()
    const early = contextAt(10)
    expect(early.indicators.ma60[10]).toBeNull()
    expect(early.indicators.ma5[10]).toBeTypeOf('number')
  })

  it('produces identical decisions for identical historical inputs', () => {
    const dataset = loadDemoDataset()
    const cfg = config('trend_following')
    expect(runSimulation(dataset, cfg).decisions).toEqual(runSimulation(dataset, cfg).decisions)
  })
})

describe('benchmark account in results', () => {
  it('reports the comparable buy-and-hold account and reconciles its equity', () => {
    const dataset = loadDemoDataset()
    const result = runSimulation(dataset, config('trend_following'))
    expect(result.benchmark.available).toBe(true)
    expect(result.benchmark.finalEquity).toBeCloseTo(result.benchmark.finalCash! + result.benchmark.finalPositionValue!, 10)
    expect(result.summary.benchmarkReturn).toBe(result.benchmark.totalReturn)
  })
})

describe('accounting invariants across multiple transactions', () => {
  it('keeps cash, shares, and equity reconciled and fees non-negative on every snapshot', () => {
    const dataset = loadDemoDataset()
    const result = runSimulation(dataset, config('scheduled_deployment'))
    for (const snap of result.snapshots) {
      expect(snap.cash).toBeGreaterThanOrEqual(0)
      expect(snap.shares).toBeGreaterThanOrEqual(0)
      expect(snap.equity).toBe(snap.cash + snap.positionValue)
    }
    for (const order of result.ledger) {
      expect(order.fee).toBeGreaterThanOrEqual(0)
      expect(order.slippageCost).toBeGreaterThanOrEqual(0)
    }
    const buyFees = result.ledger.filter((o) => o.action === 'BUY').map((o) => o.fee)
    expect(buyFees.length).toBeGreaterThan(0)
    expect(buyFees.reduce((a, b) => a + b, 0)).toBeGreaterThan(0)
  })
})
