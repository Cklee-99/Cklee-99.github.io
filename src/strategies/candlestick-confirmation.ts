/* Candlestick Confirmation: explicit patterns plus trend/indicator confirmation.
   Reuses the detector's documented prior-trend condition (hammer/shooting star);
   does not implement a conflicting duplicate trend detector. */

import type { Strategy, StrategyContext, StrategyDecision } from './types'
import { HOLD_REASON, INSUFFICIENT_HISTORY } from './types'

const NAME_KEY = 'backtest.strategy.candlestick_confirmation'
const PURPOSE_KEY = 'backtest.strategy.purpose.candlestick_confirmation'

export const RSI_CONFIRM_CEILING = 50
export const RSI_CONFIRM_FLOOR = 50

function patternAt(context: StrategyContext, pattern: string): boolean {
  return context.patterns.some((p) => p.index === context.index && p.pattern === pattern)
}

export function candlestickConfirmationDecide(context: StrategyContext): StrategyDecision {
  const { bars, indicators, index } = context
  const close = bars[index].close
  const ma20 = indicators.ma20[index]
  const ma60 = indicators.ma60[index]
  const rsi = indicators.rsi14[index]
  const prevRsi = indicators.rsi14[index - 1]

  const bullishEngulfing = patternAt(context, 'bullishEngulfing')
  const bearishEngulfing = patternAt(context, 'bearishEngulfing')
  const hammer = patternAt(context, 'hammer')
  const shootingStar = patternAt(context, 'shootingStar')

  // BUY case 1: bullish engulfing with close above MA20 and MA20 >= MA60.
  if (bullishEngulfing && ma20 !== null && ma60 !== null && close > ma20 && ma20 >= ma60) {
    return { action: 'BUY', reasonCode: 'bullishEngulfingConfirm' }
  }
  // BUY case 2: hammer with rising RSI while RSI <= 50.
  if (hammer && rsi !== null && prevRsi !== null && rsi > prevRsi && rsi <= RSI_CONFIRM_CEILING) {
    return { action: 'BUY', reasonCode: 'hammerConfirm' }
  }
  // SELL case 1: bearish engulfing with close below MA20.
  if (bearishEngulfing && ma20 !== null && close < ma20) {
    return { action: 'SELL', reasonCode: 'bearishEngulfingConfirm' }
  }
  // SELL case 2: shooting star with falling RSI while RSI >= 50.
  if (shootingStar && rsi !== null && prevRsi !== null && rsi < prevRsi && rsi >= RSI_CONFIRM_FLOOR) {
    return { action: 'SELL', reasonCode: 'shootingStarConfirm' }
  }
  if (ma20 === null || ma60 === null) return { action: 'HOLD', reasonCode: INSUFFICIENT_HISTORY }
  return { action: 'HOLD', reasonCode: HOLD_REASON }
}

export function candlestickConfirmationStrategy(): Strategy {
  return {
    id: 'candlestick_confirmation',
    nameKey: NAME_KEY,
    purposeKey: PURPOSE_KEY,
    decide: candlestickConfirmationDecide,
  }
}
