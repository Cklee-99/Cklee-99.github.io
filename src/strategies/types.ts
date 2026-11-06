/* Strategy domain model: typed actions, a read-only decision context, and the
   Strategy contract. Strategies never touch orders, accounting, React, or UI. */

import type { DailyBar } from '../data/market'
import type { PatternResult } from '../indicators/patterns'
import type { StrategyId } from '../config/backtest'

export type StrategyAction = 'BUY' | 'SELL' | 'HOLD'

/** Indicator arrays aligned to the full source series; a strategy may only read
    values at or before its decision index. */
export interface StrategyIndicators {
  ma5: readonly (number | null)[]
  ma20: readonly (number | null)[]
  ma60: readonly (number | null)[]
  bollingerUpper: readonly (number | null)[]
  bollingerMiddle: readonly (number | null)[]
  bollingerLower: readonly (number | null)[]
  rsi14: readonly (number | null)[]
}

/** Read-only snapshot ending at the decision session. `bars` is truncated to the
    prefix bars[0..index] so future bars cannot be reached, and indicators are
    likewise only available up to `index`. Portfolio fields are the state through
    the decision session's close (before any next-session execution). */
export interface StrategyContext {
  bars: readonly DailyBar[]
  index: number
  indicators: StrategyIndicators
  patterns: readonly PatternResult[]
  cash: number
  equity: number
  positionValue: number
  allocationRatio: number
  feeRate: number
  slippage: number
  initialCapital: number
  trancheCount: number
  isFirstSimulatedSessionOfMonth: boolean
}

export interface StrategyDecision {
  action: StrategyAction
  reasonCode: string
  /** Optional explicit gross cash budget (before costs) for BUY sizing, used by
      strategies such as scheduled deployment that need explicit tranches. */
  buyBudget?: number
}

export interface Strategy {
  id: StrategyId
  nameKey: string
  purposeKey: string
  decide(context: StrategyContext): StrategyDecision
}

export const INSUFFICIENT_HISTORY = 'insufficientHistory'
export const HOLD_REASON = 'hold'
