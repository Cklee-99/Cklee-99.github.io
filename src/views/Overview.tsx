import type { Locale } from '../state/prefs'
import { navigate } from '../router'
import { StatusBanner } from '../components/StatusBanner'
import { translate } from '../i18n/index'

export function Overview({ locale }: { locale: Locale }) {
  const t = (key: string) => translate(locale, key)
  return (
    <section className="panel">
      <h1 className="panel-heading">{t('dashboard.title')}</h1>
      <StatusBanner locale={locale} />
      <div className="unavailable-notice">
        <span className="unavailable-label">{t('dashboard.engine.unavailable')}</span>
        <p>{t('dashboard.engine.unavailableBody')}</p>
      </div>
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
