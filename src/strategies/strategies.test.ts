/* Deterministic unit tests for the five strategies. Fixtures build precise
   indicator values so signals are fully reproducible. */

import { describe, expect, it } from 'vitest'
import type { DailyBar } from '../data/market'
import type { PatternId, PatternResult } from '../indicators/patterns'
import type { StrategyContext } from './types'
import { INSUFFICIENT_HISTORY } from './types'
import { trendFollowingDecide } from './trend-following'
import { meanReversionDecide } from './mean-reversion'
import { scheduledDeploymentDecide } from './scheduled-deployment'
import { candlestickConfirmationDecide } from './candlestick-confirmation'
import { momentumBreakoutDecide } from './momentum-breakout'
import { strategyById, strategyList } from './registry'

function bar(close: number, open = close, date = '2024-01-01'): DailyBar {
  return { date, open, high: Math.max(open, close), low: Math.min(open, close), close, volume: 1000 }
}

function nullArray(length: number): (number | null)[] {
  return new Array(length).fill(null) as (number | null)[]
}

interface BuildOptions {
  bars: DailyBar[]
  ma20?: readonly (number | null)[]
  ma60?: readonly (number | null)[]
  upper?: readonly (number | null)[]
  lower?: readonly (number | null)[]
  rsi?: readonly (number | null)[]
  patterns?: readonly PatternResult[]
  cash?: number
  equity?: number
  positionValue?: number
  feeRate?: number
  slippage?: number
  allocationRatio?: number
  initialCapital?: number
  trancheCount?: number
  isFirstSimulatedSessionOfMonth?: boolean
}

function buildContext(options: BuildOptions): StrategyContext {
  const n = options.bars.length
  const index = n - 1
  const defaultSeries = { ma5: nullArray(n), ma20: nullArray(n), ma60: nullArray(n) }
  return {
    bars: options.bars,
    index,
    indicators: {
      ma5: defaultSeries.ma5,
      ma20: options.ma20 ?? defaultSeries.ma20,
      ma60: options.ma60 ?? defaultSeries.ma60,
      bollingerUpper: options.upper ?? nullArray(n),
      bollingerMiddle: nullArray(n),
      bollingerLower: options.lower ?? nullArray(n),
      rsi14: options.rsi ?? nullArray(n),
    },
    patterns: options.patterns ?? [],
    cash: options.cash ?? 10000,
    equity: options.equity ?? 10000,
    positionValue: options.positionValue ?? 0,
    allocationRatio: options.allocationRatio ?? 1,
    feeRate: options.feeRate ?? 0.001,
    slippage: options.slippage ?? 0.001,
    initialCapital: options.initialCapital ?? 10000,
    trancheCount: options.trancheCount ?? 12,
    isFirstSimulatedSessionOfMonth: options.isFirstSimulatedSessionOfMonth ?? false,
  }
}

describe('trend following', () => {
  it('buys on an MA20-up MA60 crossover', () => {
    const bars = [bar(10), bar(11)]
    const ma20 = [9, 11]
    const ma60 = [10, 10]
    const decision = trendFollowingDecide(buildContext({ bars, ma20, ma60 }))
    expect(decision.action).toBe('BUY')
    expect(decision.reasonCode).toBe('maCrossoverUp')
  })

  it('sells on an MA20-down MA60 crossover', () => {
    const bars = [bar(10), bar(9)]
    const ma20 = [11, 9]
    const ma60 = [10, 11]
    const decision = trendFollowingDecide(buildContext({ bars, ma20, ma60 }))
    expect(decision.action).toBe('SELL')
    expect(decision.reasonCode).toBe('maCrossoverDown')
  })

  it('holds when staying above MA60 without a fresh crossover', () => {
    const bars = [bar(10), bar(11)]
    const ma20 = [10, 12]
    const ma60 = [9, 10]
    const decision = trendFollowingDecide(buildContext({ bars, ma20, ma60 }))
    expect(decision.action).toBe('HOLD')
    expect(decision.reasonCode).toBe('hold')
  })

  it('holds with insufficient history when MA60 is null', () => {
    const bars = [bar(10), bar(11)]
    const ma20 = [9, 11]
    const ma60 = [null, null]
    const decision = trendFollowingDecide(buildContext({ bars, ma20, ma60 }))
    expect(decision.action).toBe('HOLD')
    expect(decision.reasonCode).toBe(INSUFFICIENT_HISTORY)
  })
})

