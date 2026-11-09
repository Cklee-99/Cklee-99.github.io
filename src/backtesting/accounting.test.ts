/* Deterministic accounting and execution tests: order sizing, fees, slippage,
   fractional shares, corporate actions, and cash/position invariants. */

import { describe, expect, it } from 'vitest'
import {
  initialPortfolio,
  applyCorporateActions,
  applyBuy,
  applySell,
  type PortfolioState,
} from './accounting'
import { sizeBuy, executeBuy, executeSell, executionPrice, type ExecutionParams } from './execution'

const params = (fractionalShares: boolean = true): ExecutionParams => ({
  feeRate: 0.001,
  slippage: 0.001,
  allocationRatio: 1,
  fractionalShares,
})

describe('execution price', () => {
  it('applies slippage upward on a buy and downward on a sell', () => {
    const open = 100
    expect(executionPrice(open, 'BUY', 0.001)).toBe(100.1)
    expect(executionPrice(open, 'SELL', 0.001)).toBe(99.9)
  })
})

describe('buy sizing', () => {
  it('sizes a buy by available cash, allocation capacity, and fee headroom', () => {
    const state: PortfolioState = { cash: 10000, shares: 0, costBasisPerShare: 0 }
    const snapshot = { equity: 10000, positionValue: 0 }
    const sizing = sizeBuy(state, snapshot, 100, params(), null)
    expect(sizing.shares).toBeGreaterThan(0)
    // gross + fee must not exceed cash.
    expect(sizing.gross + sizing.fee).toBeLessThanOrEqual(state.cash)
    expect(sizing.gross / sizing.shares).toBe(100.1) // open * (1 + slippage)
  })

  it('caps spending by explicit buy budget', () => {
    const state: PortfolioState = { cash: 4000, shares: 0, costBasisPerShare: 0 }
    const snapshot = { equity: 4000, positionValue: 0 }
    const sizing = sizeBuy(state, snapshot, 100, params(), 1000)
    expect(sizing.gross).toBeLessThanOrEqual(1000)
    expect(sizing.gross + sizing.fee).toBeLessThanOrEqual(state.cash)
  })

  it('rounds to whole shares when fractional shares are disabled', () => {
    const state: PortfolioState = { cash: 10000, shares: 0, costBasisPerShare: 0 }
    const snapshot = { equity: 10000, positionValue: 0 }
    const sizing = sizeBuy(state, snapshot, 100, params(false), null)
    expect(sizing.shares).toBe(Math.floor(sizing.shares))
  })

  it('never lets a buy make cash negative', () => {
    const state: PortfolioState = { cash: 10000, shares: 0, costBasisPerShare: 0 }
    const snapshot = { equity: 10500, positionValue: 0 }
    executeBuy(state, snapshot, 100, '2024-01-02', params(), 'buy', null)
    expect(state.cash).toBeGreaterThanOrEqual(0)
  })
})

describe('order execution', () => {
  it('executes a buy and updates shares, cash, and average cost basis', () => {
    const state: PortfolioState = { cash: 10000, shares: 0, costBasisPerShare: 0 }
    const snapshot = { equity: 10000, positionValue: 0 }
    const result = executeBuy(state, snapshot, 100, '2024-01-02', params(), 'buy', null)
    const order = result.order!
    expect(order).not.toBeNull()
    expect(state.shares).toBe(order.shares)
    expect(state.cash).toBe(10000 - (order.gross + order.fee))
    expect(state.costBasisPerShare).toBeGreaterThan(0)
  })

  it('sells the entire position and realizes P&L', () => {
    const state: PortfolioState = { cash: 10000, shares: 10, costBasisPerShare: 90 }
    const result = executeSell(state, 100, '2024-01-03', params(), 'sell')
    const order = result.order!
    expect(order).not.toBeNull()
    expect(order.action).toBe('SELL')
    expect(state.shares).toBe(0)
    expect(order.realizedPnL).toBeGreaterThan(0)
  })

  it('returns no order when the position is empty', () => {
    const state = initialPortfolio(10000)
    const result = executeSell(state, 100, '2024-01-03', params(), 'sell')
    expect(result.order).toBeNull()
    expect(state.cash).toBe(10000)
  })
})

