/* Client-side CSV import: tokenize, map headers, validate rows, and build a
   normalized dataset. Pure and deterministic; no backend or file reading. */

import {
  normalizeBars,
  type DataSourceIssue,
  type DailyBar,
  type MarketDataset,
  type RawBar,
} from './market'

const REQUIRED_COLUMNS = ['date', 'open', 'high', 'low', 'close', 'volume']

const HEADER_ALIASES: Record<string, string> = {
  'date': 'date',
  'datetime': 'date',
  'timestamp': 'date',
  'open': 'open',
  'high': 'high',
  'low': 'low',
  'close': 'close',
  'volume': 'volume',
  'vol': 'volume',
  'adj close': 'adjustedClose',
  'adjusted close': 'adjustedClose',
  'adjustedclose': 'adjustedClose',
  'dividend': 'dividend',
  'split': 'splitRatio',
  'split ratio': 'splitRatio',
  'stock split': 'splitRatio',
  'splitfactor': 'splitRatio',
}

export interface CsvRecord {
  fields: string[]
  line: number
}

export interface CsvImportResult {
  dataset: MarketDataset | null
  issues: DataSourceIssue[]
  acceptedCount: number
  rejectedCount: number
  preview: DailyBar[]
  columns: string[]
}

/** Splits one physical text into logical CSV records, honoring quoted fields,
    UTF-8 BOM, CRLF/LF/CR endings, and reporting unterminated quotes. */
export function tokenizeCsv(text: string): { records: CsvRecord[]; issues: DataSourceIssue[] } {
  const records: CsvRecord[] = []
  const issues: DataSourceIssue[] = []
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  let line = 1
  let record: string[] = []
  let field = ''
  let inQuotes = false
  let recordStart = line

  const commitRecord = () => {
    records.push({ fields: [...record, field], line: recordStart })
    record = []
    field = ''
  }

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        if (ch === '\n') line++
        field += ch
      }
      continue
    }
    if (ch === '"' && field.length === 0) {
      inQuotes = true
      continue
    }
    if (ch === '"') {
      // A quote inside an already-open field is malformed unless escaped.
      issues.push({ code: 'rowBadNumeric', line })
    }
    if (ch === ',') {
      record.push(field)
      field = ''
      continue
    }
    if (ch === '\n') {
      commitRecord()
      line++
      recordStart = line
      continue
    }
    if (ch === '\r') {
      if (src[i + 1] === '\n') {
        commitRecord()
        line++
        recordStart = line
        i++
      } else {
        commitRecord()
        line++
        recordStart = line
      }
      continue
    }
    field += ch
  }
  if (field.length > 0 || record.length > 0) {
    if (inQuotes) issues.push({ code: 'rowBadNumeric', line: recordStart })
    commitRecord()
  }
  return { records, issues }
}

function normalizeHeaderToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Maps the header row to canonical column names; missing required columns are
    reported so users always see the gap. */
export function resolveColumns(headers: string[]): { columns: string[]; missing: string[] } {
  const columns: string[] = []
  for (const header of headers) {
    const key = HEADER_ALIASES[normalizeHeaderToken(header)]
    columns.push(key ?? normalizeHeaderToken(header))
  }
  const missing = REQUIRED_COLUMNS.filter((col) => !columns.includes(col))
  return { columns, missing }
}

function parseNumber(cell: string): { value: number | null; bad: boolean } {
  const trimmed = cell.trim()
  if (trimmed === '') return { value: null, bad: false }
  const number = Number(trimmed)
  if (!Number.isFinite(number)) return { value: null, bad: true }
  return { value: number, bad: false }
}

function indexOf(columns: string[], key: string): number {
  return columns.indexOf(key)
}

function cellAt(record: CsvRecord, columns: string[], key: string): string {
  const idx = indexOf(columns, key)
  if (idx < 0 || idx >= record.fields.length) return ''
  return record.fields[idx]
}

