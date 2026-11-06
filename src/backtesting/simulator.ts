/* Deterministic backtest simulator. Runs the selected strategy over an eligible
   date range, executes queued orders at the next session open, marks to market
   daily, and produces decisions, ledger, snapshots, benchmark, and metrics.
   Warm-up bars before the start date feed indicators but never create trades or
   change the initial capital. */

import type { DailyBar, MarketDataset } from '../data/market'
import type { BacktestConfig } from '../config/backtest'
import type { StrategyAction, StrategyContext } from '../strategies/types'
import { strategyById } from '../strategies/registry'
import { sma } from '../indicators/series'
import { bollingerBands } from '../indicators/bollinger'
import { rsi } from '../indicators/rsi'
import { findPatterns } from '../indicators/patterns'
import { initialPortfolio, applyCorporateActions, type PortfolioState, type PositionSnapshot } from './accounting'
import { executeBuy, executeSell, type ExecutionParams } from './execution'
import { buyAndHoldReturn } from './benchmark'
import { computeSummary } from './performance'
import type { DailySnapshot, DecisionRecord, ExecutedOrder, SkippedOrder, SimulationResult } from './types'

const DEFAULT_TRANCHE_COUNT = 12

function buildContext(
  bars: readonly DailyBar[],
  index: number,
  config: BacktestConfig,
  ma5: readonly (number | null)[],
  ma20: readonly (number | null)[],
  ma60: readonly (number | null)[],
  bollUpper: readonly (number | null)[],
  bollMiddle: readonly (number | null)[],
  bollLower: readonly (number | null)[],
  rsi14: readonly (number | null)[],
  state: PortfolioState,
  equity: number,
  positionValue: number,
  simStart: number,
): StrategyContext {
  const prefix: DailyBar[] = bars.slice(0, index + 1)
  const patterns = findPatterns(prefix)
  const isMonthStart = index === simStart || bars[index - 1].date.slice(0, 7) !== bars[index].date.slice(0, 7)
  return {
    bars: prefix,
    index,
    indicators: { ma5, ma20, ma60, bollingerUpper: bollUpper, bollingerMiddle: bollMiddle, bollingerLower: bollLower, rsi14 },
    patterns,
    cash: state.cash,
    equity,
    positionValue,
    allocationRatio: config.allocation,
    feeRate: config.feeRate,
    slippage: config.slippage,
    initialCapital: config.initialCapital,
    trancheCount: DEFAULT_TRANCHE_COUNT,
    isFirstSimulatedSessionOfMonth: isMonthStart,
  }
}

export function runSimulation(dataset: MarketDataset, config: BacktestConfig): SimulationResult {
  const bars = dataset.bars
  let simStart = -1
  let simEnd = -1
  for (let i = 0; i < bars.length; i++) {
    const d = bars[i].date
    if (d >= config.startDate && simStart < 0) simStart = i
    if (d >= config.startDate && d <= config.endDate) simEnd = i
  }
  if (simStart < 0 || simEnd < simStart) {
    return {
      config,
      decisions: [],
      ledger: [],
      skippedOrders: [],
      snapshots: [],
      summary: computeSummary(config, [], [], null),
      warnings: ['insufficientSimRange'],
      startDate: null,
      endDate: null,
    }
  }

  const closes = bars.map((b) => b.close)
  const ma5 = sma(closes, 5)
  const ma20 = sma(closes, 20)
  const ma60 = sma(closes, 60)
  const bb = bollingerBands(closes, 20, 2)
  const rsi14 = rsi(closes, 14)

  const strategy = strategyById(config.strategy)
  const state = initialPortfolio(config.initialCapital)
  const params: ExecutionParams = {
    feeRate: config.feeRate,
    slippage: config.slippage,
    allocationRatio: config.allocation,
    fractionalShares: config.fractionalShares,
  }

  const decisions: DecisionRecord[] = []
  const ledger: ExecutedOrder[] = []
  const skippedOrders: SkippedOrder[] = []
  const snapshots: DailySnapshot[] = []
  const warnings: string[] = []

  let queued: { action: StrategyAction; reasonCode: string; buyBudget?: number } | null = null

  for (let i = simStart; i <= simEnd; i++) {
    const bar = bars[i]
    applyCorporateActions(state, bar.dividend, bar.splitRatio)
    let dayFees = 0
    if (queued) {
      const prev = snapshots.length > 0
        ? { equity: snapshots[snapshots.length - 1].equity, positionValue: snapshots[snapshots.length - 1].positionValue }
        : { equity: config.initialCapital, positionValue: 0 }
      if (queued.action === 'BUY') {
        const result = executeBuy(state, prev as PositionSnapshot, bar.open, bar.date, params, queued.reasonCode, queued.buyBudget ?? null)
        if (result.order) {
          ledger.push(result.order)
          dayFees = result.order.fee
        } else {
          skippedOrders.push({ date: bar.date, action: 'BUY', reasonCode: queued.reasonCode, buyBudget: queued.buyBudget })
        }
      } else {
        const result = executeSell(state, bar.open, bar.date, params, queued.reasonCode)
        if (result.order) {
          ledger.push(result.order)
          dayFees = result.order.fee
        } else {
          skippedOrders.push({ date: bar.date, action: 'SELL', reasonCode: queued.reasonCode })
        }
      }
      queued = null
    }

    const positionValue = state.shares * bar.close
    const equity = state.cash + positionValue
    snapshots.push({ date: bar.date, cash: state.cash, shares: state.shares, positionValue, equity, dayFees })

    const context = buildContext(
      bars,
      i,
      config,
      ma5,
      ma20,
      ma60,
      bb.upper,
      bb.middle,
      bb.lower,
      rsi14,
      state,
      equity,
      positionValue,
      simStart,
    )
    const decision = strategy.decide(context)
    decisions.push({ date: bar.date, action: decision.action, reasonCode: decision.reasonCode, buyBudget: decision.buyBudget })
    // Only BUY/SELL become orders; HOLD clears the queue so it never trades.
    if (i < simEnd && decision.action !== 'HOLD') {
      queued = { action: decision.action, reasonCode: decision.reasonCode, buyBudget: decision.buyBudget }
    }
  }

  if (queued) skippedOrders.push({ date: bars[simEnd].date, action: queued.action, reasonCode: queued.reasonCode, buyBudget: queued.buyBudget })

  if (decisions.some((d) => d.reasonCode === 'insufficientHistory')) warnings.push('insufficientIndicatorHistory')
  if (ledger.filter((o) => o.action === 'SELL').length === 0) warnings.push('noClosedTrades')
  if (skippedOrders.length > 0) warnings.push('skippedOrders')

  const benchmarkReturn = buyAndHoldReturn(bars, { startDate: config.startDate, endDate: config.endDate })
  const summary = computeSummary(config, snapshots, ledger, benchmarkReturn)

  return {
    config,
    decisions,
    ledger,
    skippedOrders,
    snapshots,
    summary,
    warnings,
    startDate: bars[simStart].date,
    endDate: bars[simEnd].date,
  }
}
