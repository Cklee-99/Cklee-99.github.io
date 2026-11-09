/* Buy-and-hold benchmark over the configured inclusive date range.
   Two documented forms:
   - `buyAndHoldReturn(bars, range)`: a price-only helper returning last/first
     close relative to 1. It is not used by the simulator's comparable benchmark.
   - `runBuyAndHoldBenchmark(dataset, config)`: a deterministic buy-and-hold
     ACCOUNT that buys 100% of the available initial capital (subject to execution
     costs) at the first eligible session's open and holds to the last eligible
     session's close, applying the same fee, slippage, fractional-share, dividend,
     and split rules as the strategy simulation. Corporate actions are processed
     only when the input adjustment policy is known to leave OHLC unadjusted
     (`VALID_ADJUSTMENT_POLICY_NONE` = 'unadjusted'); otherwise the result is
     marked unavailable so corporate actions are never silently double-counted. */

import type { DailyBar, MarketDataset } from '../data/market'
import type { BacktestConfig } from '../config/backtest'
import { VALID_ADJUSTMENT_POLICY_NONE } from '../data/market'
import { initialPortfolio, applyCorporateActions, applyBuy } from './accounting'

export type DateRange = { startDate: string; endDate: string }

export function buyAndHoldReturn(bars: readonly DailyBar[], range: DateRange): number | null {
  const inRange = bars.filter((b) => b.date >= range.startDate && b.date <= range.endDate)
  if (inRange.length < 2) return null
  const first = inRange[0].close
  const last = inRange[inRange.length - 1].close
  if (first <= 0) return null
  return last / first - 1
}

/** Explicit account-level buy-and-hold benchmark result. `available` is false
    when the range is empty, whole-share purchase is impossible, or the corporate
    adjustment policy cannot be safely combined with separate dividend/split
    processing. Unavailable benchmarks are never fabricated to a plausible value. */
/** One daily benchmark account equity point, keyed by session ISO date. */
export interface BenchmarkDailyPoint {
  date: string
  equity: number
}

export interface BenchmarkAccountResult {
  available: boolean
  initialCapital: number
  /** First eligible session's ISO date (the purchase date). */
  startDate: string | null
  /** Last eligible session's ISO date (the valuation date). */
  endDate: string | null
  /** Buy execution price = open × (1 + buy slippage). */
  initialExecutionPrice: number | null
  executedShares: number | null
  buyFee: number | null
  slippageCost: number | null
  dividendCash: number
  finalPositionValue: number | null
  finalCash: number | null
  finalEquity: number | null
  totalReturn: number | null
  /** Daily benchmark account equity values (keyed by session ISO date) from the
      purchase-day close through the last eligible session's close. Never an
      interpolated or fabricated series. */
  dailyEquity: BenchmarkDailyPoint[]
  warnings: string[]
}

function unavailable(
  initialCapital: number,
  warnings: string[],
  startDate: string | null = null,
  endDate: string | null = null,
): BenchmarkAccountResult {
  return {
    available: false,
    initialCapital,
    startDate,
    endDate,
    initialExecutionPrice: null,
    executedShares: null,
    buyFee: null,
    slippageCost: null,
    dividendCash: 0,
    finalPositionValue: null,
    finalCash: null,
    finalEquity: null,
    totalReturn: null,
    dailyEquity: [],
    warnings,
  }
}

export function runBuyAndHoldBenchmark(dataset: MarketDataset, config: BacktestConfig): BenchmarkAccountResult {
  const bars = dataset.bars
  let first = -1
  let last = -1
  for (let i = 0; i < bars.length; i++) {
    const d = bars[i].date
    if (d >= config.startDate && first < 0) first = i
    if (d >= config.startDate && d <= config.endDate) last = i
  }
  if (first < 0 || last < first) return unavailable(config.initialCapital, ['benchmarkNoRange'])

  if (dataset.adjustmentPolicy !== VALID_ADJUSTMENT_POLICY_NONE) {
    // OHLC adjustment policy is incompatible with *separate* dividend/split
    // processing: applying both would double-count the corporate action.
    return unavailable(config.initialCapital, ['benchmarkAdjustmentUnsupported'], bars[first].date, bars[last].date)
  }

  // Buy at the first eligible session's open. No future prices are consulted.
  const open = bars[first].open
  const execPrice = open * (1 + config.slippage)
  if (open <= 0 || execPrice <= 0) return unavailable(config.initialCapital, ['benchmarkNoRange'], bars[first].date, bars[last].date)

  // 100% of the available initial capital, subject to execution costs; the
  // strategy's configurable maximum-position allocation is NOT applied here.
  const state = initialPortfolio(config.initialCapital)
  const spendCap = 1 + config.feeRate
  const spend = spendCap > 0 ? state.cash / spendCap : 0
  const sharesFrac = spend / execPrice
  const shares = config.fractionalShares ? sharesFrac : Math.floor(sharesFrac)
  if (shares <= 0) return unavailable(config.initialCapital, ['benchmarkNoPurchase'], bars[first].date, bars[last].date)

  const gross = shares * execPrice
  const buyFee = gross * config.feeRate
  applyBuy(state, shares, gross, buyFee)
  const slippageCost = shares * open * config.slippage

  // Hold through the remaining sessions, applying dividends and splits with the
  // same effective timing as the main simulation (before a session's close), and
  // record the account's equity at each eligible session close.
  const dailyEquity: BenchmarkDailyPoint[] = []
  dailyEquity.push({ date: bars[first].date, equity: state.cash + state.shares * bars[first].close })
  let dividendCash = 0
  for (let i = first + 1; i <= last; i++) {
  const dividend = bars[i].dividend ?? 0
  if (state.shares > 0 && dividend > 0) dividendCash += state.shares * dividend
    applyCorporateActions(state, bars[i].dividend, bars[i].splitRatio)
    dailyEquity.push({ date: bars[i].date, equity: state.cash + state.shares * bars[i].close })
  }

  const finalPositionValue = state.shares * bars[last].close
  const finalEquity = state.cash + finalPositionValue
  const totalReturn = config.initialCapital > 0 ? finalEquity / config.initialCapital - 1 : null

  return {
    available: true,
    initialCapital: config.initialCapital,
    startDate: bars[first].date,
    endDate: bars[last].date,
    initialExecutionPrice: execPrice,
    executedShares: shares,
    buyFee,
    slippageCost,
    dividendCash,
    finalPositionValue,
    finalCash: state.cash,
    finalEquity,
    totalReturn,
    dailyEquity,
    warnings: [],
  }
}
