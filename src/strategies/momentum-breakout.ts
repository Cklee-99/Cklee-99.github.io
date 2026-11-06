/* Momentum Breakout: RSI14, the upper Bollinger Band, and an MA20/MA60 trend
   filter. Requires an actual band-crossing breakout on the BUY side. */

import type { Strategy, StrategyContext, StrategyDecision } from './types'
import { HOLD_REASON, INSUFFICIENT_HISTORY } from './types'

const NAME_KEY = 'backtest.strategy.momentum_breakout'
const PURPOSE_KEY = 'backtest.strategy.purpose.momentum_breakout'

export const RSI_BREAKOUT_LEVEL = 60
export const RSI_EXIT_LEVEL = 50

export function momentumBreakoutDecide(context: StrategyContext): StrategyDecision {
  const { bars, indicators, index } = context
  if (index < 1) return { action: 'HOLD', reasonCode: INSUFFICIENT_HISTORY }
  const close = bars[index].close
  const prevClose = bars[index - 1].close
  const curUpper = indicators.bollingerUpper[index]
  const prevUpper = indicators.bollingerUpper[index - 1]
  const rsi = indicators.rsi14[index]
  const ma20 = indicators.ma20[index]
  const ma60 = indicators.ma60[index]
  if (curUpper === null || prevUpper === null || rsi === null || ma20 === null || ma60 === null) {
    return { action: 'HOLD', reasonCode: INSUFFICIENT_HISTORY }
  }
  if (prevClose <= prevUpper && close > curUpper && rsi >= RSI_BREAKOUT_LEVEL && ma20 > ma60) {
    return { action: 'BUY', reasonCode: 'breakoutBuy' }
  }
  if (close < ma20 || rsi < RSI_EXIT_LEVEL) return { action: 'SELL', reasonCode: 'momentumExit' }
  return { action: 'HOLD', reasonCode: HOLD_REASON }
}

export function momentumBreakoutStrategy(): Strategy {
  return {
    id: 'momentum_breakout',
    nameKey: NAME_KEY,
    purposeKey: PURPOSE_KEY,
    decide: momentumBreakoutDecide,
  }
}
