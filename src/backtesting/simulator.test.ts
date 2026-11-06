/* Full deterministic integration tests for the backtest simulator, using the
   fixed DEMO dataset so every run reproduces identical results. */

import { describe, expect, it } from 'vitest'
import type { BacktestConfig, StrategyId } from '../config/backtest'
import { loadDemoDataset } from '../data/demo'
import { runSimulation } from './simulator'

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
