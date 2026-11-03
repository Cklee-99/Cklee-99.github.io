import { describe, expect, it } from 'vitest'
import { STRATEGIES, selectStrategy, setFractionalShares } from './backtest'
import type { BacktestConfig } from './backtest'

function validConfig(): BacktestConfig {
  return {
    ticker: 'SPY',
    strategy: 'trend_following',
    initialCapital: 10000,
    startDate: '2024-01-02',
    endDate: '2026-10-30',
    benchmark: 'SPY',
    allocation: 1.0,
    feeRate: 0.001,
    slippage: 0.001,
    fractionalShares: true,
  }
}

describe('form selection updates', () => {
  it('selectStrategy changes only the strategy and preserves every other form value', () => {
    const config = validConfig()
    const next = selectStrategy(config, 'mean_reversion')
    expect(next.strategy).toBe('mean_reversion')
    expect(next.ticker).toBe(config.ticker)
    expect(next.initialCapital).toBe(config.initialCapital)
    expect(next.startDate).toBe(config.startDate)
    expect(next.endDate).toBe(config.endDate)
    expect(next.benchmark).toBe(config.benchmark)
    expect(next.allocation).toBe(config.allocation)
    expect(next.feeRate).toBe(config.feeRate)
    expect(next.slippage).toBe(config.slippage)
    expect(next.fractionalShares).toBe(config.fractionalShares)
  })

  it('accepts any strategy from the catalogue and keeps fields intact', () => {
    const config = validConfig()
    for (const option of STRATEGIES) {
      const next = selectStrategy(config, option.id)
      expect(next.strategy).toBe(option.id)
      expect(next.ticker).toBe('SPY')
      expect(next.initialCapital).toBe(10000)
    }
  })

  it('setFractionalShares preserves the selected strategy and other values', () => {
    const config = validConfig()
    const next = setFractionalShares(config, false)
    expect(next.fractionalShares).toBe(false)
    expect(next.strategy).toBe(config.strategy)
    expect(next.ticker).toBe(config.ticker)
    expect(next.initialCapital).toBe(config.initialCapital)
    expect(next.startDate).toBe(config.startDate)
    expect(next.endDate).toBe(config.endDate)
    expect(next.benchmark).toBe(config.benchmark)
    expect(next.allocation).toBe(config.allocation)
    expect(next.feeRate).toBe(config.feeRate)
    expect(next.slippage).toBe(config.slippage)
  })

  it('returns a new object and never mutates the input configuration', () => {
    const config = validConfig()
    const next = selectStrategy(config, 'momentum_breakout')
    expect(next).not.toBe(config)
    expect(config.strategy).toBe('trend_following')
    const fractional = setFractionalShares(config, false)
    expect(fractional).not.toBe(config)
    expect(config.fractionalShares).toBe(true)
  })
})
