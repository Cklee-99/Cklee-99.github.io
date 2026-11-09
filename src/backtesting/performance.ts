/* Deterministic performance metrics from daily snapshots and the order ledger.
   Metrics that cannot be computed meaningfully are null, never a fabricated zero.
   Documented conventions:
   - CAGR is annualized from the ACTUAL calendar days between the first and final
     snapshots (365.25 days/year), not from a fixed session count.
   - Volatility and Sharpe annualize per-trading-session returns with a fixed
     SESSIONS_PER_YEAR = 252, because the return observations are trading days.
   - Sharpe uses a zero risk-free rate (there is no separate cash benchmark), so
     the mean session excess return is the mean session return directly. */

import type { DailySnapshot, ExecutedOrder, PortfolioSummary } from './types'
import type { BacktestConfig } from '../config/backtest'

const SESSIONS_PER_YEAR = 252
const DAYS_PER_YEAR = 365.25

function isoDayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map((part) => parseInt(part, 10))
  return Math.round(new Date(y, m - 1, d).getTime() / 86_400_000)
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0
  let sum = 0
  for (const v of values) sum += v
  return sum / values.length
}

function populationStd(values: readonly number[]): number {
  if (values.length === 0) return 0
  const avg = mean(values)
  let variance = 0
  for (const v of values) variance += (v - avg) * (v - avg)
  return Math.sqrt(variance / values.length)
}

function dailyReturns(snapshots: readonly DailySnapshot[]): number[] {
  const out: number[] = []
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1].equity
    if (prev > 0 && snapshots[i].equity >= 0) out.push(snapshots[i].equity / prev - 1)
  }
  return out
}

function maxDrawdown(snapshots: readonly DailySnapshot[]): number | null {
  if (snapshots.length === 0) return null
  let peak = snapshots[0].equity
  let worst = 0
  for (const s of snapshots) {
    if (s.equity > peak) peak = s.equity
    if (peak > 0) worst = Math.min(worst, s.equity / peak - 1)
  }
  return worst
}

function averageExposure(snapshots: readonly DailySnapshot[]): number | null {
  let total = 0
  let count = 0
  for (const s of snapshots) {
    if (s.equity > 0) {
      total += s.positionValue / s.equity
      count++
    }
  }
  return count > 0 ? total / count : null
}

export function computeSummary(
  config: BacktestConfig,
  snapshots: readonly DailySnapshot[],
  ledger: readonly ExecutedOrder[],
  benchmarkReturn: number | null,
): PortfolioSummary {
  const initial = config.initialCapital
  const last = snapshots.length > 0 ? snapshots[snapshots.length - 1].equity : initial
  const totalReturn = initial > 0 ? last / initial - 1 : null
  // Elapsed period in actual calendar days between the first and final snapshots.
  const elapsedDays =
    snapshots.length > 1
      ? isoDayNumber(snapshots[snapshots.length - 1].date) - isoDayNumber(snapshots[0].date)
      : 0
  const cagr = totalReturn !== null && totalReturn > -1 && elapsedDays > 0
    ? Math.pow(last / initial, DAYS_PER_YEAR / elapsedDays) - 1
    : null

  const returns = dailyReturns(snapshots)
  const vol = returns.length >= 2 ? populationStd(returns) * Math.sqrt(SESSIONS_PER_YEAR) : null
  const std = populationStd(returns)
  const meanR = mean(returns)
  const sharpe = returns.length >= 2 && std > 0 ? (meanR / std) * Math.sqrt(SESSIONS_PER_YEAR) : null

  const sells = ledger.filter((o) => o.action === 'SELL')
  const wins = sells.filter((o) => o.realizedPnL !== undefined && o.realizedPnL > 0).length
  const closedWinRate = sells.length > 0 ? wins / sells.length : null

  const excessReturn = totalReturn !== null && benchmarkReturn !== null ? totalReturn - benchmarkReturn : null

  return {
    initialCapital: initial,
    finalEquity: last,
    totalReturn,
    cagr,
    maxDrawdown: maxDrawdown(snapshots),
    annualizedVolatility: vol,
    sharpeRatio: sharpe,
    tradeCount: ledger.length,
    closedWinRate,
    exposure: averageExposure(snapshots),
    benchmarkReturn,
    excessReturn,
  }
}
