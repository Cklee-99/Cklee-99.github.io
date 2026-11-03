/* Deterministic candlestick pattern recognition. Educational classification only;
   it never produces a trading instruction and never reads future bars. */

import type { DailyBar } from '../data/market'

export type PatternId =
  | 'doji'
  | 'bullishEngulfing'
  | 'bearishEngulfing'
  | 'hammer'
  | 'shootingStar'

export type PatternDirection = 'bullish' | 'bearish' | 'neutral'

export interface PatternResult {
  pattern: PatternId
  descriptionKey: string
  index: number
  date: string
  direction: PatternDirection
}

export const PATTERN_DOJI_BODY_RATIO = 0.1
export const PATTERN_SHADOW_BODY_RATIO = 2
export const PATTERN_TREND_LOOKBACK = 3

function body(bar: DailyBar): number {
  return Math.abs(bar.close - bar.open)
}
function range(bar: DailyBar): number {
  return bar.high - bar.low
}

export function isDoji(bar: DailyBar): boolean {
  const r = range(bar)
  if (r <= 0) return false
  return body(bar) <= PATTERN_DOJI_BODY_RATIO * r
}

export function isBullishEngulfing(prev: DailyBar, current: DailyBar): boolean {
  if (prev.close >= prev.open) return false // previous candle must be bearish
  if (current.close <= current.open) return false // current candle must be bullish
  return current.high >= prev.high && current.low <= prev.low
}

export function isBearishEngulfing(prev: DailyBar, current: DailyBar): boolean {
  if (prev.close <= prev.open) return false // previous candle must be bullish
  if (current.close >= current.open) return false // current candle must be bearish
  return current.high >= prev.high && current.low <= prev.low
}

function precedingTrend(bars: readonly DailyBar[], index: number, direction: 'up' | 'down'): boolean {
  if (index < PATTERN_TREND_LOOKBACK) return false
  for (let i = index - PATTERN_TREND_LOOKBACK + 1; i <= index - 1; i++) {
    const a = bars[i - 1]
    const b = bars[i]
    if (direction === 'up' ? b.close <= a.close : b.close >= a.close) return false
  }
  return true
}

export function isHammer(bar: DailyBar, prior: readonly DailyBar[], index: number): boolean {
  const r = range(bar)
  const b = body(bar)
  if (r <= 0 || b <= 0) return false
  const lower = Math.min(bar.open, bar.close) - bar.low
  const upper = bar.high - Math.max(bar.open, bar.close)
  if (lower < PATTERN_SHADOW_BODY_RATIO * b) return false
  if (upper > b) return false
  // Real body occupies the upper portion of the candle range.
  if (Math.min(bar.open, bar.close) < bar.low + r / 2) return false
  return precedingTrend(prior, index, 'down')
}

export function isShootingStar(bar: DailyBar, prior: readonly DailyBar[], index: number): boolean {
  const r = range(bar)
  const b = body(bar)
  if (r <= 0 || b <= 0) return false
  const lower = Math.min(bar.open, bar.close) - bar.low
  const upper = bar.high - Math.max(bar.open, bar.close)
  if (upper < PATTERN_SHADOW_BODY_RATIO * b) return false
  if (lower > b) return false
  // Real body occupies the lower portion of the candle range.
  if (Math.max(bar.open, bar.close) > bar.low + r / 2) return false
  return precedingTrend(prior, index, 'up')
}

const KEY = 'data.pattern'

/** Detects every supported pattern over the bars using only current+prior data. */
export function findPatterns(bars: readonly DailyBar[]): PatternResult[] {
  const out: PatternResult[] = []
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]
    if (isDoji(bar)) {
      out.push({ pattern: 'doji', descriptionKey: `${KEY}.doji`, index: i, date: bar.date, direction: 'neutral' })
    }
    if (i >= 1) {
      const prev = bars[i - 1]
      if (isBullishEngulfing(prev, bar)) {
        out.push({ pattern: 'bullishEngulfing', descriptionKey: `${KEY}.bullishEngulfing`, index: i, date: bar.date, direction: 'bullish' })
      }
      if (isBearishEngulfing(prev, bar)) {
        out.push({ pattern: 'bearishEngulfing', descriptionKey: `${KEY}.bearishEngulfing`, index: i, date: bar.date, direction: 'bearish' })
      }
    }
    if (isHammer(bar, bars, i)) {
      out.push({ pattern: 'hammer', descriptionKey: `${KEY}.hammer`, index: i, date: bar.date, direction: 'bullish' })
    }
    if (isShootingStar(bar, bars, i)) {
      out.push({ pattern: 'shootingStar', descriptionKey: `${KEY}.shootingStar`, index: i, date: bar.date, direction: 'bearish' })
    }
  }
  return out
}
