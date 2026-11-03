/* Normalized market-data domain types, validation pipeline, and the replaceable
   provider interface. Pure and deterministic; no React or UI dependencies. */

export type DataSourceType = 'demo' | 'csv' | 'provider'

export interface DailyBar {
  date: string // ISO calendar date (YYYY-MM-DD). No timezone conversion.
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose?: number
  dividend?: number
  splitRatio?: number
}

export interface RawBar extends DailyBar {
  line?: number
}

export interface DateRange {
  start: string
  end: string
}

export interface MarketDataset {
  symbol: string
  sourceType: DataSourceType
  providerId?: string
  requestedRange?: DateRange
  dateRange: DateRange | null
  bars: readonly DailyBar[]
  validCount: number
  adjustmentPolicy: string
  importTimestamp?: string
}

export interface DataRequest {
  symbol: string
  startDate: string
  endDate: string
}

export type IssueCode =
  | 'rowBadDate'
  | 'rowMissingValue'
  | 'rowBadNumeric'
  | 'rowNonFinite'
  | 'rowBadOHLC'
  | 'rowNegativePrice'
  | 'rowNegativeVolume'
  | 'rowBadAdjustedClose'
  | 'rowBadDividend'
  | 'rowBadSplitRatio'
  | 'duplicateDate'
  | 'missingColumn'
  | 'emptyInput'
  | 'noValidRows'

export interface DataSourceIssue {
  code: IssueCode
  line?: number
  date?: string
}

export interface MarketDataLoadResult {
  dataset: MarketDataset | null
  issues: DataSourceIssue[]
}

/** Replaceable data-source contract. A future online provider can implement this
    interface without changing domain types or the indicator/backtest engines. */
export interface MarketDataSource {
  readonly sourceType: DataSourceType
  readonly providerId: string | undefined
  load(request: DataRequest): MarketDataLoadResult
}

export const VALID_ADJUSTMENT_POLICY_NONE = 'unadjusted'

/** Exact calendar-date check for YYYY-MM-DD with no timezone conversion. */
export function isPlainDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map((part) => parseInt(part, 10))
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function isFiniteNumber(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Validates one raw row into a typed bar, returning issues for every rule. */
export function validateRow(raw: RawBar): DataSourceIssue[] {
  const issues: DataSourceIssue[] = []
  const { date, open, high, low, close, volume } = raw

  if (!isPlainDate(date)) issues.push({ code: 'rowBadDate', line: raw.line, date })

  if (!isFiniteNumber(open) || open <= 0) issues.push({ code: 'rowNegativePrice', line: raw.line, date })
  if (!isFiniteNumber(high) || high <= 0) issues.push({ code: 'rowNegativePrice', line: raw.line, date })
  if (!isFiniteNumber(low) || low <= 0) issues.push({ code: 'rowNegativePrice', line: raw.line, date })
  if (!isFiniteNumber(close) || close <= 0) issues.push({ code: 'rowNegativePrice', line: raw.line, date })
  if (!isFiniteNumber(volume) || volume < 0) issues.push({ code: 'rowNegativeVolume', line: raw.line, date })

  if (!(high >= open && high >= low && high >= close && low <= open && low <= close)) {
    issues.push({ code: 'rowBadOHLC', line: raw.line, date })
  }

  if (raw.adjustedClose !== undefined && (!isFiniteNumber(raw.adjustedClose) || raw.adjustedClose <= 0)) {
    issues.push({ code: 'rowBadAdjustedClose', line: raw.line, date })
  }
  if (raw.dividend !== undefined && !isFiniteNumber(raw.dividend)) {
    issues.push({ code: 'rowBadDividend', line: raw.line, date })
  }
  if (raw.splitRatio !== undefined && (!isFiniteNumber(raw.splitRatio) || raw.splitRatio <= 0)) {
    issues.push({ code: 'rowBadSplitRatio', line: raw.line, date })
  }

  return issues
}

export interface NormalizeOptions {
  symbol: string
  sourceType: DataSourceType
  providerId?: string
  requestedRange?: DateRange
  adjustmentPolicy?: string
  importTimestamp?: string
}

export interface NormalizationResult {
  bars: DailyBar[]
  issues: DataSourceIssue[]
  acceptedCount: number
  rejectedCount: number
  dataset: MarketDataset | null
}

/** Deterministic normalization: validate rows, drop invalid rows, keep the first
    occurrence of each date, then sort ascending by date. Never interpolates. */
export function normalizeBars(rawRows: readonly RawBar[], options: NormalizeOptions): NormalizationResult {
  const issues: DataSourceIssue[] = []
  const valid: DailyBar[] = []
  const byLine: Record<number, DataSourceIssue[]> = {}

  for (const row of rawRows) {
    const rowIssues = validateRow(row)
    if (rowIssues.length > 0) {
      for (const issue of rowIssues) issues.push(issue)
      if (row.line && rowIssues.length > 0) byLine[row.line] = rowIssues
    } else {
      valid.push({
        date: row.date,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
        adjustedClose: row.adjustedClose,
        dividend: row.dividend,
        splitRatio: row.splitRatio,
      })
    }
  }

  // Duplicate dates: reject every later occurrence and report them.
  const seen: Record<string, boolean> = {}
  const accepted: DailyBar[] = []
  for (const bar of valid) {
    if (seen[bar.date]) {
      issues.push({ code: 'duplicateDate', date: bar.date })
    } else {
      seen[bar.date] = true
      accepted.push(bar)
    }
  }
  accepted.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0)

  const rejectedCount = rawRows.length - accepted.length
  const dataset =
    accepted.length > 0
      ? {
          symbol: options.symbol,
          sourceType: options.sourceType,
          providerId: options.providerId,
          requestedRange: options.requestedRange,
          dateRange: { start: accepted[0].date, end: accepted[accepted.length - 1].date },
          bars: accepted,
          validCount: accepted.length,
          adjustmentPolicy: options.adjustmentPolicy ?? VALID_ADJUSTMENT_POLICY_NONE,
          importTimestamp: options.importTimestamp,
        }
      : null

  return {
    bars: accepted,
    issues,
    acceptedCount: accepted.length,
    rejectedCount,
    dataset,
  }
}

