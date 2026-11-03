import type { Locale } from '../state/prefs'
import type { MarketDataset } from '../data/market'
import { StatusBanner } from '../components/StatusBanner'
import { translate } from '../i18n/index'

export function More({ locale, dataset }: { locale: Locale; dataset: MarketDataset | null }) {
  const t = (key: string) => translate(locale, key)
  return (
    <section className="panel">
      <h1 className="panel-heading">{t('common.nav.more')}</h1>
      <StatusBanner locale={locale} dataset={dataset} />
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

