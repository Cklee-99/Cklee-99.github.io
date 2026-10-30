import { useState } from 'react'
import type { Locale } from '../state/prefs'
import { translate } from '../i18n/index'
import {
  DEFAULT_ALLOCATION,
  DEFAULT_BENCHMARK,
  DEFAULT_FEE_RATE,
  DEFAULT_FRACTIONAL_SHARES,
  DEFAULT_INITIAL_CAPITAL,
  DEFAULT_SLIPPAGE,
  DEFAULT_TICKER,
  STRATEGIES,
  validateBacktestConfig,
  defaultEndDate,
  defaultStartDate,
} from '../config/backtest'
import type { BacktestConfig, FieldErrors } from '../config/backtest'
import { StatusBanner } from '../components/StatusBanner'

function initialConfig(): BacktestConfig {
  return {
    ticker: DEFAULT_TICKER,
    strategy: 'trend_following',
    initialCapital: DEFAULT_INITIAL_CAPITAL,
    startDate: defaultStartDate(),
    endDate: defaultEndDate(),
    benchmark: DEFAULT_BENCHMARK,
    allocation: DEFAULT_ALLOCATION,
    feeRate: DEFAULT_FEE_RATE,
    slippage: DEFAULT_SLIPPAGE,
    fractionalShares: DEFAULT_FRACTIONAL_SHARES,
  }
}

function numInput(value: string): number {
  return Number(value)
}

export function BacktestView({ locale }: { locale: Locale }) {
  const t = (key: string) => translate(locale, key)
  const [config, setConfig] = useState<BacktestConfig>(initialConfig())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const errText = (field: string) => {
    const code = errors[field]
    if (!code) return null
    return t(`backtest.errors.${code}`)
  }

  const save = () => {
    const result = validateBacktestConfig(config)
    setErrors(result.errors)
    setStatus(result.valid ? 'valid' : 'invalid')
  }

  return (
    <section className="panel">
      <h1 className="panel-heading">{t('backtest.title')}</h1>
      <StatusBanner locale={locale} />
      <form className="sim-form" onSubmit={save}>
        <h2 className="form-section-title">{t('backtest.section.required')}</h2>

        <div className="field">
          <label className="field-label">{t('backtest.field.ticker')}</label>
          <input
            className="text-field"
            name="ticker"
            value={config.ticker}
            onChange={(e) => setConfig({ ...config, ticker: e.target.value })}
          />
          {errText('ticker') ? <span className="field-error">{errText('ticker')}</span> : null}
        </div>

        <div className="field">
          <label className="field-label">{t('backtest.field.strategy')}</label>
          {STRATEGIES.map((option) => (
            <button
              type="button"
              key={option.id}
              className="option-button"
              onClick={() => setConfig({ ...config, strategy: option.id })}
            >
              {t(`backtest.strategy.${option.id}`)}
            </button>
          ))}
          <p className="strategy-purpose">{t(`backtest.strategy.purpose.${config.strategy}`)}</p>
          <span className="field-note">{t('backtest.strategy.limitNote')}</span>
        </div>

        <div className="field">
          <label className="field-label">{t('backtest.field.capital')}</label>
          <input
            className="text-field"
            name="initialCapital"
            value={config.initialCapital}
            onChange={(e) => setConfig({ ...config, initialCapital: numInput(e.target.value) })}
          />
          {errText('initialCapital') ? (
            <span className="field-error">{errText('initialCapital')}</span>
          ) : null}
        </div>

        <div className="field">
          <label className="field-label">{t('backtest.field.start')}</label>
          <input
            className="text-field"
            name="startDate"
            value={config.startDate}
            onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="field-label">{t('backtest.field.end')}</label>
          <input
            className="text-field"
            name="endDate"
            value={config.endDate}
            onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
          />
          {errText('dates') ? <span className="field-error">{errText('dates')}</span> : null}
        </div>

        <h2 className="form-section-title">{t('backtest.section.advanced')}</h2>
        <button
          type="button"
          className="collapse-button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          {t('backtest.section.advanced')}
        </button>
        <span className="field-note">{t('backtest.section.advancedHint')}</span>

        {advancedOpen && (
          <>
            <div className="field">
              <label className="field-label">{t('backtest.field.benchmark')}</label>
              <input
                className="text-field"
                name="benchmark"
                value={config.benchmark}
                onChange={(e) => setConfig({ ...config, benchmark: e.target.value })}
              />
              {errText('benchmark') ? (
                <span className="field-error">{errText('benchmark')}</span>
              ) : null}
            </div>

            <div className="field">
              <label className="field-label">{t('backtest.field.allocation')}</label>
              <input
                className="text-field"
                name="allocation"
                value={config.allocation}
                onChange={(e) => setConfig({ ...config, allocation: numInput(e.target.value) })}
              />
              {errText('allocation') ? (
                <span className="field-error">{errText('allocation')}</span>
              ) : null}
            </div>

            <div className="field">
              <label className="field-label">{t('backtest.field.fee')}</label>
              <input
                className="text-field"
                name="feeRate"
                value={config.feeRate}
                onChange={(e) => setConfig({ ...config, feeRate: numInput(e.target.value) })}
              />
              {errText('feeRate') ? <span className="field-error">{errText('feeRate')}</span> : null}
            </div>

            <div className="field">
              <label className="field-label">{t('backtest.field.slippage')}</label>
              <input
                className="text-field"
                name="slippage"
                value={config.slippage}
                onChange={(e) => setConfig({ ...config, slippage: numInput(e.target.value) })}
              />
              {errText('slippage') ? (
                <span className="field-error">{errText('slippage')}</span>
              ) : null}
            </div>

            <div className="field">
              <label className="field-label">{t('backtest.field.fractional')}</label>
              <button
                type="button"
                className="option-button"
                onClick={() => setConfig({ ...config, fractionalShares: true })}
              >
                {t('backtest.field.fractionalYes')}
              </button>
              <button
                type="button"
                className="option-button"
                onClick={() => setConfig({ ...config, fractionalShares: false })}
              >
                {t('backtest.field.fractionalNo')}
              </button>
            </div>
          </>
        )}

        <div className="status-row">
          <span className="status-label">
            {status === 'invalid'
              ? t('backtest.status.invalid')
              : status === 'valid'
                ? t('backtest.status.valid')
                : t('backtest.section.required')}
          </span>
        </div>

        <div className="action-row">
          <button type="submit" className="action-button">{t('backtest.action.saveLabel')}</button>
          <span className="unavailable-label">{t('backtest.engine.unavailable')}</span>
        </div>
      </form>
    </section>
  )
}
