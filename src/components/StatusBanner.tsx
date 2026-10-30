import type { Locale } from '../state/prefs'
import { translate } from '../i18n/index'

export function StatusBanner({ locale }: { locale: Locale }) {
  const t = (key: string) => translate(locale, key)
  return (
    <div className="status-banner">
      <span className="status-label">{t('data.status.label')}</span>
      <span>{t('data.status.none')}</span>
    </div>
  )
}