describe('corporate actions', () => {
  it('credits cash for a dividend per share', () => {
    const state: PortfolioState = { cash: 100, shares: 50, costBasisPerShare: 10 }
    applyCorporateActions(state, 0.5, undefined)
    expect(state.cash).toBe(100 + 50 * 0.5)
  })

  it('scales shares and adjusts per-share basis for a split', () => {
    const state: PortfolioState = { cash: 0, shares: 10, costBasisPerShare: 20 }
    applyCorporateActions(state, undefined, 2)
    expect(state.shares).toBe(20)
    expect(state.costBasisPerShare).toBe(10)
  })
})

describe('invariants', () => {
  it('applies a buy without making shares or cash negative', () => {
    const state: PortfolioState = { cash: 500, shares: 0, costBasisPerShare: 0 }
    applyBuy(state, 3, 400, 0.4)
    expect(state.shares).toBe(3)
    expect(state.cash).toBeCloseTo(99.6, 10)
  })
})

describe('cost basis includes buy-side fees', () => {
  it('weights the average cost basis with the buy fee and realizes both fees on a sell', () => {
    const state = initialPortfolio(10000)
    applyBuy(state, 10, 900, 1)
    // Basis = (10×0 + 900 + 1) / 10 = 90.1 per share. Cash pays gross + fee.
    expect(state.costBasisPerShare).toBeCloseTo(90.1, 10)
    expect(state.cash).toBeCloseTo(10000 - 901, 10)
    const sold = applySell(state, 10, 950, 0.95)
    // Realized P&L = (950 − 0.95) − 10×90.1 = 949.05 − 901 = 48.05.
    expect(sold.realizedPnL).toBeCloseTo(48.05, 10)
    expect(state.cash).toBeCloseTo(10000 - 901 + 949.05, 10)
  })

  it('updates the weighted average cost basis across multiple buys with different prices and fees', () => {
    const state = initialPortfolio(10000)
    applyBuy(state, 4, 360, 0.4) // basis 90.1/share
    applyBuy(state, 6, 660, 0.6) // shares 10, basis (4×90.1 + 660.6)/10 = 102.1
    expect(state.shares).toBe(10)
    expect(state.costBasisPerShare).toBeCloseTo(102.1, 10)
    const sold = applySell(state, 10, 1100, 1.1)
    expect(sold.realizedPnL).toBeCloseTo(1100 - 1.1 - 1021, 10)
  })

  it('makes a price-stable round trip unprofitable when both fees apply', () => {
    const state = initialPortfolio(1000)
    applyBuy(state, 1, 100, 1) // basis 101
    const sold = applySell(state, 1, 100, 1) // (100 − 1) − 101 = −2
    expect(sold.realizedPnL).toBeCloseTo(-2, 10)
    expect(state.cash).toBeCloseTo(1000 - 101 + 99, 10)
  })

  it('reports exactly break-even when the sell proceeds net of fee equal the fee-inclusive basis', () => {
    const state = initialPortfolio(1000)
    applyBuy(state, 1, 90.9, 0.1) // basis 91.0
    const sold = applySell(state, 1, 92, 1) // (92 − 1) − 91 = 0
    expect(sold.realizedPnL).toBeCloseTo(0, 10)
  })

  it('keeps average cost basis correct for fractional share lots', () => {
    const state = initialPortfolio(1000)
    applyBuy(state, 3.7, 333, 0.333) // basis (333 + 0.333) / 3.7 = 90.09
    applyBuy(state, 2.3, 207, 0.207) // shares 6, basis (3.7×90.09 + 207.207)/6
    expect(state.shares).toBe(6)
    expect(state.costBasisPerShare).toBeCloseTo(90.09, 10)
  })

  it('leaves the zero-fee behavior unchanged', () => {
    const state = initialPortfolio(1000)
    applyBuy(state, 5, 500, 0)
    expect(state.costBasisPerShare).toBe(100)
    const sold = applySell(state, 5, 600, 0)
    expect(sold.realizedPnL).toBe(100)
    expect(state.cash).toBe(1100)
  })

  it('counts each fee exactly once across a buy-and-sell round trip', () => {
    const state = initialPortfolio(1000)
    applyBuy(state, 5, 400, 0.4)
    applySell(state, 5, 500, 0.5)
    // Cash = 1000 − (400 + 0.4) + (500 − 0.5) = 1099.1; each fee removed once.
    expect(state.cash).toBeCloseTo(1099.1, 10)
    expect(state.shares).toBe(0)
  })

  it('reconciles equity as cash plus position market value after a buy', () => {
    const state = initialPortfolio(10000)
    applyBuy(state, 10, 900, 1)
    const positionValue = 10 * 95
    expect(state.cash + positionValue).toBeCloseTo(10000 - 901 + 950, 10)
  })
})
