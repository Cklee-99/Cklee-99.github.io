import type { Locale } from '../state/prefs'
import type { MarketDataset } from '../data/market'
import { translate } from '../i18n/index'

export function StatusBanner({ locale, dataset }: { locale: Locale; dataset?: MarketDataset | null }) {
  const t = (key: string) => translate(locale, key)
  const statusKey = dataset ? `data.sources.${dataset.sourceType}` : 'data.status.none'
  return (
    <div className="status-banner">
      <span className="status-label">{t('data.status.label')}</span>
      <span>{dataset ? t(statusKey) : t('data.status.none')}</span>
    </div>
  )
}

