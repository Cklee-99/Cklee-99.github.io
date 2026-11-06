/* Deterministic accounting and execution tests: order sizing, fees, slippage,
   fractional shares, corporate actions, and cash/position invariants. */

import { describe, expect, it } from 'vitest'
import {
  initialPortfolio,
  applyCorporateActions,
  applyBuy,
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
