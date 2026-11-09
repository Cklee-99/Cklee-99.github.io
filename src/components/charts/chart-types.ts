/* Typed chart-domain structures. Pure data only; never React or accounting.
   These types hold series that are safe to pass into Lightweight Charts v5.
   `BusinessDay` time values preserve the original ISO exchange dates without a
   timezone shift. Values that are null/NaN/Infinity are removed in chart-utils,
   never converted to zero, and never passed to the chart library. */

import type {
  BusinessDay,
  CandlestickData,
  HistogramData,
  LineData,
  SeriesMarker,
} from 'lightweight-charts'
import type { ExecutedOrder, SkippedOrder, DailySnapshot } from '../../backtesting/types'

/** A chart-data warning code. UI maps it to a localized label; it is never a
    hidden silent drop. */
export type ChartWarning = 'chartEmpty' | 'chartDuplicates' | 'chartBadOHLC' | 'chartNonFinite' | 'chartMisaligned' | 'chartBenchmarkMissing'

export interface ChartSeriesSet {
  candles: CandlestickData<BusinessDay>[]
  ma5: LineData[]
  ma20: LineData[]
  ma60: LineData[]
  bollUpper: LineData[]
  bollMiddle: LineData[]
  bollLower: LineData[]
  volume: HistogramData[]
  rsi: LineData[]
  markers: SeriesMarker<BusinessDay>[]
  warnings: ChartWarning[]
  /** ISO session dates aligned 1:1 with every derived indicator array. */
  dates: string[]
}

export interface PerformanceSeriesSet {
  equity: LineData[]
  benchmark: LineData[]
  benchmarkAvailable: boolean
  initialCapital: number
  drawdown: LineData[]
  warnings: ChartWarning[]
}

export type TimelineFilter = 'all' | 'executed' | 'buy' | 'sell' | 'hold' | 'skipped'

/** One trading session in the chronological decision/transaction timeline.
    A BUY/SELL decision is NOT an execution by itself; `order` only exists when
    the order actually filled that session, `skipped` when it could not fill. */
export interface TimelineRow {
  date: string
  decision: 'BUY' | 'SELL' | 'HOLD'
  reasonCode: string
  order: ExecutedOrder | null
  skipped: SkippedOrder | null
  snapshot: DailySnapshot | null
}