export function importCsv(
  text: string,
  symbol: string,
  options: { importTimestamp?: string } = {},
): CsvImportResult {
  const issues: DataSourceIssue[] = []
  const { records, issues: tokenIssues } = tokenizeCsv(text)
  for (const issue of tokenIssues) issues.push(issue)

  if (records.length === 0) {
    issues.push({ code: 'emptyInput' })
    return { dataset: null, issues, acceptedCount: 0, rejectedCount: 0, preview: [], columns: [] }
  }

  const { columns, missing } = resolveColumns(records[0].fields)
  if (missing.length > 0) {
    for (const col of missing) issues.push({ code: 'missingColumn', line: records[0].line, date: col })
  }

  const rows: RawBar[] = []
  for (let r = 1; r < records.length; r++) {
    const record = records[r]
    if (record.fields.length === 0 || record.fields.every((f) => f.trim() === '')) continue
    const line = record.line
    const date = cellAt(record, columns, 'date').trim()
    const open = parseNumber(cellAt(record, columns, 'open'))
    const high = parseNumber(cellAt(record, columns, 'high'))
    const low = parseNumber(cellAt(record, columns, 'low'))
    const close = parseNumber(cellAt(record, columns, 'close'))
    const volume = parseNumber(cellAt(record, columns, 'volume'))

    const bar: RawBar = { date, open: 0, high: 0, low: 0, close: 0, volume: 0, line }
    const missingValues: string[] = []
    if (open.value === null) missingValues.push('open')
    if (high.value === null) missingValues.push('high')
    if (low.value === null) missingValues.push('low')
    if (close.value === null) missingValues.push('close')
    if (volume.value === null) missingValues.push('volume')
    if (missingValues.length > 0) issues.push({ code: 'rowMissingValue', line, date })
    if (open.bad || high.bad || low.bad || close.bad || volume.bad) {
      issues.push({ code: 'rowNonFinite', line, date })
    }

    bar.open = open.value ?? 0
    bar.high = high.value ?? 0
    bar.low = low.value ?? 0
    bar.close = close.value ?? 0
    bar.volume = volume.value ?? 0

    const adjCol = indexOf(columns, 'adjustedClose')
    if (adjCol >= 0) {
      const adj = parseNumber(cellAt(record, columns, 'adjustedClose'))
      if (adj.value !== null) bar.adjustedClose = adj.value
      else if (cellAt(record, columns, 'adjustedClose').trim() !== '') issues.push({ code: 'rowBadAdjustedClose', line, date })
    }
    const divCol = indexOf(columns, 'dividend')
    if (divCol >= 0 && cellAt(record, columns, 'dividend').trim() !== '') {
      const div = parseNumber(cellAt(record, columns, 'dividend'))
      if (div.value !== null) bar.dividend = div.value
      else issues.push({ code: 'rowBadDividend', line, date })
    }
    const splitCol = indexOf(columns, 'splitRatio')
    if (splitCol >= 0 && cellAt(record, columns, 'splitRatio').trim() !== '') {
      const split = parseNumber(cellAt(record, columns, 'splitRatio'))
      if (split.value !== null) bar.splitRatio = split.value
      else issues.push({ code: 'rowBadSplitRatio', line, date })
    }

    rows.push(bar)
  }

  const result = normalizeBars(rows, {
    symbol,
    sourceType: 'csv',
    adjustmentPolicy: 'unadjusted',
    importTimestamp: options.importTimestamp,
  })
  if (result.dataset === null && records.length > 0) {
    issues.push({ code: 'noValidRows' })
  }
  const resultIssues = result.issues.map((issue) => issue)

  return {
    dataset: result.dataset,
    issues: [...issues, ...resultIssues],
    acceptedCount: result.acceptedCount,
    rejectedCount: result.rejectedCount,
    preview: result.bars.slice(0, 5),
    columns,
  }
}