describe('mean reversion', () => {
  it('buys at or below the lower band with RSI <= 30', () => {
    const bars = [bar(98)]
    const decision = meanReversionDecide(buildContext({ bars, rsi: [30], upper: [101], lower: [99] }))
    expect(decision.action).toBe('BUY')
    expect(decision.reasonCode).toBe('meanRevBuy')
  })

  it('sells at or above the upper band', () => {
    const bars = [bar(102)]
    const decision = meanReversionDecide(buildContext({ bars, rsi: [55], upper: [101], lower: [98] }))
    expect(decision.action).toBe('SELL')
    expect(decision.reasonCode).toBe('meanRevSell')
  })

  it('sells when RSI >= 70 even inside the bands', () => {
    const bars = [bar(100)]
    const decision = meanReversionDecide(buildContext({ bars, rsi: [72], upper: [101], lower: [99] }))
    expect(decision.action).toBe('SELL')
  })

  it('holds inside the bands with neutral RSI', () => {
    const bars = [bar(100)]
    const decision = meanReversionDecide(buildContext({ bars, rsi: [50], upper: [101], lower: [99] }))
    expect(decision.action).toBe('HOLD')
  })

  it('holds with insufficient history when RSI is null', () => {
    const bars = [bar(100)]
    const decision = meanReversionDecide(buildContext({ bars, upper: [101], lower: [99] }))
    expect(decision.action).toBe('HOLD')
    expect(decision.reasonCode).toBe(INSUFFICIENT_HISTORY)
  })
})

describe('momentum breakout', () => {
  it('buys only on a fresh band breakout with RSI and trend confirmation', () => {
    const bars = [bar(100), bar(103)]
    const decision = momentumBreakoutDecide(buildContext({
      bars,
      upper: [101, 102],
      rsi: [50, 65],
      ma20: [50, 52],
      ma60: [45, 46],
    }))
    expect(decision.action).toBe('BUY')
    expect(decision.reasonCode).toBe('breakoutBuy')
  })

  it('does not buy when already above the band (no fresh breakout)', () => {
    const bars = [bar(104), bar(105)]
    const decision = momentumBreakoutDecide(buildContext({
      bars,
      upper: [102, 102],
      rsi: [65, 66],
      ma20: [52, 53],
      ma60: [46, 47],
    }))
    expect(decision.action).toBe('HOLD')
  })

  it('exits when RSI drops below 50', () => {
    const bars = [bar(103), bar(99)]
    const decision = momentumBreakoutDecide(buildContext({
      bars,
      upper: [102, 101],
      rsi: [60, 45],
      ma20: [52, 50],
      ma60: [46, 46],
    }))
    expect(decision.action).toBe('SELL')
    expect(decision.reasonCode).toBe('momentumExit')
  })
})


