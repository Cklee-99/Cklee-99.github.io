/* Deterministic demonstration market data. Synthetic, clearly labeled DEMO data
   for development and educational UI testing. It is never genuine historical
   prices. The same input always produces the same bars. */

import {
  VALID_ADJUSTMENT_POLICY_NONE,
  normalizeBars,
  type DailyBar,
  type DataRequest,
  type MarketDataLoadResult,
  type MarketDataSource,
  type MarketDataset,
  type RawBar,
  type DataSourceType,
} from './market'

export const DEMO_SYMBOL = 'DEMO'
export const DEMO_START_DATE = '2024-01-02'
export const DEMO_BAR_COUNT = 260

/** Deterministic LCG: fixed state produces the identical sequence every run. */
function nextRand(state: number): number {
  return (state * 1103515245 + 12345) % 2147483648
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Returns the next weekday date after the given ISO date (ISO calendar only). */
function nextTradingDay(iso: string): string {
  const [y, m, d] = iso.split('-').map((part) => parseInt(part, 10))
  const date = new Date(y, m - 1, d + 1)
  const weekday = date.getDay()
  if (weekday === 6) return formatDate(new Date(y, m - 1, d + 3))
  if (weekday === 0) return formatDate(new Date(y, m - 1, d + 2))
  return formatDate(date)
}

/** Builds the deterministic DEMO daily bars (sorted, unique, valid OHLCV). */
export function createDemoBars(): DailyBar[] {
  const rows: RawBar[] = []
  let state = 1
  let price = 100
  let date = DEMO_START_DATE
  for (let i = 0; i < DEMO_BAR_COUNT; i++) {
    state = nextRand(state)
    const driftPct = (state % 301 - 150) / 10000 // ~ -1.5%..+1.5%
    const gapPct = ((state >> 8) % 7 - 3) / 1000
    const open = price * (1 + gapPct)
    const close = open * (1 + driftPct)
    const high = Math.max(open, close) * (1 + ((state >> 4) % 5) / 500)
    const low = Math.min(open, close) * (1 - ((state >> 6) % 5) / 500)
    const volume = 1000000 + ((state >> 10) % 90) * 10000
    rows.push({ date, open, high, low, close, volume })
    price = close
    date = nextTradingDay(date)
  }

  const results = normalizeBars(rows, { symbol: DEMO_SYMBOL, sourceType: 'demo' })
  return results.bars
}

/** Normalized, annotated DEMO dataset (source type demo, never provider/csv). */
export function loadDemoDataset(): MarketDataset {
  const bars = createDemoBars()
  return {
    symbol: DEMO_SYMBOL,
    sourceType: 'demo',
    dateRange: { start: bars[0].date, end: bars[bars.length - 1].date },
    bars,
    validCount: bars.length,
    adjustmentPolicy: VALID_ADJUSTMENT_POLICY_NONE,
    requestedRange: undefined,
  }
}

/** Demonstration source implementing the replaceable provider interface.
    Demo data ignores the requested range by design and is never online data. */
export function createDemoDataSource(): MarketDataSource {
  return {
    sourceType: 'demo',
    providerId: undefined,
    load: (request: DataRequest): Promise<MarketDataLoadResult> => {
      const base = loadDemoDataset()
      return Promise.resolve({
        dataset: {
          ...base,
          requestedRange: { start: request.startDate, end: request.endDate },
        },
        issues: [],
      })
    },
  }
}

export const DEMO_SOURCE_LABEL = 'demo'
export const DEMO_SOURCE_TYPE: DataSourceType = 'demo'
