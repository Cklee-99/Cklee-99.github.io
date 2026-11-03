import { describe, expect, it } from 'vitest'
import type { DailyBar } from '../data/market'
import { findPatterns, isDoji, isBullishEngulfing, isBearishEngulfing, isHammer, isShootingStar } from './patterns'

function bar(date: string, o: number, h: number, l: number, c: number, v = 1000): DailyBar {
  return { date, open: o, high: h, low: l, close: c, volume: v }
}

describe('candlestick patterns', () => {
  it('detects a doji with an existing candle range', () => {
    // body 0.1 of range 2 => 5% of range; doji requires <=10% of range.
    expect(isDoji(bar('2024-01-02', 10, 12, 8, 10.1, 1))).toBe(true)
    expect(isDoji(bar('2024-01-02', 10, 12, 8, 12, 1))).toBe(false) // too large a body
  })

  it('excludes zero-range candles from doji', () => {
    expect(isDoji(bar('2024-01-02', 10, 10, 10, 10, 1))).toBe(false)
  })

  it('detects a bullish engulfing', () => {
    const prev = bar('2024-01-02', 12, 13, 9, 10, 1) // bearish
    const current = bar('2024-01-03', 8, 14, 7, 13, 1) // bullish, covers prev range
    expect(isBullishEngulfing(prev, current)).toBe(true)
    expect(isBullishEngulfing(current, prev)).toBe(false) // reversed
  })

  it('detects a bearish engulfing', () => {
    const prev = bar('2024-01-02', 10, 13, 9, 12, 1) // bullish
    const current = bar('2024-01-03', 13, 15, 6, 7, 1) // bearish, covers prev range
    expect(isBearishEngulfing(prev, current)).toBe(true)
    expect(isBearishEngulfing(current, prev)).toBe(false)
  })

  it('detects a hammer after a preceding downtrend', () => {
    // 3 prior closes strictly falling; current: long lower shadow >= 2*body.
    const prior = [
      bar('2024-01-02', 12, 13, 11, 12, 1),
      bar('2024-01-03', 11, 12, 10, 11, 1),
      bar('2024-01-04', 10, 11, 9, 10, 1),
    ]
    const hammer = bar('2024-01-05', 9, 10, 5, 9.5, 1)
    // body 0.5, lower shadow 9.5-5=4.5 (>=2*body), upper shadow 10-9.5=0.5 (<=body).
    expect(isHammer(hammer, [...prior, hammer], 3)).toBe(true)
  })

  it('rejects a hammer without a preceding downtrend', () => {
    const prior = [
      bar('2024-01-02', 8, 9, 7, 8, 1),
      bar('2024-01-03', 9, 10, 8, 9, 1),
      bar('2024-01-04', 10, 11, 9, 10, 1),
    ]
    const hammer = bar('2024-01-05', 9, 10, 5, 9.5, 1)
    expect(isHammer(hammer, [...prior, hammer], 3)).toBe(false)
  })

  it('detects a shooting star after a preceding uptrend', () => {
    const prior = [
      bar('2024-01-02', 8, 9, 7, 8, 1),
      bar('2024-01-03', 9, 10, 8, 9, 1),
      bar('2024-01-04', 10, 11, 9, 10, 1),
    ]
    const star = bar('2024-01-05', 11, 14, 10.5, 11.5, 1)
    // body 0.5, upper shadow 14-11.5=2.5 (>=2*body), lower shadow 11.5-10.5=1 (<=body).
    expect(isShootingStar(star, [...prior, star], 3)).toBe(true)
  })

  it('handles zero-body and zero-range bars for hammer and star', () => {
    const prior = [bar('2024-01-02', 8, 9, 7, 9, 1), bar('2024-01-03', 9, 11, 8, 10, 1)]
    expect(isHammer(bar('2024-01-05', 9, 10, 5, 9, 1), prior, 2)).toBe(false) // zero body
    expect(isHammer(bar('2024-01-05', 9, 9, 9, 9, 1), prior, 2)).toBe(false) // zero range
  })

  it('recognizes every pattern through findPatterns without future data', () => {
    const bars = [
      bar('2024-01-02', 12, 13, 9, 10, 1),
      bar('2024-01-03', 8, 14, 7, 13, 1),
      bar('2024-01-04', 12, 13, 11, 12.1, 1), // doji with a real range
    ]
    const results = findPatterns(bars)
    // last bar is a doji detected from current data only.
    expect(results.some((r) => r.pattern === 'bullishEngulfing' && r.index === 1)).toBe(true)
    expect(results.some((r) => r.pattern === 'doji' && r.index === 2)).toBe(true)
  })

  it('reports no positive detection when conditions fail', () => {
    const bars = [bar('2024-01-02', 10, 12, 8, 11, 1)]
    expect(findPatterns(bars).length).toBe(0)
  })
})
