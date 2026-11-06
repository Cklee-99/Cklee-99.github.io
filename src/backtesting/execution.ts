/* Order sizing and execution at the next eligible session's open.
   BUY sizes by available cash, allocation capacity, and an optional explicit
   budget; SELL exits the entire open position. No look-ahead: the snapshot used
   for capacity is from the *previous* session's close, and the execution price
   only uses the current session's open. */

import type { StrategyAction } from '../strategies/types'
import { applyBuy, applySell, type PortfolioState, type PositionSnapshot } from './accounting'
import type { ExecutedOrder } from './types'

export interface ExecutionParams {
  feeRate: number
  slippage: number
  allocationRatio: number
  fractionalShares: boolean
}

export function executionPrice(open: number, action: StrategyAction, slippage: number): number {
  return action === 'SELL' ? open * (1 - slippage) : open * (1 + slippage)
}

export function sizeBuy(
  state: PortfolioState,
  snapshot: PositionSnapshot,
  open: number,
  params: ExecutionParams,
  budget: number | null,
): { shares: number; gross: number; fee: number; execPrice: number } {
  const execPrice = executionPrice(open, 'BUY', params.slippage)
  if (execPrice <= 0 || open <= 0) return { shares: 0, gross: 0, fee: 0, execPrice }
  const cashLimited = state.cash / (1 + params.feeRate)
  const capacityCash = Math.max(0, snapshot.equity * params.allocationRatio - snapshot.positionValue)
  const spend = Math.max(0, Math.min(budget === null ? Infinity : budget, cashLimited, capacityCash))
  const sharesFrac = spend / execPrice
  const shares = params.fractionalShares ? sharesFrac : Math.floor(sharesFrac)
  const gross = shares * execPrice
  if (shares <= 0) return { shares: 0, gross: 0, fee: 0, execPrice }
  const fee = gross * params.feeRate
  return { shares, gross, fee, execPrice }
}

export function executeBuy(
  state: PortfolioState,
  snapshot: PositionSnapshot,
  open: number,
  date: string,
  params: ExecutionParams,
  reasonCode: string,
  budget: number | null,
): { state: PortfolioState; order: ExecutedOrder | null } {
  const sizing = sizeBuy(state, snapshot, open, params, budget)
  if (sizing.shares <= 0) return { state, order: null }
  applyBuy(state, sizing.shares, sizing.gross, sizing.fee)
  const slippageCost = sizing.shares * open * params.slippage
  const order: ExecutedOrder = {
    date,
    action: 'BUY',
    shares: sizing.shares,
    price: sizing.execPrice,
    openPrice: open,
    gross: sizing.gross,
    fee: sizing.fee,
    slippageCost,
    net: -(sizing.gross + sizing.fee),
    reasonCode,
  }
  return { state, order }
}

export function executeSell(
  state: PortfolioState,
  open: number,
  date: string,
  params: ExecutionParams,
  reasonCode: string,
): { state: PortfolioState; order: ExecutedOrder | null } {
  if (state.shares <= 0 || open <= 0) return { state, order: null }
  const execPrice = executionPrice(open, 'SELL', params.slippage)
  const shares = state.shares
  const gross = shares * execPrice
  const fee = gross * params.feeRate
  const { realizedPnL } = applySell(state, shares, gross, fee)
  const slippageCost = shares * open * params.slippage
  const order: ExecutedOrder = {
    date,
    action: 'SELL',
    shares,
    price: execPrice,
    openPrice: open,
    gross,
    fee,
    slippageCost,
    net: gross - fee,
    realizedPnL,
    reasonCode,
  }
  return { state, order }
}