describe('candlestick confirmation', () => {
  const pattern = (id: PatternId, index: number): PatternResult => ({
    pattern: id,
    descriptionKey: 'data.pattern.doji',
    index,
    date: '2024-01-05',
    direction: 'bullish',
  })

  it('buys on bullish engulfing with close above MA20 and MA20 >= MA60', () => {
    const bars = [bar(60)]
    const decision = candlestickConfirmationDecide(buildContext({
      bars,
      ma20: [50],
      ma60: [45],
      patterns: [pattern('bullishEngulfing', 0)],
    }))
    expect(decision.action).toBe('BUY')
    expect(decision.reasonCode).toBe('bullishEngulfingConfirm')
  })

  it('buys on a hammer with rising RSI while RSI <= 50', () => {
    const bars = [bar(50), bar(52)]
    const decision = candlestickConfirmationDecide(buildContext({
      bars,
      rsi: [45, 48],
      patterns: [pattern('hammer', 1)],
    }))
    expect(decision.action).toBe('BUY')
    expect(decision.reasonCode).toBe('hammerConfirm')
  })

  it('sells on bearish engulfing with close below MA20', () => {
    const bars = [bar(40)]
    const decision = candlestickConfirmationDecide(buildContext({
      bars,
      ma20: [45],
      patterns: [pattern('bearishEngulfing', 0)],
    }))
    expect(decision.action).toBe('SELL')
    expect(decision.reasonCode).toBe('bearishEngulfingConfirm')
  })

  it('sells on a shooting star with falling RSI while RSI >= 50', () => {
    const bars = [bar(60), bar(58)]
    const decision = candlestickConfirmationDecide(buildContext({
      bars,
      rsi: [70, 55],
      patterns: [pattern('shootingStar', 1)],
    }))
    expect(decision.action).toBe('SELL')
    expect(decision.reasonCode).toBe('shootingStarConfirm')
  })

  it('keeps holding when the confirmation indicator is unavailable', () => {
    const bars = [bar(50)]
    const decision = candlestickConfirmationDecide(buildContext({
      bars,
      patterns: [pattern('bullishEngulfing', 0)],
    }))
    expect(decision.action).toBe('HOLD')
    expect(decision.reasonCode).toBe(INSUFFICIENT_HISTORY)
  })
})

describe('scheduled deployment', () => {
  it('queues a monthly BUY with a budget bounded by cash, capacity, and costs', () => {
    const bars = [bar(100)]
    const decision = scheduledDeploymentDecide(buildContext({
      bars,
      isFirstSimulatedSessionOfMonth: true,
      initialCapital: 12000,
      trancheCount: 12,
      cash: 5000,
      equity: 10000,
      positionValue: 0,
      feeRate: 0.001,
    }))
    expect(decision.action).toBe('BUY')
    expect(decision.buyBudget).toBeGreaterThan(0)
    // Monthly tranche is 12000 / 12 = 1000; capped by cash/(1+fee) = 5000/1.001.
    expect(decision.buyBudget).toBeLessThanOrEqual(1000)
    expect(decision.buyBudget).toBeLessThanOrEqual(5000 / 1.001)
  })

  it('holds on any session that is not the first of a simulated month', () => {
    const bars = [bar(100)]
    const decision = scheduledDeploymentDecide(buildContext({ bars }))
    expect(decision.action).toBe('HOLD')
  })

  it('never emits a SELL decision', () => {
    const bars = [bar(100)]
    const decision = scheduledDeploymentDecide(buildContext({ bars, isFirstSimulatedSessionOfMonth: true }))
    expect(decision.action).toBe('BUY')
  })

  it('reports a skipped tranche when no cash or capacity remains', () => {
    const bars = [bar(100)]
    const decision = scheduledDeploymentDecide(buildContext({
      bars,
      isFirstSimulatedSessionOfMonth: true,
      cash: 0,
      equity: 0,
      positionValue: 0,
    }))
    expect(decision.action).toBe('BUY')
    expect(decision.buyBudget).toBe(0)
    expect(decision.reasonCode).toBe('monthlyTrancheSkipped')
  })
})

describe('registry', () => {
  it('exposes exactly five strategies by stable id', () => {
    expect(strategyById('trend_following').id).toBe('trend_following')
    expect(strategyById('mean_reversion').id).toBe('mean_reversion')
    expect(strategyById('scheduled_deployment').id).toBe('scheduled_deployment')
    expect(strategyById('candlestick_confirmation').id).toBe('candlestick_confirmation')
    expect(strategyById('momentum_breakout').id).toBe('momentum_breakout')
    expect(strategyList().length).toBe(5)
  })

  it('keeps every strategy name and purpose localized through keys, not raw text', () => {
    for (const strategy of strategyList()) {
      expect(strategy.nameKey.startsWith('backtest.strategy.')).toBe(true)
      expect(strategy.purposeKey.startsWith('backtest.strategy.purpose.')).toBe(true)
    }
  })
})

