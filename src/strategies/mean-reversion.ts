/* Mean Reversion: RSI14 plus Bollinger Bands (20, 2) thresholds.
   Deterministic defaults are exposed as documented strategy parameters. */

import type { Strategy, StrategyContext, StrategyDecision } from './types'
import { HOLD_REASON, INSUFFICIENT_HISTORY } from './types'

const NAME_KEY = 'backtest.strategy.mean_reversion'
const PURPOSE_KEY = 'backtest.strategy.purpose.mean_reversion'

export const RSI_SELL_LEVEL = 70
export const RSI_BUY_LEVEL = 30

export function meanReversionDecide(context: StrategyContext): StrategyDecision {
  const { bars, indicators, index } = context
  const close = bars[index].close
  const lower = indicators.bollingerLower[index]
  const upper = indicators.bollingerUpper[index]
  const rsi = indicators.rsi14[index]
  if (lower === null || upper === null || rsi === null) {
    return { action: 'HOLD', reasonCode: INSUFFICIENT_HISTORY }
  }
  if (close <= lower && rsi <= RSI_BUY_LEVEL) return { action: 'BUY', reasonCode: 'meanRevBuy' }
  if (close >= upper || rsi >= RSI_SELL_LEVEL) return { action: 'SELL', reasonCode: 'meanRevSell' }
  return { action: 'HOLD', reasonCode: HOLD_REASON }
}

export function meanReversionStrategy(): Strategy {
  return {
    id: 'mean_reversion',
    nameKey: NAME_KEY,
    purposeKey: PURPOSE_KEY,
    decide: meanReversionDecide,
  }
}
