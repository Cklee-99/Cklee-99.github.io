import { describe, expect, it } from 'vitest'
import {
  isPlainDate,
  normalizeBars,
  validateRow,
  type RawBar,
} from './market'
import { loadDemoDataset, createDemoDataSource, DEMO_SYMBOL, createDemoBars } from './demo'

function row(date: string, o: number, h: number, l: number, c: number, v: number, line?: number): RawBar {
  return { date, open: o, high: h, low: l, close: c, volume: v, line }
}

describe('market domain', () => {
  it('accepts a valid ISO calendar date and rejects common invalid ones', () => {
    expect(isPlainDate('2024-01-02')).toBe(true)
    expect(isPlainDate('2024-02-29')).toBe(true)
    expect(isPlainDate('2024-13-01')).toBe(false)
    expect(isPlainDate('2024-02-30')).toBe(false)
    expect(isPlainDate('2024/01/02')).toBe(false)
    expect(isPlainDate('')).toBe(false)
  })

  it('normalizes valid rows into a sorted, unique dataset', () => {
    const rows = [
      row('2024-01-03', 10, 12, 9, 11, 100),
      row('2024-01-02', 9, 11, 8, 10, 100),
      row('2024-01-04', 11, 13, 10, 12, 100),
    ]
    const result = normalizeBars(rows, { symbol: 'SPY', sourceType: 'csv' })
    expect(result.acceptedCount).toBe(3)
    expect(result.rejectedCount).toBe(0)
    expect(result.dataset).not.toBeNull()
    expect(result.dataset!.bars.map((b) => b.date)).toEqual(['2024-01-02', '2024-01-03', '2024-01-04'])
    expect(result.dataset!.dateRange).toEqual({ start: '2024-01-02', end: '2024-01-04' })
  })

  it('rejects duplicate dates, keeping the first occurrence', () => {
    const rows = [row('2024-01-02', 9, 11, 8, 10, 100), row('2024-01-02', 9, 12, 8, 11, 200)]
    const result = normalizeBars(rows, { symbol: 'SPY', sourceType: 'csv' })
    expect(result.acceptedCount).toBe(1)
    expect(result.rejectedCount).toBe(1)
    const dup = result.issues.find((i) => i.code === 'duplicateDate')
    expect(dup?.date).toBe('2024-01-02')
  })

  it('reports invalid OHLC relationships', () => {
    const bad = row('2024-01-02', 12, 9, 8, 10, 100)
    const issues = validateRow(bad)
    expect(issues.map((i) => i.code)).toContain('rowBadOHLC')
  })

  it('reports negative prices and negative volume', () => {
    expect(validateRow(row('2024-01-02', -1, 12, 8, 10, 100)).map((i) => i.code)).toContain('rowNegativePrice')
    expect(validateRow(row('2024-01-02', 10, 12, 8, 10, -5)).map((i) => i.code)).toContain('rowNegativeVolume')
  })

  it('reports non-finite numeric prices', () => {
    expect(validateRow(row('2024-01-02', Infinity, 12, 8, 10, 100)).map((i) => i.code)).toContain('rowNegativePrice')
  })

  it('reports invalid calendar dates in rows', () => {
    expect(validateRow(row('2024-02-30', 10, 12, 8, 10, 100)).map((i) => i.code)).toContain('rowBadDate')
  })

  it('validates optional fields when supplied', () => {
    const badAdj = { ...row('2024-01-02', 10, 12, 8, 10, 100), adjustedClose: 0 }
    expect(validateRow(badAdj).map((i) => i.code)).toContain('rowBadAdjustedClose')
    const badDiv = { ...row('2024-01-02', 10, 12, 8, 10, 100), dividend: Infinity }
    expect(validateRow(badDiv).map((i) => i.code)).toContain('rowBadDividend')
    const badSplit = { ...row('2024-01-02', 10, 12, 8, 10, 100), splitRatio: -1 }
    expect(validateRow(badSplit).map((i) => i.code)).toContain('rowBadSplitRatio')
  })

  it('returns no dataset when every row is invalid', () => {
    const result = normalizeBars([row('not-a-date', -5, -4, -6, -3, 0)], { symbol: 'X', sourceType: 'csv' })
    expect(result.dataset).toBeNull()
    expect(result.acceptedCount).toBe(0)
  })
})

describe('deterministic demonstration data', () => {
  it('produces the same bars on every call without randomness', () => {
    const first = loadDemoDataset()
    const second = loadDemoDataset()
    expect(first).toEqual(second)
    expect(createDemoBars()).toEqual(createDemoBars())
  })

  it('is large enough for MA60 and RSI14 warm-up', () => {
    const dataset = loadDemoDataset()
    expect(dataset.validCount).toBeGreaterThanOrEqual(61)
    expect(dataset.bars.length).toBe(dataset.validCount)
  })

  it('is sorted, unique, and clearly labeled as DEMO source data', () => {
    const dataset = loadDemoDataset()
    expect(dataset.symbol).toBe(DEMO_SYMBOL)
    expect(dataset.sourceType).toBe('demo')
    expect(dataset.providerId).toBeUndefined()
    const dates = dataset.bars.map((b) => b.date)
    expect(dates).toEqual([...dates].sort())
    expect(new Set(dates).size).toBe(dates.length)
  })

  it('satisfies OHLCV relationship rules across all demo bars', () => {
    const dataset = loadDemoDataset()
    for (const bar of dataset.bars) {
      expect(bar.high >= bar.open && bar.high >= bar.low && bar.high >= bar.close).toBe(true)
      expect(bar.low <= bar.open && bar.low <= bar.close).toBe(true)
      expect(bar.volume >= 0).toBe(true)
    }
  })

  it('implements the replaceable data-source interface', () => {
    const source = createDemoDataSource()
    const result = source.load({ symbol: DEMO_SYMBOL, startDate: '2024-01-02', endDate: '2024-12-31' })
    expect(result.dataset?.sourceType).toBe('demo')
    expect(result.issues.length).toBe(0)
  })
})
