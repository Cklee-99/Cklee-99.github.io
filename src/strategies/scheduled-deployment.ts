/* Scheduled Capital Deployment (DCA): deploy existing starting capital in regular
   monthly tranches. Never assumes external deposits and never emits SELL signs.
   Eligibility is derived deterministically from simulation dates; a `buyBudget`
   limits each monthly order by remaining cash, allocation capacity, and costs. */

import type { Strategy, StrategyContext, StrategyDecision } from './types'
import { HOLD_REASON } from './types'

const NAME_KEY = 'backtest.strategy.scheduled_deployment'
const PURPOSE_KEY = 'backtest.strategy.purpose.scheduled_deployment'

export const DEFAULT_TRANCHE_COUNT = 12

export function scheduledDeploymentDecide(context: StrategyContext): StrategyDecision {
  if (!context.isFirstSimulatedSessionOfMonth) return { action: 'HOLD', reasonCode: HOLD_REASON }

  const tranche = context.initialCapital / Math.max(1, context.trancheCount)
  const costFactor = 1 + context.feeRate
  // Cash limited so that gross + fee never exceeds available cash.
  const cashLimited = context.cash / (costFactor > 0 ? costFactor : 1)
  // Allocation capacity capped in equity terms, bounded by realized position value.
  const capacityCash = Math.max(0, context.equity * context.allocationRatio - context.positionValue)
  const budget = Math.max(0, Math.min(tranche, cashLimited, capacityCash))
  if (budget <= 0) return { action: 'BUY', reasonCode: 'monthlyTrancheSkipped', buyBudget: 0 }
  return { action: 'BUY', reasonCode: 'monthlyTranche', buyBudget: budget }
}

export function scheduledDeploymentStrategy(): Strategy {
  return {
    id: 'scheduled_deployment',
    nameKey: NAME_KEY,
    purposeKey: PURPOSE_KEY,
    decide: scheduledDeploymentDecide,
  }
}
