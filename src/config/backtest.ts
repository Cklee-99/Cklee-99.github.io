/* Backtest configuration types, defaults, strategy catalogue, and validation.
   Pure and deterministic; no UI dependencies. */

export const DEFAULT_TICKER = 'SPY'
export const DEFAULT_BENCHMARK = 'SPY'
export const DEFAULT_INITIAL_CAPITAL = 10000
export const DEFAULT_ALLOCATION = 1.0
export const DEFAULT_FEE_RATE = 0.001
export const DEFAULT_SLIPPAGE = 0.001
export const DEFAULT_FRACTIONAL_SHARES = true

export const MAX_TICKER_LENGTH = 10
export const MAX_CAPITAL = 1_000_000_000
export const MAX_ALLOCATION = 1.0
export const MAX_FEE_RATE = 0.05
export const MAX_SLIPPAGE = 0.1

export type StrategyId =
  | 'trend_following'
  | 'mean_reversion'
  | 'scheduled_deployment'
  | 'candlestick_confirmation'
  | 'momentum_breakout'

export interface StrategyOption {
  id: StrategyId
}

export const STRATEGIES: StrategyOption[] = [
  { id: 'trend_following' },
  { id: 'mean_reversion' },
  { id: 'scheduled_deployment' },
  { id: 'candlestick_confirmation' },
  { id: 'momentum_breakout' },
]

export interface BacktestConfig {
  ticker: string
  strategy: StrategyId
  initialCapital: number
  startDate: string
  endDate: string
  benchmark: string
  allocation: number
  feeRate: number
  slippage: number
  fractionalShares: boolean
}

export type ValidationErrorCode =
  | 'badTicker'
  | 'badCapital'
  | 'invalidDates'
  | 'badAllocation'
  | 'badFee'
  | 'badSlippage'
  | 'badBenchmark'

export type FieldErrors = Partial<Record<string, ValidationErrorCode>>

export interface ValidationResult {
  valid: boolean
  errors: FieldErrors
}

function isTickerShape(value: string): boolean {
  const upper = value.toUpperCase()
  if (upper.length === 0 || upper.length > MAX_TICKER_LENGTH) return false
  return /^[A-Z0-9.-]+$/.test(upper)
}

function isPlainDate(value: string): boolean {
  // Accepts an ISO calendar date (YYYY-MM-DD).
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map((part) => parseInt(part, 10))
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function defaultEndDate(): string {
  const now = new Date()
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return iso
}

export function defaultStartDate(): string {
  // Recommend roughly two years of history for MA60 + warm-up backtests.
  const end = defaultEndDate()
  const year = parseInt(end.slice(0, 4), 10) - 2
  return `${year}-${end.slice(5, 7)}-${end.slice(8, 10)}`.padStart(10, '0')
}

export function validateBacktestConfig(config: BacktestConfig): ValidationResult {
  const errors: FieldErrors = {}

  const ticker = config.ticker.trim()
  if (!isTickerShape(ticker)) errors.ticker = 'badTicker'
  if (config.initialCapital <= 0 || config.initialCapital > MAX_CAPITAL) errors.initialCapital = 'badCapital'
  if (!isPlainDate(config.startDate) || !isPlainDate(config.endDate) || config.startDate > config.endDate) {
    errors.dates = 'invalidDates'
  }
  if (config.allocation < 0 || config.allocation > MAX_ALLOCATION) errors.allocation = 'badAllocation'
  if (config.feeRate < 0 || config.feeRate > MAX_FEE_RATE) errors.feeRate = 'badFee'
  if (config.slippage < 0 || config.slippage > MAX_SLIPPAGE) errors.slippage = 'badSlippage'
  if (!isTickerShape(config.benchmark.trim())) errors.benchmark = 'badBenchmark'

  return { valid: Object.keys(errors).length === 0, errors }
}
