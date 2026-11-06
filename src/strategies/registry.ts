/* Strategy registry exposing the five deterministic strategies with stable ids
   and bundled localization keys. Never hardcodes translated UI text. */

import type { Strategy } from './types'
import type { StrategyId } from '../config/backtest'
import { trendFollowingStrategy } from './trend-following'
import { meanReversionStrategy } from './mean-reversion'
import { scheduledDeploymentStrategy } from './scheduled-deployment'
import { candlestickConfirmationStrategy } from './candlestick-confirmation'
import { momentumBreakoutStrategy } from './momentum-breakout'

export const STRATEGY_BY_ID: Record<StrategyId, Strategy> = {
  trend_following: trendFollowingStrategy(),
  mean_reversion: meanReversionStrategy(),
  scheduled_deployment: scheduledDeploymentStrategy(),
  candlestick_confirmation: candlestickConfirmationStrategy(),
  momentum_breakout: momentumBreakoutStrategy(),
}

export function strategyById(id: StrategyId): Strategy {
  return STRATEGY_BY_ID[id]
}

export function strategyList(): Strategy[] {
  return [
    strategyById('trend_following'),
    strategyById('mean_reversion'),
    strategyById('scheduled_deployment'),
    strategyById('candlestick_confirmation'),
    strategyById('momentum_breakout'),
  ]
}
