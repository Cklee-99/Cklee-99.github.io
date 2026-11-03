import { describe, expect, it } from 'vitest'
import { importCsv, tokenizeCsv } from './csv'

const VALID_CSV =
  'Date,Open,High,Low,Close,Volume\n' +
  '2024-01-02,100,105,98,103,1000000\n' +
  '2024-01-03,103,106,101,104,1200000\n'

describe('CSV import', () => {
  it('imports a standard CSV file into a normalized dataset', () => {
    const result = importCsv(VALID_CSV, 'TEST')
    expect(result.dataset).not.toBeNull()
    expect(result.acceptedCount).toBe(2)
    expect(result.rejectedCount).toBe(0)
    expect(result.dataset!.bars[0].date).toBe('2024-01-02')
    expect(result.dataset!.bars[1].close).toBe(104)
  })

  it('handles a UTF-8 BOM prefix', () => {
    const result = importCsv('\uFEFF' + VALID_CSV, 'TEST')
    expect(result.dataset!.validCount).toBe(2)
  })

  it('handles CRLF and LF line endings', () => {
    const crlf = VALID_CSV.replace(/\n/g, '\r\n')
    expect(importCsv(crlf, 'TEST').dataset!.validCount).toBe(2)
    expect(importCsv(VALID_CSV, 'TEST').dataset!.validCount).toBe(2)
  })

  it('handles quoted headers', () => {
    const quoted =
      '"Date","Open","High","Low","Close","Volume"\n' +
      '2024-01-02,100,105,98,103,1000000\n'
    expect(importCsv(quoted, 'TEST').dataset!.validCount).toBe(1)
  })

  it('accepts case-insensitive headers', () => {
    const lower = 'date,open,high,low,close,volume\n2024-01-02,100,105,98,103,1000000\n'
    expect(importCsv(lower, 'TEST').dataset!.validCount).toBe(1)
  })

  it('accepts header aliases', () => {
    const alias =
      'Timestamp,Open,High,Low,Close,Vol,Adjusted Close,Dividend,Split Ratio\n' +
      '2024-01-02,100,105,98,103,1000000,103,0.1,1\n'
    const result = importCsv(alias, 'TEST')
    const bar = result.dataset!.bars[0]
    expect(bar.adjustedClose).toBe(103)
    expect(bar.dividend).toBe(0.1)
    expect(bar.splitRatio).toBe(1)
  })

  it('reports missing required columns', () => {
    const src = 'Date,Open,High,Low,Close\n2024-01-02,100,105,98,103\n'
    const result = importCsv(src, 'TEST')
    expect(result.issues.some((i) => i.code === 'missingColumn')).toBe(true)
  })

  it('reports malformed numeric values and rejects the row', () => {
    const src = 'Date,Open,High,Low,Close,Volume\n2024-01-02,NaN,105,98,103,1000000\n'
    const result = importCsv(src, 'TEST')
    expect(result.issues.some((i) => i.code === 'rowNonFinite')).toBe(true)
    expect(result.acceptedCount).toBe(0)
    expect(result.dataset).toBeNull()
  })

  it('rejects duplicate dates and reports them', () => {
    const src =
      'Date,Open,High,Low,Close,Volume\n' +
      '2024-01-02,100,105,98,103,1000000\n' +
      '2024-01-02,101,106,99,104,1100000\n'
    const result = importCsv(src, 'TEST')
    expect(result.acceptedCount).toBe(1)
    expect(result.issues.some((i) => i.code === 'duplicateDate')).toBe(true)
  })

  it('rejects invalid OHLC rows and keeps line numbers', () => {
    const src =
      'Date,Open,High,Low,Close,Volume\n' +
      '2024-01-02,100,95,98,103,1000000\n'
    const result = importCsv(src, 'TEST')
    expect(result.acceptedCount).toBe(0)
    const ohlc = result.issues.find((i) => i.code === 'rowBadOHLC')
    expect(ohlc?.line).toBe(2)
  })

  it('keeps valid rows while rejecting mixed invalid rows', () => {
    const src =
      'Date,Open,High,Low,Close,Volume\n' +
      '2024-01-02,100,105,98,103,1000000\n' +
      '2024-01-03,-1,106,101,104,1200000\n' +
      '2024-01-04,104,108,102,105,1300000\n'
    const result = importCsv(src, 'TEST')
    expect(result.acceptedCount).toBe(2)
    expect(result.rejectedCount).toBe(1)
    const neg = result.issues.find((i) => i.code === 'rowNegativePrice')
    expect(neg?.line).toBe(3)
  })

  it('reports an empty file and never fabricates a dataset', () => {
    const result = importCsv('', 'TEST')
    expect(result.dataset).toBeNull()
    expect(result.issues.some((i) => i.code === 'emptyInput')).toBe(true)
  })

  it('reports malformed unterminated quoting', () => {
    const src = 'Date,Open,High,Low,Close,Volume\n2024-01-02,100,10"5,98,103,1000000\n'
    const result = importCsv(src, 'TEST')
    const bad = result.issues.find((i) => i.code === 'rowNonFinite')
    expect(bad).not.toBeNull()
    expect(bad!.line).toBe(2)
  })

  it('tokenizeCsv preserves original line numbers', () => {
    const { records } = tokenizeCsv('a,b\nc,d\ne,f\n')
    expect(records.map((r) => r.line)).toEqual([1, 2, 3])
  })
})
