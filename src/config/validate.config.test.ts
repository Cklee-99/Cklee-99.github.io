import { describe, expect, it } from 'vitest'
import {
  MAX_ALLOCATION,
  MAX_CAPITAL,
  MAX_FEE_RATE,
  MAX_SLIPPAGE,
  MAX_TICKER_LENGTH,
  validateBacktestConfig,
} from './backtest'
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

describe('validateBacktestConfig', () => {
  it('accepts a well-formed configuration', () => {
    const result = validateBacktestConfig(validConfig())
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('rejects invalid tickers', () => {
    const base = validConfig()
    expect(validateBacktestConfig({ ...base, ticker: '' }).errors.ticker).toBe('badTicker')
    expect(validateBacktestConfig({ ...base, ticker: 'A_B_C' }).errors.ticker).toBe('badTicker')
    expect(
      validateBacktestConfig({ ...base, ticker: 'AAAAAAAAAAA' }).errors.ticker
    ).toBe('badTicker')
    expect(validateBacktestConfig({ ...base, ticker: 'AAA' }).errors.ticker).toBeUndefined()
    expect(
      validateBacktestConfig({ ...base, ticker: 'X'.repeat(MAX_TICKER_LENGTH) }).errors.ticker
    ).toBeUndefined()
  })

  it('rejects invalid initial capital', () => {
    const base = validConfig()
    expect(validateBacktestConfig({ ...base, initialCapital: 0 }).errors.initialCapital).toBe(
      'badCapital'
    )
    expect(validateBacktestConfig({ ...base, initialCapital: -1 }).errors.initialCapital).toBe(
      'badCapital'
    )
    expect(
      validateBacktestConfig({ ...base, initialCapital: MAX_CAPITAL + 1 }).errors.initialCapital
    ).toBe('badCapital')
    expect(validateBacktestConfig({ ...base, initialCapital: 1 }).errors.initialCapital).toBeUndefined()
  })

  it('rejects invalid date ranges', () => {
    const base = validConfig()
    expect(validateBacktestConfig({ ...base, startDate: 'not-a-date' }).errors.dates).toBe(
      'invalidDates'
    )
    expect(validateBacktestConfig({ ...base, endDate: '2026-13-40' }).errors.dates).toBe(
      'invalidDates'
    )
    expect(
      validateBacktestConfig({ ...base, startDate: '2026-10-30', endDate: '2026-10-01' }).errors.dates
    ).toBe('invalidDates')
    expect(
      validateBacktestConfig({ ...base, startDate: '2020-02-29', endDate: '2021-02-28' }).errors.dates
    ).toBeUndefined()
  })

  it('rejects invalid allocation, fee, and slippage', () => {
    const base = validConfig()
    expect(validateBacktestConfig({ ...base, allocation: -0.1 }).errors.allocation).toBe(
      'badAllocation'
    )
    expect(validateBacktestConfig({ ...base, allocation: MAX_ALLOCATION + 0.01 }).errors.allocation).toBe(
      'badAllocation'
    )
    expect(validateBacktestConfig({ ...base, feeRate: -0.001 }).errors.feeRate).toBe('badFee')
    expect(validateBacktestConfig({ ...base, feeRate: MAX_FEE_RATE + 0.01 }).errors.feeRate).toBe(
      'badFee'
    )
    expect(validateBacktestConfig({ ...base, slippage: -0.001 }).errors.slippage).toBe('badSlippage')
    expect(validateBacktestConfig({ ...base, slippage: MAX_SLIPPAGE + 0.01 }).errors.slippage).toBe(
      'badSlippage'
    )
    expect(validateBacktestConfig({ ...base, allocation: 0.5, feeRate: 0.01, slippage: 0.001 }).valid).toBe(true)
  })

  it('rejects invalid benchmark tickers', () => {
    const base = validConfig()
    expect(validateBacktestConfig({ ...base, benchmark: 'A_B_C' }).errors.benchmark).toBe(
      'badBenchmark'
    )
    expect(validateBacktestConfig({ ...base, benchmark: 'BRK+B' }).errors.benchmark).toBe(
      'badBenchmark'
    )
  })
})
