/* Backtesting result domain types. Deterministic and independent of React/UI. */

import type { BacktestConfig } from '../config/backtest'
import type { StrategyAction } from '../strategies/types'

export interface DecisionRecord {
  date: string
  action: StrategyAction
  reasonCode: string
  buyBudget?: number
}

export interface ExecutedOrder {
  date: string
  action: StrategyAction
  shares: number
  price: number
  openPrice: number
  gross: number
  fee: number
  slippageCost: number
  net: number
  realizedPnL?: number
  reasonCode: string
}

export interface SkippedOrder {
  date: string
  action: StrategyAction
  reasonCode: string
  buyBudget?: number
}

export interface DailySnapshot {
  date: string
  cash: number
  shares: number
  positionValue: number
  equity: number
  dayFees: number
}

export interface PortfolioSummary {
  initialCapital: number
  finalEquity: number
  totalReturn: number | null
  cagr: number | null
  maxDrawdown: number | null
  annualizedVolatility: number | null
  sharpeRatio: number | null
  tradeCount: number
  closedWinRate: number | null
  exposure: number | null
  benchmarkReturn: number | null
  excessReturn: number | null
}

export interface SimulationResult {
  config: BacktestConfig
  decisions: DecisionRecord[]
  ledger: ExecutedOrder[]
  skippedOrders: SkippedOrder[]
  snapshots: DailySnapshot[]
  summary: PortfolioSummary
  warnings: string[]
  startDate: string | null
  endDate: string | null
}
