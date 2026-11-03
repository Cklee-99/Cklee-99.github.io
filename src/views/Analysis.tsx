import { useState } from 'react'
import type { Locale } from '../state/prefs'
import type { MarketDataset } from '../data/market'
import { importCsv, type CsvImportResult } from '../data/csv'
import { loadDemoDataset } from '../data/demo'
import { sma } from '../indicators/series'
import { bollingerBands } from '../indicators/bollinger'
import { rsi } from '../indicators/rsi'
import { findPatterns } from '../indicators/patterns'
import { DEFAULT_TICKER } from '../config/backtest'
import { StatusBanner } from '../components/StatusBanner'
import { translate } from '../i18n/index'

function isoNow(): string {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${h}:${m}:${s}`
}

function fmt(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100) / 100}`
}

export function Analysis({
  locale,
  dataset,
  onDataset,
}: {
  locale: Locale
  dataset: MarketDataset | null
  onDataset: (dataset: MarketDataset | null) => void
}) {
  const t = (key: string) => translate(locale, key)
  const [fileName, setFileName] = useState<string>('')
  const [pending, setPending] = useState<CsvImportResult | null>(null)
  const [readError, setReadError] = useState(false)

  const onFileChange = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setFileName(file.name)
    setReadError(false)
    try {
      const text = await file.text()
      setPending(importCsv(text, dataset?.symbol ?? DEFAULT_TICKER, { importTimestamp: isoNow() }))
    } catch {
      setPending(null)
      setReadError(true)
    }
  }

  const confirmImport = () => {
    if (pending?.dataset) {
      onDataset(pending.dataset)
      setPending(null)
      setFileName('')
    }
  }

  const cancelImport = () => {
    setPending(null)
    setFileName('')
    setReadError(false)
  }

  const closes = dataset ? dataset.bars.map((b) => b.close) : []
  const ma5 = sma(closes, 5)
  const ma20 = sma(closes, 20)
  const ma60 = sma(closes, 60)
  const bb = bollingerBands(closes, 20, 2)
  const rsi14 = rsi(closes, 14)
  const patterns = dataset ? findPatterns(dataset.bars) : []


  return (
    <section className="panel">
      <h1 className="panel-heading">{t('analysis.title')}</h1>
      <StatusBanner locale={locale} dataset={dataset ?? null} />

      {dataset ? (
        <div className="source-card">
          <h2 className="form-section-title">{t('data.source.type')}</h2>
          <div className="source-meta">
            <span className="status-value">{t('data.source.symbol')}: {dataset.symbol}</span>
            <span className="status-value">{t('data.source.type')}: {t(`data.sources.${dataset.sourceType}`)}</span>
            <span className="status-value">{t('data.source.count')}: {dataset.validCount}</span>
            <span className="status-value">{t('data.source.range')}: {dataset.dateRange ? `${dataset.dateRange.start} – ${dataset.dateRange.end}` : '—'}</span>
            <span className="status-value">{t('data.source.adjustment')}: {dataset.adjustmentPolicy}</span>
            {dataset.sourceType === 'csv' && dataset.importTimestamp ? (
              <span className="status-value">{t('data.source.imported')}: {dataset.importTimestamp}</span>
            ) : null}
          </div>
          {dataset.sourceType === 'demo' ? (
            <p className="field-note">{t('data.source.demoNotice')}</p>
          ) : null}
          {dataset.sourceType === 'provider' ? (
            <p className="field-note">{t('data.source.providerUnavailable')}</p>
          ) : null}
        </div>
      ) : null}

      <div className="demo-control">
        <button type="button" className="action-button" onClick={() => onDataset(loadDemoDataset())}>
          {t('data.demo.load')}
        </button>
      </div>

      <h2 className="form-section-title">{t('data.csv.title')}</h2>
      <div className="csv-import">
        <label className="field-label" htmlFor="csvFile">{t('data.csv.select')}</label>
        <input className="file-field" id="csvFile" name="csvFile" type="file" accept=".csv" onChange={(e) => onFileChange(e.target.files)} />
        {fileName ? (
          <p className="field-note">{t('data.csv.selected')}: {fileName}</p>
        ) : null}
        {readError ? (
          <p className="field-error">{t('data.csv.readError')}</p>
        ) : null}
        {pending ? (
          <div className="csv-preview">
            <h3 className="form-section-title">{t('data.csv.preview')}</h3>
            <table className="preview-table">
              <thead>
                <tr>
                  <th>{t('data.diag.date')}</th>
                  <th>{t('data.diag.close')}</th>
                </tr>
              </thead>
              <tbody>
                {pending.preview.map((bar) => (
                  <tr key={bar.date}>
                    <td>{bar.date}</td>
                    <td>{bar.close}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="status-value">{t('data.csv.accepted')}: {pending.acceptedCount}</p>
            <p className="status-value">{t('data.csv.rejected')}: {pending.rejectedCount}</p>
            {pending.issues.length > 0 ? (
              <div className="csv-issues">
                <h3 className="form-section-title">{t('data.csv.errors')}</h3>
                {pending.issues.slice(0, 40).map((issue) => (
                  <p key={`${issue.line}-${issue.code}`} className="field-error">
                    {issue.line ? `${t('data.csv.lineLabel')}${issue.line}: ` : ''}{t(`data.issue.${issue.code}`)}{issue.date ? ` (${issue.date})` : ''}
                  </p>
                ))}
              </div>
            ) : null}
            {pending.dataset ? (
              <div className="action-row">
                <button type="button" className="action-button" onClick={confirmImport}>{t('data.csv.confirm')}</button>
                <button type="button" className="action-button" onClick={cancelImport}>{t('data.csv.cancel')}</button>
              </div>
            ) : (
              <>
                <p className="field-error">{t('data.csv.noValid')}</p>
                <div className="action-row">
                  <button type="button" className="action-button" onClick={cancelImport}>{t('data.csv.cancel')}</button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
      {dataset ? (
        <>
          <h2 className="form-section-title">{t('data.diag.title')}</h2>
          <table className="preview-table">
            <thead>
              <tr>
                <th>{t('data.diag.date')}</th>
                <th>{t('data.diag.close')}</th>
                <th>{t('data.diag.sma5')}</th>
                <th>{t('data.diag.sma20')}</th>
                <th>{t('data.diag.sma60')}</th>
                <th>{t('data.diag.bollMid')}</th>
                <th>{t('data.diag.bollUpper')}</th>
                <th>{t('data.diag.bollLower')}</th>
                <th>{t('data.diag.rsi')}</th>
              </tr>
            </thead>
            <tbody>
              {dataset.bars.slice(-6).map((bar, offset) => {
                const i = dataset.bars.length - 6 + offset
                return (
                  <tr key={bar.date}>
                    <td>{bar.date}</td>
                    <td>{fmt(bar.close)}</td>
                    <td>{fmt(ma5[i])}</td>
                    <td>{fmt(ma20[i])}</td>
                    <td>{fmt(ma60[i])}</td>
                    <td>{fmt(bb.middle[i])}</td>
                    <td>{fmt(bb.upper[i])}</td>
                    <td>{fmt(bb.lower[i])}</td>
                    <td>{fmt(rsi14[i])}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <h2 className="form-section-title">{t('data.diag.patternsTitle')}</h2>
          {patterns.length > 0 ? (
            <ul className="pattern-list">
              {patterns.map((p) => (
                <li key={`${p.index}-${p.pattern}`}>{t(p.descriptionKey)} — {p.date}</li>
              ))}
            </ul>
          ) : (
            <p className="status-value">{t('data.diag.patternNone')}</p>
          )}
        </>
      ) : (
        <div className="empty-state">
          <h1 className="panel-heading">{t('data.empty.title')}</h1>
          <p>{t('data.empty.body')}</p>
        </div>
      )}
    </section>
  )
}

