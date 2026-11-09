/* Browser-side Yahoo Finance Chart Endpoint provider (unofficial; no API key).
   Yahoo's chart endpoint is undocumented and does not expose CORS to ordinary
   browsers, so requests go through a replaceable proxy base. This module keeps
   the endpoint and proxy isolated so they can be swapped without touching the
   market-data domain or the simulation engines. Trading dates are rendered in
   the exchange timezone from `meta.exchangeTimezoneName` so they never shift
   with the user's local clock. The Python `yfinance` package is NOT a runtime
   dependency. */

import {
  normalizeBars,
  type DataRequest,
  type DataSourceIssue,
  type MarketDataLoadResult,
  type MarketDataSource,
  type MarketDataset,
  type RawBar,
} from '../market'
import { loadDatasetCache, saveDatasetCache } from './cache'

export const YAHOO_PROVIDER_ID = 'yahoo_chart'
export const YAHOO_PROVIDER_LABEL = 'Yahoo Finance (Unofficial)'

export const YAHOO_DEFAULT_ENDPOINT = 'https://query1.finance.yahoo.com/v8/finance/chart'
export const YAHOO_DEFAULT_PROXY = 'https://proxy.cors.dev/'

export interface YahooProviderConfig {
  endpointBase: string
  proxyBase: string
}

export const DEFAULT_YAHOO_PROVIDER_CONFIG: YahooProviderConfig = {
  endpointBase: YAHOO_DEFAULT_ENDPOINT,
  proxyBase: YAHOO_DEFAULT_PROXY,
}

/** Formats a JS Date as an ISO calendar date in the browser's local zone. */
function localIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Renders a Yahoo timestamp's wall-clock calendar date in the exchange zone. */
function exchangeDate(seconds: number, timezone: string | undefined): string {
  const date = new Date(seconds * 1000)
  if (!timezone) return localIsoDate(date)
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)
    const map: Record<string, string> = {}
    for (const part of parts) map[part.type] = part.value
    return `${map.year}-${map.month}-${map.day}`
  } catch {
    return localIsoDate(date)
  }
}

/** Unix seconds for a calendar date interpreted at local midnight (UTC stable). */
function utcMidnightSeconds(iso: string): number {
  const [y, m, d] = iso.split('-').map((part) => parseInt(part, 10))
  return Math.floor(new Date(y, m - 1, d, 0, 0, 0).getTime() / 1000)
}

/** Builds the proxy-wrapped Yahoo chart URL. `period1` is inclusive start; the
    end date request is inclusive, so `period2` spans past the end day and the
    parser filters bars back to the requested inclusive range afterward. */
export function buildYahooUrl(
  symbol: string,
  startDate: string,
  endDate: string,
  config: YahooProviderConfig = DEFAULT_YAHOO_PROVIDER_CONFIG,
): string {
  const encoded = encodeURIComponent(symbol.trim().toUpperCase())
  const period1 = utcMidnightSeconds(startDate)
  const period2 = utcMidnightSeconds(endDate) + 86400
  return `${config.proxyBase}${config.endpointBase}/${encoded}?period1=${period1}&period2=${period2}&interval=1d&events=div,splits`
}

interface QuoteArray {
  open?: number[]
  high?: number[]
  low?: number[]
  close?: number[]
  volume?: number[]
}

interface YahooChart {
  chart?: {
    error?: unknown
    result?: {
      meta?: { exchangeTimezoneName?: string; symbol?: string }
      timestamp?: number[]
      indicators?: {
        quote?: QuoteArray[]
        adjclose?: { adjclose?: number[] }[]
      }
      events?: {
        dividends?: Record<string, { amount?: number }>
        splits?: Record<string, { ratio?: number }>
      }
    }[]
  }
}

export interface YahooParsed {
  bars: RawBar[]
  issues: DataSourceIssue[]
  timezone: string | null
}

function eventValueByDate(events: Record<string, { amount?: number; ratio?: number }> | undefined, timezone: string | undefined, key: 'amount' | 'ratio'): Record<string, number> {
  const out: Record<string, number> = {}
  if (!events) return out
  for (const keySeconds of Object.keys(events)) {
    const seconds = Number(keySeconds)
    const date = seconds > 0 ? exchangeDate(seconds, timezone) : ''
    const value = events[keySeconds]?.[key]
    if (date && typeof value === 'number') out[date] = value
  }
  return out
}

/** Parses a raw Yahoo chart body into raw bars without mutating anything.
    Missing quote cells become NaN so the normal validation rejects them. */
