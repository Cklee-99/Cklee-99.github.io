import { describe, expect, it } from 'vitest'
import {
  buildYahooUrl,
  createYahooFinanceProvider,
  normalizeYahooChart,
  parseYahooChart,
  YAHOO_PROVIDER_ID,
} from './yahoo-finance'
import { cacheKey } from './cache'

const TZ = 'America/New_York'

/** Unix seconds for a UTC instant; used to fix timestamps that resolve to a
    deterministic exchange calendar date (09:30 in New York in winter). */
function utcSeconds(year: number, month: number, day: number, hour: number, minute: number): number {
  return Math.floor(Date.UTC(year, month, day, hour, minute) / 1000)
}

function yahooBody(): unknown {
  const second2 = utcSeconds(2024, 0, 2, 14, 30) // 2024-01-02 09:30 ET
  const second3 = utcSeconds(2024, 0, 3, 14, 30) // 2024-01-03 09:30 ET
  return {
    chart: {
      error: null,
      result: [
        {
          meta: { symbol: 'SPY', exchangeTimezoneName: TZ },
          timestamp: [second2, second3],
          indicators: {
            quote: [
              {
                open: [100, 101],
                high: [102, 103],
                low: [99, 100],
                close: [101, 102],
                volume: [1000, 1100],
              },
            ],
            adjclose: [{ adjclose: [101, 102.5] }],
          },
          events: {
            dividends: { [String(second2)]: { amount: 0.25 } },
            splits: {},
          },
        },
      ],
    },
  }
}

describe('yahoo finance provider', () => {
  it('exposes the provider identity contract', () => {
    const provider = createYahooFinanceProvider()
    expect(provider.sourceType).toBe('provider')
    expect(provider.providerId).toBe(YAHOO_PROVIDER_ID)
  })

  it('builds a proxy-wrapped chart URL with inclusive daily period and events', () => {
    const url = buildYahooUrl('BRK-B', '2024-01-01', '2024-01-31')
    expect(url.startsWith('https://proxy.cors.dev/https://query1.finance.yahoo.com/v8/finance/chart/BRK-B?')).toBe(true)
    expect(url.includes('interval=1d')).toBe(true)
    expect(url.includes('events=div,splits')).toBe(true)
    expect(url.includes('period1=')).toBe(true)
    expect(url.includes('period2=')).toBe(true)
  })

  it('renders exchange calendar dates and attaches adjusted close and dividends', () => {
    const parsed = parseYahooChart(yahooBody(), { symbol: 'SPY', startDate: '2024-01-01', endDate: '2024-01-31' })
    expect(parsed.timezone).toBe(TZ)
    expect(parsed.issues.length).toBe(0)
    expect(parsed.bars.length).toBe(2)
    expect(parsed.bars[0].date).toBe('2024-01-02')
    expect(parsed.bars[0].close).toBe(101)
    expect(parsed.bars[0].adjustedClose).toBe(101)
    expect(parsed.bars[0].dividend).toBe(0.25)
    expect(parsed.bars[1].date).toBe('2024-01-03')
    expect(parsed.bars[1].adjustedClose).toBe(102.5)
    expect(parsed.bars[1].dividend).toBeUndefined()
  })

  it('filters parsed bars to the inclusive requested range', () => {
    const parsed = parseYahooChart(yahooBody(), { symbol: 'SPY', startDate: '2024-01-01', endDate: '2024-01-31' })
    const normalized = normalizeYahooChart(parsed, { symbol: 'SPY', startDate: '2024-01-03', endDate: '2024-01-11' })
    expect(normalized.dataset).not.toBeNull()
    expect(normalized.dataset!.bars.length).toBe(1)
    expect(normalized.dataset!.bars[0].date).toBe('2024-01-03')
    expect(normalized.dataset!.sourceType).toBe('provider')
    expect(normalized.dataset!.providerId).toBe(YAHOO_PROVIDER_ID)
    expect(normalized.dataset!.requestedRange).toEqual({ start: '2024-01-03', end: '2024-01-11' })
  })

  it('reports no coverage when no session falls inside the inclusive range', () => {
    const parsed = parseYahooChart(yahooBody(), { symbol: 'SPY', startDate: '2024-01-01', endDate: '2024-01-31' })
    const normalized = normalizeYahooChart(parsed, { symbol: 'SPY', startDate: '2025-01-01', endDate: '2025-01-31' })
    expect(normalized.dataset).toBeNull()
    expect(normalized.issues.map((issue) => issue.code)).toContain('providerNoCoverage')
  })

  it('reports a bad response when the chart result is absent', () => {
    const parsed = parseYahooChart({ chart: { error: null, result: [] } }, { symbol: 'SPY', startDate: '2024-01-01', endDate: '2024-01-31' })
    expect(parsed.bars.length).toBe(0)
    expect(parsed.issues.map((issue) => issue.code)).toContain('providerBadResponse')
  })

  it('keys the cache by provider, symbol, and inclusive range', () => {
    const key = cacheKey({ symbol: 'SPY', startDate: '2024-01-01', endDate: '2024-01-31' }, YAHOO_PROVIDER_ID)
    expect(key).toBe('yahoo_chart|SPY|2024-01-01|2024-01-31')
  })
})
