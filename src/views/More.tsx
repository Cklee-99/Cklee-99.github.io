import type { Locale } from '../state/prefs'
import { translate } from '../i18n/index'

export function More({ locale }: { locale: Locale }) {
  const t = (key: string) => translate(locale, key)
  return (
    <section className="panel">
      <h1 className="panel-heading">{t('common.nav.more')}</h1>
      <ul className="unavailable-list">
        <li>
          <span className="unavailable-label">{t('common.more.strategyLibrary')}</span>
          <p>{t('common.more.unavailable')}</p>
        </li>
        <li>
          <span className="unavailable-label">{t('data.title')}</span>
          <p>{t('common.more.unavailable')}</p>
        </li>
        <li>
          <span className="unavailable-label">{t('common.more.simulationHistory')}</span>
          <p>{t('common.more.unavailable')}</p>
        </li>
        <li>
          <span className="unavailable-label">{t('settings.title')}</span>
          <p>{t('common.more.unavailable')}</p>
        </li>
      </ul>
    </section>
  )
}
