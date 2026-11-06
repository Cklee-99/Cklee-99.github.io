/* Trend Following: MA20/MA60 crossover with explicit entry and exit rules.
   Pure and deterministic; reads only data available through the decision session. */

import type { Strategy, StrategyContext, StrategyDecision } from './types'
import { HOLD_REASON, INSUFFICIENT_HISTORY } from './types'

const NAME_KEY = 'backtest.strategy.trend_following'
const PURPOSE_KEY = 'backtest.strategy.purpose.trend_following'

export function trendFollowingDecide(context: StrategyContext): StrategyDecision {
  const { indicators, index } = context
  if (index < 1) return { action: 'HOLD', reasonCode: INSUFFICIENT_HISTORY }
  const cur20 = indicators.ma20[index]
  const cur60 = indicators.ma60[index]
  const prev20 = indicators.ma20[index - 1]
  const prev60 = indicators.ma60[index - 1]
  if (cur20 === null || cur60 === null || prev20 === null || prev60 === null) {
    return { action: 'HOLD', reasonCode: INSUFFICIENT_HISTORY }
  }
  if (prev20 <= prev60 && cur20 > cur60) return { action: 'BUY', reasonCode: 'maCrossoverUp' }
  if (prev20 >= prev60 && cur20 < cur60) return { action: 'SELL', reasonCode: 'maCrossoverDown' }
  return { action: 'HOLD', reasonCode: HOLD_REASON }
}

export function trendFollowingStrategy(): Strategy {
  return {
    id: 'trend_following',
    nameKey: NAME_KEY,
    purposeKey: PURPOSE_KEY,
    decide: trendFollowingDecide,
  }
}
