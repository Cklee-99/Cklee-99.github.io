/* Portfolio accounting state and corporate-action handling.
   Pure deterministic functions; no order execution or React. */

export interface PortfolioState {
  cash: number
  shares: number
  costBasisPerShare: number
}

export interface PositionSnapshot {
  equity: number
  positionValue: number
}

export function initialPortfolio(cash: number): PortfolioState {
  return { cash, shares: 0, costBasisPerShare: 0 }
}

/** Applies references/corporate actions effective before a session open.
    Dividends pay per share in cash; a split scales the share count and divides
    the per-share basis. Absent fields leave the position unchanged. */
export function applyCorporateActions(state: PortfolioState, dividend?: number, splitRatio?: number): PortfolioState {
  if (state.shares > 0 && dividend !== undefined && dividend > 0) {
    state.cash += state.shares * dividend
  }
  if (state.shares > 0 && splitRatio !== undefined && splitRatio > 0 && splitRatio !== 1) {
    state.shares *= splitRatio
    state.costBasisPerShare = state.costBasisPerShare / splitRatio
  }
  return state
}

/** Returns the cash change of a completed buy. Never lets cash go negative.
    The average cost basis includes the BUY transaction fee, so the SELL realized
    P&L reflects both the buy and sell fees. Slippage is already inside `gross`
    (the execution price includes it) and is never added here a second time. */
export function applyBuy(state: PortfolioState, shares: number, gross: number, fee: number): PortfolioState {
  if (shares <= 0 || gross < 0) return state
  state.cash -= gross + fee
  if (state.cash < 0) state.cash = 0
  const newShares = state.shares + shares
  const basis = newShares > 0 ? (state.shares * state.costBasisPerShare + gross + fee) / newShares : 0
  state.shares = newShares
  state.costBasisPerShare = basis
  return state
}

/** Sells the entire open position and returns realized P&L (net proceeds less
    the sold position's average cost basis). */
export function applySell(
  state: PortfolioState,
  shares: number,
  gross: number,
  fee: number,
): { state: PortfolioState; realizedPnL: number } {
  const realizedPnL = (gross - fee) - shares * state.costBasisPerShare
  state.cash += gross - fee
  state.shares = 0
  state.costBasisPerShare = 0
  return { state, realizedPnL }
}
