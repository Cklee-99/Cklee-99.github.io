import type { Locale } from '../state/prefs'
import { translate } from '../i18n/index'

export function LangSwitcher({
  locale,
  onLocale,
}: {
  locale: Locale
  onLocale: (next: Locale) => void
}) {
  const t = (key: string) => translate(locale, key)
  const next = locale === 'zh-TW' ? 'en' : 'zh-TW'
  const label = locale === 'zh-TW' ? 'common.lang.en' : 'common.lang.zhTW'
  return (
    <div className="lang-switcher">
      <button
        type="button"
        className="control-button"
        aria-label={t('settings.language.label')}
        onClick={() => onLocale(next)}
      >
        {t(label)}
      </button>
    </div>
  )
}