export function parseYahooChart(raw: unknown, request: DataRequest): YahooParsed {
  const issues: DataSourceIssue[] = []
  const body = raw as YahooChart
  const chart = body?.chart
  const result = chart && chart.error === null ? chart.result?.[0] : undefined
  if (!result) {
    issues.push({ code: 'providerBadResponse', date: request.startDate })
    return { bars: [], issues, timezone: null }
  }
  const timestamps = result.timestamp ?? []
  const quote = result.indicators?.quote?.[0]
  if (!quote || timestamps.length === 0) {
    issues.push({ code: 'providerEmptyResult', date: request.startDate })
    return { bars: [], issues, timezone: null }
  }
  const length = timestamps.length
  const opens = quote.open ?? []
  const highs = quote.high ?? []
  const lows = quote.low ?? []
  const closes = quote.close ?? []
  const volumes = quote.volume ?? []
  if (opens.length < length || highs.length < length || lows.length < length || closes.length < length || volumes.length < length) {
    issues.push({ code: 'providerBadResponse', date: request.startDate })
    return { bars: [], issues, timezone: null }
  }
  const timezone = result.meta?.exchangeTimezoneName
  const adjclose = result.indicators?.adjclose?.[0]?.adjclose
  const dividends = eventValueByDate(result.events?.dividends, timezone, 'amount')
  const splits = eventValueByDate(result.events?.splits, timezone, 'ratio')
  const bars: RawBar[] = []
  for (let i = 0; i < length; i++) {
    const date = exchangeDate(timestamps[i], timezone)
    const bar: RawBar = {
      date,
      open: opens[i],
      high: highs[i],
      low: lows[i],
      close: closes[i],
      volume: volumes[i],
    }
    if (typeof adjclose?.[i] === 'number') bar.adjustedClose = adjclose[i]
    if (dividends[date] !== undefined) bar.dividend = dividends[date]
    if (splits[date] !== undefined) bar.splitRatio = splits[date]
    bars.push(bar)
  }
  return { bars, issues, timezone: timezone ?? null }
}

/** Filters parsed bars to the inclusive requested range, then validates and
    normalizes them into a provider-labeled dataset. */
export function normalizeYahooChart(parsed: YahooParsed, request: DataRequest): { dataset: MarketDataset | null; issues: DataSourceIssue[] } {
  const issues = [...parsed.issues]
  const bars = parsed.bars.filter((bar) => bar.date >= request.startDate && bar.date <= request.endDate)
  if (bars.length === 0) {
    issues.push({ code: 'providerNoCoverage', date: request.startDate })
    return { dataset: null, issues }
  }
  const result = normalizeBars(bars, {
    symbol: request.symbol.trim().toUpperCase(),
    sourceType: 'provider',
    providerId: YAHOO_PROVIDER_ID,
    requestedRange: { start: request.startDate, end: request.endDate },
  })
  return { dataset: result.dataset, issues: [...issues, ...result.issues] }
}

type FetchOutcome = { ok: true; body: unknown } | { ok: false; issue: DataSourceIssue }

async function fetchYahooChart(url: string): Promise<FetchOutcome> {
  let response
  try {
    response = await fetch(url, { credentials: 'omit' })
  } catch {
    return { ok: false, issue: { code: 'providerNetworkError' } }
  }
  if (!response.ok) return { ok: false, issue: { code: 'providerNetworkError' } }
  try {
    return { ok: true, body: await response.json() }
  } catch {
    return { ok: false, issue: { code: 'providerBadResponse' } }
  }
}

/** The Yahoo chart source. Loads through IndexedDB cache first, then the
    endpoint proxy, then stores the fresh dataset for the exact request. */
export function createYahooFinanceProvider(
  config: YahooProviderConfig = DEFAULT_YAHOO_PROVIDER_CONFIG,
): MarketDataSource {
  return {
    sourceType: 'provider',
    providerId: YAHOO_PROVIDER_ID,
    load: async (request: DataRequest): Promise<MarketDataLoadResult> => {
      const cached = await loadDatasetCache(request, YAHOO_PROVIDER_ID)
      if (cached) return { dataset: cached, issues: [] }
      const url = buildYahooUrl(request.symbol, request.startDate, request.endDate, config)
      const outcome = await fetchYahooChart(url)
      if (!outcome.ok) return { dataset: null, issues: [outcome.issue] }
      const parsed = parseYahooChart(outcome.body, request)
      const normalized = normalizeYahooChart(parsed, request)
      if (normalized.dataset) await saveDatasetCache(request, YAHOO_PROVIDER_ID, normalized.dataset)
      return { dataset: normalized.dataset, issues: normalized.issues }
    },
  }
}

