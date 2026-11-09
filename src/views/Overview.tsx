import type { Locale } from '../state/prefs'
import type { Theme } from '../state/prefs'
import type { MarketDataset } from '../data/market'
import type { SimulationResult } from '../backtesting/types'
import { navigate } from '../router'
import { StatusBanner } from '../components/StatusBanner'
import { translate } from '../i18n/index'
import { buildPerformanceSeriesSet, formatMoney, formatPercent } from '../components/charts/chart-utils'
import { EquityCurveChart } from '../components/charts/EquityCurveChart'

export function Overview({
  locale,
  theme,
  dataset,
  result,
}: {
  locale: Locale
  theme: Theme
  dataset: MarketDataset | null
  result: SimulationResult | null
}) {
  const t = (key: string) => translate(locale, key)
  const numLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US'
  const asPercent = (value: number | null) =>
    value === null ? t('simulation.value.unavailable') : formatPercent(value, numLocale)
  const asMoney = (value: number) => formatMoney(value, numLocale)
  const perf = result ? buildPerformanceSeriesSet(result) : null
  const dataKey = result ? `${result.config.ticker}|${result.snapshots.length}` : 'none'

  if (!result) {
    return (
      <section className="panel">
        <h1 className="panel-heading">{t('dashboard.title')}</h1>
        <StatusBanner locale={locale} dataset={dataset} />
        <div className="empty-state">
          <h1>{t('dashboard.empty.title')}</h1>
          <p>{t('dashboard.empty.body')}</p>
          <div className="field-group">
            <button type="button" className="action-button" onClick={() => navigate('backtest')}>
              {t('common.cta.configure')}
            </button>
          </div>
        </div>
      </section>
    )
  }

  const recent = result.ledger.slice(-6)

  return (
    <section className="panel">
      <h1 className="panel-heading">{t('dashboard.title')}</h1>
      <StatusBanner locale={locale} dataset={dataset} />
      <p className="status-value">
        {t('simulation.scope')}: {result.startDate ?? '—'} – {result.endDate ?? '—'} · {t('data.source.symbol')}: {result.config.ticker}
      </p>

      <h2 className="form-section-title">{t('dashboard.section.headline')}</h2>
      <ul className="metric-list">
        <li><span className="metric-label">{t('simulation.metric.initialCapital')}</span><span>{asMoney(result.summary.initialCapital)}</span></li>
        <li><span className="metric-label">{t('simulation.metric.finalEquity')}</span><span>{asMoney(result.summary.finalEquity)}</span></li>
        <li><span className="metric-label">{t('simulation.metric.totalReturn')}</span><span>{asPercent(result.summary.totalReturn)}</span></li>
        <li><span className="metric-label">{t('simulation.metric.cagr')}</span><span>{asPercent(result.summary.cagr)}</span></li>
        <li><span className="metric-label">{t('simulation.metric.maxDrawdown')}</span><span>{asPercent(result.summary.maxDrawdown)}</span></li>
        <li><span className="metric-label">{t('simulation.metric.volatility')}</span><span>{asPercent(result.summary.annualizedVolatility)}</span></li>
        <li><span className="metric-label">{t('simulation.metric.sharpe')}</span><span>{result.summary.sharpeRatio === null ? t('simulation.value.unavailable') : result.summary.sharpeRatio.toFixed(2)}</span></li>
        <li><span className="metric-label">{t('simulation.metric.trades')}</span><span>{result.summary.tradeCount}</span></li>
        <li><span className="metric-label">{t('simulation.metric.winRate')}</span><span>{asPercent(result.summary.closedWinRate)}</span></li>
        <li><span className="metric-label">{t('simulation.metric.exposure')}</span><span>{asPercent(result.summary.exposure)}</span></li>
        <li><span className="metric-label">{t('simulation.metric.benchmark')}</span><span>{perf?.benchmarkAvailable ? asPercent(result.summary.benchmarkReturn) : t('simulation.value.unavailable')}</span></li>
        <li><span className="metric-label">{t('simulation.metric.excess')}</span><span>{perf?.benchmarkAvailable ? asPercent(result.summary.excessReturn) : t('simulation.value.unavailable')}</span></li>
      </ul>

      {result.warnings.length > 0 ? (
        <ul className="warning-list">
          {result.warnings.map((warning) => (
            <li className="warning-label">{t(`simulation.warning.${warning}`)}</li>
          ))}
        </ul>
      ) : null}

      <h2 className="form-section-title">{t('dashboard.section.equity')}</h2>
      <EquityCurveChart id={`overview-equity-${dataKey}`} locale={locale} theme={theme} perf={perf!} dataKey={dataKey} />

      <h2 className="form-section-title">{t('dashboard.section.trades')}</h2>
      {recent.length === 0 ? (
        <p className="status-value">{t('dashboard.recent.none')}</p>
      ) : (
        <ul className="timeline-list">
          {recent.map((order) => (
            <li key={`${order.date}-${order.action}`} className="timeline-row">
              <span className="timeline-date">{order.date}</span>
              <span className="timeline-decision">{t(`analysis.action.${order.action.toLowerCase()}`)}</span>
              <span className="timeline-exec">
                {t('analysis.timeline.price')}: {formatMoney(order.price, numLocale)} · {t('analysis.timeline.qty')}: {order.shares.toFixed(2) === '0.00' ? '0' : order.shares.toFixed(2)} · {t('analysis.timeline.fee')}: {formatMoney(order.fee, numLocale)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="action-row">
        <button type="button" className="action-button" onClick={() => navigate('backtest')}>
          {t('common.cta.configure')}
        </button>
        <button type="button" className="action-button" onClick={() => navigate('analysis')}>
          {t('analysis.title')}
        </button>
      </div>
    </section>
  )
}
