import type { Locale } from '../state/prefs'
import { StatusBanner } from '../components/StatusBanner'
import { translate } from '../i18n/index'

export function Analysis({ locale }: { locale: Locale }) {
  const t = (key: string) => translate(locale, key)
  return (
    <section className="panel">
      <h1 className="panel-heading">{t('analysis.title')}</h1>
      <StatusBanner locale={locale} />
      <div className="unavailable-notice">
        <span className="unavailable-label">{t('analysis.unavailable.title')}</span>
        <p>{t('analysis.unavailable.body')}</p>
      </div>
    </section>
  )
}
