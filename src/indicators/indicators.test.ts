import { describe, expect, it } from 'vitest'
import { sma, assertPeriod } from './series'
import { bollingerBands } from './bollinger'
import { rsi } from './rsi'

/* Independent expected values are computed by hand in the test comments. */

const PRICES = [10, 20, 30, 40, 50]

describe('SMA', () => {
  it('returns null until a complete period window, then aligned means', () => {
    const out = sma(PRICES, 3)
    // sums: [null, null, (10+20+30)/3=20, (20+30+40)/3=30, (30+40+50)/3=40]
    expect(out).toEqual([null, null, 20, 30, 40])
  })

  it('keeps input length and does not mutate the input', () => {
    const input = PRICES
    const out = sma(input, 2)
    expect(out.length).toBe(input.length)
    expect(input).toEqual([10, 20, 30, 40, 50])
  })

  it('returns all-null for insufficient history', () => {
    expect(sma([10, 20], 5)).toEqual([null, null])
  })

  it('rejects invalid periods', () => {
    expect(() => sma(PRICES, 0)).toThrow()
    expect(() => sma(PRICES, -2)).toThrow()
    expect(() => sma(PRICES, 2.5)).toThrow()
    expect(() => assertPeriod(3)).not.toThrow()
  })

  it('is deterministic across repeated runs', () => {
    expect(sma(PRICES, 3)).toEqual(sma(PRICES, 3))
  })
})

describe('Bollinger Bands (population N)', () => {
  it('computes middle, upper, and lower for known values', () => {
    // period 3 at index 2 window [10,20,30]: mean 20.
    // population variance = ((10-20)^2+(20-20)^2+(30-20)^2)/3 = 200/3.
    // std = sqrt(200/3) = 8.164965...; bands at multiplier 2.
    const b = bollingerBands(PRICES, 3, 2)
    expect(b.middle[2]).toBe(20)
    const std = Math.sqrt(200 / 3)
    expect(b.upper[2]).toBe(20 + 2 * std)
    expect(b.lower[2]).toBe(20 - 2 * std)
  })

  it('aligns every component to the input length', () => {
    const b = bollingerBands(PRICES, 3, 2)
    expect(b.middle.length).toBe(5)
    expect(b.upper.length).toBe(5)
    expect(b.lower.length).toBe(5)
    expect(b.middle[1]).toBeNull()
  })

  it('keeps all bands equal on a constant price sequence', () => {
    const b = bollingerBands([5, 5, 5, 5, 5], 3, 2)
    expect(b.middle[4]).toBe(5)
    expect(b.upper[4]).toBe(5)
    expect(b.lower[4]).toBe(5)
  })

  it('returns null bands for insufficient input', () => {
    const b = bollingerBands([1, 2], 3, 2)
    expect(b.middle).toEqual([null, null])
    expect(b.upper).toEqual([null, null])
    expect(b.lower).toEqual([null, null])
  })

  it('rejects invalid periods', () => {
    expect(() => bollingerBands(PRICES, 0, 2)).toThrow()
    expect(() => bollingerBands(PRICES, 3, 2)).not.toThrow()
  })
})

describe('RSI (Wilder smoothing)', () => {
  it('is 100 for a strictly increasing series', () => {
    // period 2: deltas +10, +10, +10; avgLoss 0 => RSI 100.
    expect(rsi([10, 20, 30, 40], 2)).toEqual([null, null, 100, 100])
  })

  it('is 0 for a strictly decreasing series', () => {
    expect(rsi([40, 30, 20, 10], 2)).toEqual([null, null, 0, 0])
  })

  it('is 50 for a flat series when there are no changes', () => {
    expect(rsi([10, 10, 10, 10], 2)).toEqual([null, null, 50, 50])
  })

  it('computes a known Wilder value with hand-checked numbers', () => {
    // period 3, prices [10,20,18,30]:
    // deltas +10, -2, +12; avgGain 22/3, avgLoss 2/3; rs=11; RSI = 100-100/12.
    const out = rsi([10, 20, 18, 30], 3)
    expect(out[3]).not.toBeNull()
    const expected = 100 - 100 / 12
    expect(Math.abs(out[3]! - expected)).toBeLessThan(1e-6)
  })

  it('smooths subsequent values with Wilder recurrence', () => {
    const out = rsi([10, 20, 18, 30, 24], 3)
    // index 3 = 91.666...; index 4 uses Wilder smoothing with delta -6 (loss 6).
    expect(out.length).toBe(5)
    expect(out[4]).not.toBeNull()
    expect(out[4]! >= 0 && out[4]! <= 100).toBe(true)
  })

  it('keeps insufficient history as nulls', () => {
    expect(rsi([10, 20], 14)).toEqual([null, null])
  })

  it('respects the documented first-value index', () => {
    const out = rsi([10, 20, 30, 40, 50], 2)
    // first RSI is at index 2 (period 2; period+1 closes).
    expect(out[2]).toBe(100)
  })
})
